/**
 * Stores validated settings and sessions through serialized direct JSON file access.
 */

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  AppSettings,
  AppSettingsPatch,
  DeleteSessionResult,
  SessionDocument,
  SessionSummary,
} from '@shared/types'
import { z } from 'zod'
import { parsePersistedSettings, settingsSchema } from '../settingsSchema'

const sessionSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(200),
  isDefaultTitle: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const DEFAULT_SESSION_TITLE = 'New Session'
const LEGACY_DEFAULT_TITLE_PATTERN = /^\d{4}-\d{2}-\d{2}\s*(?:\u00b7|\.|T)\s*\d{2}:\d{2}$/

/** Keeps generic session metadata while discarding fields owned by removed features. */
const migrateSession = (input: unknown): unknown => {
  if (!input || typeof input !== 'object') return input
  const session = input as Record<string, unknown>
  const hasLegacyDefaultTitle =
    typeof session.title === 'string' &&
    (session.title === DEFAULT_SESSION_TITLE || LEGACY_DEFAULT_TITLE_PATTERN.test(session.title))
  const isDefaultTitle =
    typeof session.isDefaultTitle === 'boolean' ? session.isDefaultTitle : hasLegacyDefaultTitle
  return {
    id: session.id,
    title:
      isDefaultTitle &&
      typeof session.title === 'string' &&
      LEGACY_DEFAULT_TITLE_PATTERN.test(session.title)
        ? DEFAULT_SESSION_TITLE
        : session.title,
    isDefaultTitle,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }
}

/** Rejects identifiers that could escape the session directory. */
const assertSessionId = (id: string): void => {
  if (!z.uuid().safeParse(id).success) throw new Error('Invalid session identifier.')
}

export default class StorageService {
  private readonly settingsPath: string
  private readonly sessionsPath: string
  private readonly fileOperationTails = new Map<string, Promise<void>>()

  /** Creates a storage service rooted in the private application data directory. */
  public constructor(private readonly rootPath: string) {
    this.settingsPath = join(rootPath, 'settings.json')
    this.sessionsPath = join(rootPath, 'sessions')
  }

  /** Creates required directories and removes obsolete temporary files. */
  public async initialize(): Promise<void> {
    await mkdir(this.rootPath, { recursive: true })
    await mkdir(this.sessionsPath, { recursive: true })
    await Promise.all([
      this.removeObsoleteTemporaryFiles(this.rootPath),
      this.removeObsoleteTemporaryFiles(this.sessionsPath),
    ])
  }

  /** Loads validated settings or safe defaults for missing or malformed data. */
  public async loadSettings(): Promise<AppSettings> {
    return this.withFileLock(this.settingsPath, () => this.readSettingsUnlocked())
  }

  /** Reads settings while its caller owns the settings-file operation lock. */
  private async readSettingsUnlocked(): Promise<AppSettings> {
    try {
      const value: unknown = JSON.parse(await readFile(this.settingsPath, 'utf8'))
      return parsePersistedSettings(value)
    } catch {
      return parsePersistedSettings(null)
    }
  }

