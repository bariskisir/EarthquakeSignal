/**
 * Verifies generic settings and session persistence against an isolated temporary directory.
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import StorageService from '../src/main/services/StorageService'
import type { EarthquakeEvent } from '../src/shared/types'

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

  it('allows the final session to be deleted', async () => {
    const only = await storage.createSession()
    await expect(storage.deleteSession(only.id)).resolves.toEqual({ deleted: true })
    expect(await storage.listSessions()).toHaveLength(0)
  })

  it('deletes all sessions in one operation', async () => {
    await storage.createSession('First')
    await storage.createSession('Second')

    await storage.deleteAllSessions()

    expect(await storage.listSessions()).toHaveLength(0)
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

  it('persists an earthquake and updates later revisions in the same session', async () => {
    const first: EarthquakeEvent = {
      id: 'event-42',
      kind: 'realtime',
      source: 'test',
      latitude: 39.9,
      longitude: 32.8,
      receivedAt: '2026-01-01T00:00:00.000Z',
      revision: 1,
      estimatedIntensity: 2.4,
    }
    const created = await storage.upsertEarthquakeSession(first, 'Realtime Ankara')
    const updated = await storage.upsertEarthquakeSession(
      { ...first, receivedAt: '2026-01-01T00:01:00.000Z', revision: 2 },
      'Realtime Ankara update',
    )

    expect(updated.id).toBe(created.id)
    expect(updated.earthquake?.revision).toBe(2)
    expect(await storage.listSessions()).toHaveLength(1)
  })
})
