/**
 * Verifies generic settings and session persistence against an isolated temporary directory.
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import StorageService from '../src/main/services/StorageService'

let rootPath = ''
let storage: StorageService

beforeEach(async () => {
  rootPath = await mkdtemp(join(tmpdir(), 'earthquake-signal-test-'))
  storage = new StorageService(rootPath)
  await storage.initialize()
})

afterEach(async () => {
  await rm(rootPath, { recursive: true, force: true })
})

describe('StorageService', () => {
  it('creates and lists generic sessions', async () => {
    const created = await storage.createSession()
    const sessions = await storage.listSessions()

    expect(created.title).toBe('New Session')
    expect(created.isDefaultTitle).toBe(true)
    expect(sessions).toEqual([created])
  })

  it('renames and reloads a session', async () => {
    const created = await storage.createSession()
    const renamed = await storage.renameSession(created.id, 'My Session')

    expect(renamed).toMatchObject({ title: 'My Session', isDefaultTitle: false })
    await expect(storage.getSession(created.id)).resolves.toEqual(renamed)
  })

  it('preserves the final session workspace', async () => {
    const only = await storage.createSession()
    await expect(storage.deleteSession(only.id)).resolves.toEqual({ deleted: false })

    const second = await storage.createSession()
    await expect(storage.deleteSession(second.id)).resolves.toEqual({ deleted: true })
    expect(await storage.listSessions()).toHaveLength(1)
  })

  it('drops obsolete fields while loading older session documents', async () => {
    const created = await storage.createSession()
    const filePath = join(rootPath, 'sessions', `${created.id}.json`)
    const legacy = JSON.parse(await readFile(filePath, 'utf8')) as Record<string, unknown>
    await writeFile(filePath, JSON.stringify({ ...legacy, removedContent: ['old'] }), 'utf8')

    const loaded = await storage.getSession(created.id)
    expect(loaded).toEqual(created)
    expect(loaded).not.toHaveProperty('removedContent')
  })

  it('serializes and persists settings patches', async () => {
    const saved = await storage.updateSettings({ theme: 'light', logLevel: 'debug' })
    expect(saved).toMatchObject({ theme: 'light', logLevel: 'debug' })
    await expect(storage.loadSettings()).resolves.toEqual(saved)
  })
})