  /** Validates and writes application settings directly to their JSON file. */
  public async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const validated = settingsSchema.parse(settings)
    await this.writeJsonFile(this.settingsPath, validated)
    return validated
  }

  /** Atomically merges changed fields into the latest validated settings document. */
  public async updateSettings(patch: AppSettingsPatch): Promise<AppSettings> {
    return this.withFileLock(this.settingsPath, async () => {
      const current = await this.readSettingsUnlocked()
      const validated = settingsSchema.parse({ ...current, ...patch })
      await this.writeJsonFileUnlocked(this.settingsPath, validated)
      return validated
    })
  }

  /** Creates a new empty session. */
  public async createSession(title?: string): Promise<SessionDocument> {
    const now = new Date().toISOString()
    const normalizedTitle = title?.trim().slice(0, 200)
    const session: SessionDocument = {
      id: randomUUID(),
      title: normalizedTitle || DEFAULT_SESSION_TITLE,
      isDefaultTitle: !normalizedTitle,
      createdAt: now,
      updatedAt: now,
    }
    await this.writeSession(session)
    return session
  }

  /** Loads and validates one complete session. */
  public async getSession(id: string): Promise<SessionDocument> {
    assertSessionId(id)
    const filePath = this.sessionPath(id)
    return this.withFileLock(filePath, () => this.readSessionUnlocked(filePath))
  }

  /** Lists compact session summaries in reverse chronological order. */
  public async listSessions(): Promise<SessionSummary[]> {
    const entries = await readdir(this.sessionsPath, { withFileTypes: true })
    const documents = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => this.tryReadSession(join(this.sessionsPath, entry.name))),
    )

    return documents
      .filter((document): document is SessionDocument => document !== null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }

  /** Renames a session within a serialized file operation. */
  public async renameSession(id: string, title: string): Promise<SessionDocument> {
    const normalizedTitle = title.trim().slice(0, 200)
    if (!normalizedTitle) throw new Error('Session title cannot be empty.')
    return this.updateSession(id, (session) => {
      session.title = normalizedTitle
      session.isDefaultTitle = false
      session.updatedAt = new Date().toISOString()
    })
  }

  /** Deletes a session while preserving the last workspace. */
  public async deleteSession(id: string): Promise<DeleteSessionResult> {
    assertSessionId(id)
    return this.withFileLock(this.sessionsPath, () => this.deleteSessionUnlocked(id))
  }

  /** Performs one deletion while holding the workspace-wide history lock. */
  private async deleteSessionUnlocked(id: string): Promise<DeleteSessionResult> {
    const sessions = await this.listSessions()
    if (!sessions.some((session) => session.id === id) || sessions.length <= 1) {
      return { deleted: false }
    }

    try {
      await this.withFileLock(this.sessionPath(id), () => unlink(this.sessionPath(id)))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    return { deleted: true }
  }

  /** Reads one session while tolerating malformed history entries. */
  private async tryReadSession(filePath: string): Promise<SessionDocument | null> {
    try {
      return await this.withFileLock(filePath, () => this.readSessionUnlocked(filePath))
    } catch {
      return null
    }
  }

  /** Applies one session mutation without allowing another operation to interleave. */
  private async updateSession(
    id: string,
    update: (session: SessionDocument) => void,
  ): Promise<SessionDocument> {
    assertSessionId(id)
    const filePath = this.sessionPath(id)
    return this.withFileLock(filePath, async () => {
      const session = await this.readSessionUnlocked(filePath)
      update(session)
      const validated = sessionSchema.parse(session)
      await this.writeJsonFileUnlocked(filePath, validated)
      return validated
    })
  }

  /** Validates and writes a complete session document. */
  private async writeSession(session: SessionDocument): Promise<void> {
    const validated = sessionSchema.parse(session)
    await this.writeJsonFile(this.sessionPath(validated.id), validated)
  }

  /** Reads a session while its caller owns the file-operation lock. */
  private async readSessionUnlocked(filePath: string): Promise<SessionDocument> {
    const value: unknown = JSON.parse(await readFile(filePath, 'utf8'))
    return sessionSchema.parse(migrateSession(value))
  }

  /** Resolves a validated session identifier to its JSON file. */
  private sessionPath(id: string): string {
    return join(this.sessionsPath, `${id}.json`)
  }

  /** Serializes and writes one JSON value directly to its destination file. */
  private async writeJsonFile(filePath: string, value: unknown): Promise<void> {
    await this.withFileLock(filePath, () => this.writeJsonFileUnlocked(filePath, value))
  }

  /** Writes one complete JSON payload while its caller owns the file-operation lock. */
  private async writeJsonFileUnlocked(filePath: string, value: unknown): Promise<void> {
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  }

  /** Runs one operation after every earlier operation targeting the same file. */
  private async withFileLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.fileOperationTails.get(filePath) ?? Promise.resolve()
    let release = (): void => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const tail = previous.catch(() => undefined).then(() => gate)
    this.fileOperationTails.set(filePath, tail)
    await previous.catch(() => undefined)
    try {
      return await operation()
    } finally {
      release()
      if (this.fileOperationTails.get(filePath) === tail) this.fileOperationTails.delete(filePath)
    }
  }

  /** Removes only obsolete temporary files created by older direct-write builds. */
  private async removeObsoleteTemporaryFiles(directoryPath: string): Promise<void> {
    const entries = await readdir(directoryPath, { withFileTypes: true })
    await Promise.allSettled(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.tmp'))
        .map((entry) => unlink(join(directoryPath, entry.name))),
    )
  }
}
