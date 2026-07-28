/**
 * Receives Firebase push messages, maintains the two desired topics, and persists earthquakes.
 */

import { createHash, randomUUID } from 'node:crypto'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Notification, safeStorage, screen, type BrowserWindow, type Rectangle } from 'electron'
import PushReceiver from '@eneris/push-receiver'
import type { Types } from '@eneris/push-receiver/dist/client'
import {
  calculateDestinationCoordinates,
  calculateDistanceKm,
  createEarthquakeTopics,
} from '@shared/earthquake'
import {
  createEarthquakeNotificationUrl,
  createWindowsEarthquakeToastXml,
} from '@shared/earthquakeNotification'
import type {
  AppSettings,
  EarthquakeEvent,
  EarthquakeEventKind,
  EarthquakeNotificationOpenEvent,
  EarthquakeReceivedEvent,
  EarthquakeServiceStatus,
  SessionDocument,
} from '@shared/types'
import { z } from 'zod'
import {
  EARTHQUAKE_NETWORK_FIREBASE_CONFIG,
  EARTHQUAKE_NETWORK_PACKAGE_ID,
  EARTHQUAKE_NETWORK_REGISTER_URL,
  EARTHQUAKE_NETWORK_UPDATE_TILE_URL,
} from '../earthquakeNetworkConfig'
import type LoggerService from './LoggerService'
import type StorageService from './StorageService'

const firebaseConfigSchema = z.object({
  projectId: z.string().min(1),
  appId: z.string().min(1),
  apiKey: z.string().min(1),
  messagingSenderId: z.string().min(1),
  authDomain: z.string().optional(),
  databaseURL: z.string().optional(),
  storageBucket: z.string().optional(),
  measurementId: z.string().optional(),
})
const firebaseAuthTokenResponseSchema = z.object({
  token: z.string().min(1),
  expiresIn: z.string().regex(/^\d+s$/),
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const credentialsSchema = z.custom<Types.Credentials>(
  (value) =>
    isRecord(value) &&
    isRecord(value.gcm) &&
    isRecord(value.fcm) &&
    isRecord(value.keys) &&
    isRecord(value.config),
)

const receiverStateSchema = z.object({
  credentials: credentialsSchema.optional(),
  persistentIds: z.array(z.string()).max(500).default([]),
  backendUserId: z.string().regex(/^\d+$/).optional(),
})
const legacyEncryptedReceiverStateSchema = z.object({ encrypted: z.string().min(1) })

interface ReceiverState {
  credentials?: Types.Credentials | undefined
  persistentIds: string[]
  backendUserId?: string | undefined
}

interface FullscreenWindowState {
  bounds: Rectangle
  maximized: boolean
  visible: boolean
}

type StatusListener = (status: EarthquakeServiceStatus) => void
type EarthquakeListener = (event: EarthquakeReceivedEvent) => void
type NotificationOpenListener = (event: EarthquakeNotificationOpenEvent) => void

/** Coordinates the long-lived desktop FCM receiver and earthquake notification policy. */
export default class EarthquakeService {
  private settings: AppSettings
  private receiver: PushReceiver | null = null
  private checkTimer: NodeJS.Timeout | null = null
  private refreshPromise: Promise<EarthquakeServiceStatus> | null = null
  private refreshAfterCurrent = false
  private stateWriteTail: Promise<void> = Promise.resolve()
  private fullscreenWindowState: FullscreenWindowState | null = null
  private fullscreenRetryTimers: NodeJS.Timeout[] = []
  private status: EarthquakeServiceStatus
  private readonly statusListeners = new Set<StatusListener>()
  private readonly earthquakeListeners = new Set<EarthquakeListener>()
  private readonly notificationOpenListeners = new Set<NotificationOpenListener>()

  /** Creates an inactive receiver; start is called after the renderer window exists. */
  public constructor(
    private readonly storage: StorageService,
    private readonly logger: LoggerService,
    private readonly dataRoot: string,
    private readonly window: BrowserWindow,
    settings: AppSettings,
    private readonly appVersion: string,
    private readonly notificationProtocol: string | null,
  ) {
    this.settings = settings
    this.status = {
      state: 'disconnected',
      topics: createEarthquakeTopics(settings.earthquakeLatitude, settings.earthquakeLongitude),
      subscribedTopics: [],
    }
  }

  /** Starts FCM registration immediately and plans the next minute-based check. */
  public async start(): Promise<EarthquakeServiceStatus> {
    return this.refresh()
  }

  /** Returns an immutable snapshot safe for IPC serialization. */
  public getStatus(): EarthquakeServiceStatus {
    return structuredClone(this.status)
  }

  /** Applies notification preferences and reconnects when location or cadence changes. */
  public applySettings(settings: AppSettings): void {
    const connectionChanged =
      settings.earthquakeLatitude !== this.settings.earthquakeLatitude ||
      settings.earthquakeLongitude !== this.settings.earthquakeLongitude ||
      settings.fcmCheckIntervalMinutes !== this.settings.fcmCheckIntervalMinutes
    this.settings = settings
    this.status = {
      ...this.status,
      topics: createEarthquakeTopics(settings.earthquakeLatitude, settings.earthquakeLongitude),
      ...(connectionChanged ? { subscribedTopics: [] } : {}),
    }
    this.scheduleNextCheck()
    if (connectionChanged) {
      if (this.refreshPromise) this.refreshAfterCurrent = true
      else void this.refresh()
    }
  }

  /** Registers one main-process status sink. */
  public onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  /** Registers one newly persisted earthquake sink. */
  public onEarthquake(listener: EarthquakeListener): () => void {
    this.earthquakeListeners.add(listener)
    return () => this.earthquakeListeners.delete(listener)
  }

  /** Registers one native-notification activation sink. */
  public onNotificationOpen(listener: NotificationOpenListener): () => void {
    this.notificationOpenListeners.add(listener)
    return () => this.notificationOpenListeners.delete(listener)
  }

  /** Focuses the application and requests the stored notification target in the renderer. */
  public openNotification(sessionId: string): void {
    if (this.window.isMinimized()) this.window.restore()
    this.window.show()
    this.window.focus()
    const event = { sessionId }
    this.notificationOpenListeners.forEach((listener) => {
      listener(event)
    })
  }

  /** Recreates the receiver, obtains its token, and replaces the two gateway topics. */
  public refresh(): Promise<EarthquakeServiceStatus> {
    if (this.refreshPromise) return this.refreshPromise
    this.refreshPromise = this.connectReceiver().finally(() => {
      this.refreshPromise = null
      this.scheduleNextCheck()
      if (this.refreshAfterCurrent) {
        this.refreshAfterCurrent = false
        void this.refresh()
      }
    })
    return this.refreshPromise
  }

  /** Removes the exact local FCM state file and creates a fresh Firebase/backend identity. */
  public async resetRegistration(): Promise<EarthquakeServiceStatus> {
    if (this.refreshPromise) await this.refreshPromise
    if (this.checkTimer) clearTimeout(this.checkTimer)
    this.checkTimer = null
    this.receiver?.destroy()
    this.receiver = null
    await this.stateWriteTail.catch(() => undefined)
    const statePath = join(this.dataRoot, 'fcm-state.json')
    await rm(statePath, { force: true })
    this.refreshAfterCurrent = false
    this.updateStatus({
      state: 'disconnected',
      topics: createEarthquakeTopics(
        this.settings.earthquakeLatitude,
        this.settings.earthquakeLongitude,
      ),
      subscribedTopics: [],
      message: 'The previous FCM registration was removed.',
    })
    this.logger.info('EarthquakeService', 'Local FCM registration state removed and reset started.')
    return this.refresh()
  }

  /** Simulates a random event through the same persistence and notification pipeline. */
  public async test(kind: EarthquakeEventKind): Promise<SessionDocument> {
    const requestedDistanceKm = 100 + Math.random() * 400
    const [latitude, longitude] = calculateDestinationCoordinates(
      this.settings.earthquakeLatitude,
      this.settings.earthquakeLongitude,
      requestedDistanceKm,
      Math.random() * 360,
    )
    const distanceKm = calculateDistanceKm(
      this.settings.earthquakeLatitude,
      this.settings.earthquakeLongitude,
      latitude,
      longitude,
    )
    const magnitude = Number(
      (Math.max(this.settings.seismicMinimumMagnitude, 4) + Math.random()).toFixed(1),
    )
    const receivedAt = new Date().toISOString()
    const earthquake: EarthquakeEvent = {
      id: createHash('sha256').update(`test:${randomUUID()}`).digest('hex'),
      kind,
      source: 'Earthquake Signal Test',
      latitude: Number(latitude.toFixed(4)),
      longitude: Number(longitude.toFixed(4)),
      receivedAt,
      occurredAt: receivedAt,
      magnitude,
      depthKm: Number((5 + Math.random() * 15).toFixed(1)),
      place: `${Math.round(distanceKm)} km test event`,
      distanceKm: Number(distanceKm.toFixed(1)),
      ...(kind === 'realtime'
        ? {
            revision: 1,
            estimatedIntensity: Number((4 + Math.random()).toFixed(1)),
            warning: 'Realtime alert test',
          }
        : { warning: 'Seismic network notification test' }),
    }
    return (await this.processEarthquake(earthquake)).session
  }

  /** Stops timers and the underlying persistent FCM socket. */
  public dispose(): void {
    if (this.checkTimer) clearTimeout(this.checkTimer)
    this.checkTimer = null
    this.receiver?.destroy()
    this.receiver = null
    this.clearFullscreenRetries()
    this.statusListeners.clear()
    this.earthquakeListeners.clear()
    this.notificationOpenListeners.clear()
  }

  /** Establishes one fresh receiver so application starts and upgrades always reschedule work. */
  private async connectReceiver(): Promise<EarthquakeServiceStatus> {
    const firebase = this.loadFirebaseConfig()
    const topics = createEarthquakeTopics(
      this.settings.earthquakeLatitude,
      this.settings.earthquakeLongitude,
    )
    if (!firebase) {
      this.logger.warn(
        'EarthquakeService',
        'FCM receiver is not configured; EARTHQUAKE_FIREBASE_CONFIG is missing or invalid.',
      )
      this.updateStatus({
        state: 'not-configured',
        topics,
        subscribedTopics: [],
        lastCheckedAt: new Date().toISOString(),
        message: 'Firebase client configuration is not configured.',
      })
      return this.getStatus()
    }

    this.updateStatus({ state: 'connecting', topics, subscribedTopics: [] })
    this.receiver?.destroy()
    const persisted = await this.loadReceiverState()
    const vapidKey = process.env.EARTHQUAKE_FIREBASE_VAPID_KEY ?? ''
    const reusableCredentials = persisted.credentials
      ? await this.refreshFirebaseInstallationIfNeeded(persisted.credentials, firebase, vapidKey)
      : undefined
    const receiver = new PushReceiver({
      firebase,
      debug: false,
      persistentIds: persisted.persistentIds,
      ...(reusableCredentials ? { credentials: reusableCredentials } : {}),
      ...(vapidKey ? { vapidKey } : {}),
      bundleId: EARTHQUAKE_NETWORK_PACKAGE_ID,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    this.receiver = receiver
    receiver.onCredentialsChanged(({ newCredentials }) => {
      void this.saveReceiverState({
        credentials: newCredentials,
        persistentIds: receiver.persistentIds.slice(-500),
        ...(persisted.backendUserId ? { backendUserId: persisted.backendUserId } : {}),
      })
    })
    receiver.onNotification((envelope) => {
      void this.receiveEnvelope(envelope, receiver)
    })

    try {
      await receiver.connect()
      const token = receiver.fcmToken
      const credentials = await receiver.registerIfNeeded()
      let backendUserId = persisted.backendUserId
      let backendRegistered = false
      try {
        backendUserId = await this.registerEarthquakeNetworkBackend(token, backendUserId)
        await this.updateEarthquakeNetworkTile(backendUserId, topics[1] ?? '')
        backendRegistered = true
      } catch (error) {
        this.logger.error(
          'EarthquakeService',
          'Earthquake Network backend registration failed.',
          error,
        )
      }
      await this.saveReceiverState({
        credentials,
        persistentIds: receiver.persistentIds.slice(-500),
        ...(backendUserId ? { backendUserId } : {}),
      })
      const gatewaySubscribed = await this.replaceGatewayTopics(token, topics)
      const subscribed = gatewaySubscribed || backendRegistered
      this.updateStatus({
        state: 'connected',
        topics,
        subscribedTopics: subscribed ? topics : [],
        token,
        ...(backendUserId ? { backendUserId } : {}),
        firebaseInstallationId: credentials.fcm.installation.fid,
        gcmAndroidId: credentials.gcm.androidId,
        gcmAppId: credentials.gcm.appId,
        firebaseProjectId: credentials.config.projectId,
        packageId: credentials.config.bundleId,
        installationCreatedAt: new Date(credentials.fcm.installation.createdAt).toISOString(),
        authTokenExpiresAt: new Date(
          credentials.fcm.installation.createdAt + credentials.fcm.installation.expiresIn,
        ).toISOString(),
        persistentMessageCount: receiver.persistentIds.length,
        lastCheckedAt: new Date().toISOString(),
        ...(backendRegistered
          ? { message: 'FCM token is registered with the Earthquake Network backend.' }
          : !subscribed
            ? { message: 'FCM token is ready; backend channel registration failed.' }
            : {}),
      })
      this.logger.info('EarthquakeService', 'FCM receiver connected.', {
        topics,
        subscribedTopics: subscribed ? topics : [],
        token,
        backendUserId,
        firebaseInstallationId: credentials.fcm.installation.fid,
        gcmAndroidId: credentials.gcm.androidId,
        gcmAppId: credentials.gcm.appId,
        firebaseProjectId: credentials.config.projectId,
        packageId: credentials.config.bundleId,
        installationCreatedAt: new Date(credentials.fcm.installation.createdAt).toISOString(),
        authTokenExpiresAt: new Date(
          credentials.fcm.installation.createdAt + credentials.fcm.installation.expiresIn,
        ).toISOString(),
        persistentMessageCount: receiver.persistentIds.length,
        latitude: this.settings.earthquakeLatitude,
        longitude: this.settings.earthquakeLongitude,
      })
      if (!gatewaySubscribed && !backendRegistered) {
        this.logger.warn(
          'EarthquakeService',
          'FCM token is connected, but EARTHQUAKE_FCM_GATEWAY_URL is not configured.',
        )
      }
    } catch (error) {
      receiver.destroy()
      if (this.receiver === receiver) this.receiver = null
      this.updateStatus({
        state: 'error',
        topics,
        subscribedTopics: [],
        lastCheckedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'FCM connection failed.',
      })
      this.logger.error('EarthquakeService', 'FCM receiver could not connect.', error)
    }
    return this.getStatus()
  }

  /** Loads an optional runtime override or the authorized configuration extracted from the APK. */
  private loadFirebaseConfig(): Types.FirebaseConfig | null {
    const serialized = process.env.EARTHQUAKE_FIREBASE_CONFIG
    if (!serialized) return { ...EARTHQUAKE_NETWORK_FIREBASE_CONFIG }
    try {
      const parsed = firebaseConfigSchema.parse(JSON.parse(serialized))
      return {
        projectId: parsed.projectId,
        appId: parsed.appId,
        apiKey: parsed.apiKey,
        messagingSenderId: parsed.messagingSenderId,
        ...(parsed.authDomain ? { authDomain: parsed.authDomain } : {}),
        ...(parsed.databaseURL ? { databaseURL: parsed.databaseURL } : {}),
        ...(parsed.storageBucket ? { storageBucket: parsed.storageBucket } : {}),
        ...(parsed.measurementId ? { measurementId: parsed.measurementId } : {}),
      }
    } catch (error) {
      this.logger.warn('EarthquakeService', 'Firebase client configuration is invalid.', error)
      return null
    }
  }

  /** Mirrors the APK token registration and returns its stable numeric backend user id. */
  private async registerEarthquakeNetworkBackend(
    token: string,
    existingUserId?: string,
  ): Promise<string> {
    const response = await fetch(EARTHQUAKE_NETWORK_REGISTER_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams({
        u_id: existingUserId ?? '0',
        r_id: token,
        lat: String(this.settings.earthquakeLatitude),
        lon: String(this.settings.earthquakeLongitude),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      throw new Error(`Earthquake Network registration returned HTTP ${response.status}.`)
    }
    const userId = (await response.text()).trim()
    if (!/^\d+$/.test(userId) || userId === '0') {
      throw new Error('Earthquake Network registration returned an invalid user id.')
    }
    this.logger.info('EarthquakeService', 'FCM token registered with Earthquake Network backend.', {
      endpoint: EARTHQUAKE_NETWORK_REGISTER_URL,
      request: {
        u_id: existingUserId ?? '0',
        r_id: token,
        lat: this.settings.earthquakeLatitude,
        lon: this.settings.earthquakeLongitude,
      },
      response: { backendUserId: userId },
    })
    return userId
  }

  /** Mirrors the APK location-topic report after a successful token registration. */
  private async updateEarthquakeNetworkTile(userId: string, tile: string): Promise<void> {
    if (!tile) throw new Error('Earthquake Network tile topic is empty.')
    const response = await fetch(EARTHQUAKE_NETWORK_UPDATE_TILE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams({ u_id: userId, tile }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) {
      throw new Error(`Earthquake Network tile update returned HTTP ${response.status}.`)
    }
    this.logger.info('EarthquakeService', 'Earthquake Network tile registration updated.', {
      endpoint: EARTHQUAKE_NETWORK_UPDATE_TILE_URL,
      backendUserId: userId,
      tile,
    })
  }

  /** Refreshes an expiring Firebase installation auth token as the mobile SDK does. */
  private async refreshFirebaseInstallationIfNeeded(
    credentials: Types.Credentials,
    firebase: Types.FirebaseConfig,
    vapidKey: string,
  ): Promise<Types.Credentials | undefined> {
    const expectedConfig = {
      bundleId: EARTHQUAKE_NETWORK_PACKAGE_ID,
      projectId: firebase.projectId,
      vapidKey,
    }
    if (JSON.stringify(credentials.config) !== JSON.stringify(expectedConfig)) return undefined

    const installation = credentials.fcm.installation
    const refreshBufferMs = 60 * 60 * 1000
    if (Date.now() + refreshBufferMs < installation.createdAt + installation.expiresIn) {
      return credentials
    }

    try {
      const endpoint =
        `https://firebaseinstallations.googleapis.com/v1/projects/` +
        `${encodeURIComponent(firebase.projectId)}/installations/` +
        `${encodeURIComponent(installation.fid)}/authTokens:generate`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `FIS_v2 ${installation.refreshToken}`,
          'content-type': 'application/json',
          'x-goog-api-key': firebase.apiKey,
        },
        body: JSON.stringify({ installation: { sdkVersion: 'a:19.1.2' } }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) {
        throw new Error(`Firebase installation refresh returned HTTP ${response.status}.`)
      }
      const refreshed = firebaseAuthTokenResponseSchema.parse(await response.json())
      const expiresIn = Number.parseInt(refreshed.expiresIn.slice(0, -1), 10) * 1000
      const updated = structuredClone(credentials)
      updated.fcm.installation = {
        ...installation,
        token: refreshed.token,
        createdAt: Date.now(),
        expiresIn,
      }
      this.logger.info('EarthquakeService', 'Firebase installation auth token refreshed.', {
        firebaseInstallationId: installation.fid,
        installationAuthToken: refreshed.token,
        refreshedAt: new Date(updated.fcm.installation.createdAt).toISOString(),
        expiresAt: new Date(
          updated.fcm.installation.createdAt + updated.fcm.installation.expiresIn,
        ).toISOString(),
        expiresInMs: updated.fcm.installation.expiresIn,
      })
      return updated
    } catch (error) {
      this.logger.warn(
        'EarthquakeService',
        'Firebase installation refresh failed; a new installation will be registered.',
        error,
      )
      return undefined
    }
  }

  /** Replaces gateway topic membership with exactly global plus the fixed location tile. */
  private async replaceGatewayTopics(token: string, topics: string[]): Promise<boolean> {
    const gateway = process.env.EARTHQUAKE_FCM_GATEWAY_URL
    if (!gateway) return false
    const response = await fetch(gateway, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.EARTHQUAKE_FCM_GATEWAY_TOKEN
          ? { authorization: `Bearer ${process.env.EARTHQUAKE_FCM_GATEWAY_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        token,
        topics,
        replaceTopics: true,
        latitude: this.settings.earthquakeLatitude,
        longitude: this.settings.earthquakeLongitude,
        appVersion: this.appVersion,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`Topic gateway returned HTTP ${response.status}.`)
    return true
  }

  /** Converts a package message envelope to the common earthquake model. */
  private async receiveEnvelope(
    envelope: Types.MessageEnvelope,
    receiver: PushReceiver,
  ): Promise<void> {
    this.logger.info('EarthquakeService', 'Raw FCM message received.', envelope)
    try {
      const earthquake = this.parseEarthquake(envelope)
      await this.saveReceiverState({
        ...(await this.loadReceiverState()),
        persistentIds: receiver.persistentIds.slice(-500),
      })
      this.status = {
        ...this.status,
        persistentMessageCount: receiver.persistentIds.length,
      }
      this.emitStatus()
      if (!earthquake) {
        this.logger.warn('EarthquakeService', 'An FCM message had no valid earthquake coordinates.')
        return
      }
      await this.processEarthquake(earthquake)
    } catch (error) {
      this.logger.error(
        'EarthquakeService',
        'FCM earthquake message could not be processed.',
        error,
      )
    }
  }

  /** Runs one normalized event through shared production side effects. */
  private async processEarthquake(earthquake: EarthquakeEvent): Promise<EarthquakeReceivedEvent> {
    const title = this.createSessionTitle(earthquake)
    const session = await this.storage.upsertEarthquakeSession(earthquake, title)
    const shouldNotify = this.shouldNotify(earthquake)
    const presentation = this.resolvePresentation(earthquake, shouldNotify)
    if (shouldNotify) {
      this.showNativeNotification(earthquake, title, session.id)
    }
    if (presentation === 'fullscreen') this.showFullscreenWindow()
    const received = {
      session,
      presentation,
      shouldAlarm: this.shouldPlayAlarm(earthquake, presentation),
    }
    this.earthquakeListeners.forEach((listener) => {
      listener(received)
    })
    return received
  }

  /** Accepts the compact mobile payload aliases used by normal and real-time messages. */
  private parseEarthquake(envelope: Types.MessageEnvelope): EarthquakeEvent | null {
    const base = envelope.message.data ?? {}
    const nested = this.parseNestedPayload(
      base.payload ?? base.data ?? base.notification_data ?? base.notification_bundle,
    )
    const data = { ...base, ...nested }
    const latitude = this.readNumber(data, [
      'latitude',
      'lat',
      'y',
      'latitude_eqn',
      'latitude_notification',
      'official_lat_notification',
      'preliminary_latitude',
    ])
    const longitude = this.readNumber(data, [
      'longitude',
      'lng',
      'lon',
      'x',
      'longitude_eqn',
      'longitude_notification',
      'official_lon_notification',
      'preliminary_longitude',
    ])
    if (latitude === null || longitude === null) return null
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null

    const rawType = this.readString(data, ['type', 'eventType', 'notificationType'])?.toLowerCase()
    const realtime =
      rawType?.includes('real') === true ||
      rawType?.includes('eqn') === true ||
      data.eqn_notification !== undefined ||
      data.realtime !== undefined ||
      data.upd !== undefined ||
      data.revision !== undefined
    const kind = realtime ? 'realtime' : 'seismic-network'
    const magnitude = this.readNumber(data, [
      'magnitude',
      'mag',
      'm',
      'magnitude_eqn',
      'official_mag_notification',
      'preliminary_magnitude',
    ])
    const depthKm = this.readNumber(data, ['depth', 'depthKm', 'dep'])
    const revision = this.readNumber(data, ['revision', 'upd', 'update'])
    const source =
      this.readString(data, ['source', 'provider', 'network', 'official_provider_notification']) ??
      'Earthquake Network'
    const place =
      this.readString(data, ['place', 'location', 'city', 'region', 'notification_title']) ??
      envelope.message.notification?.body
    const distanceKm = calculateDistanceKm(
      this.settings.earthquakeLatitude,
      this.settings.earthquakeLongitude,
      latitude,
      longitude,
    )
    const providedIntensity = this.readNumber(data, [
      'intensity_at_location_eqn',
      'intensity_eqn',
      'intensity',
      'mmi',
      'estimatedIntensity',
    ])
    const estimatedIntensity =
      providedIntensity ??
      (magnitude === null ? null : this.estimateIntensity(magnitude, distanceKm, depthKm ?? 0))
    const eventKey =
      this.readString(data, ['code', 'eventId', 'id', 'earthquakeId']) ??
      envelope.message.fcmMessageId ??
      envelope.persistentId
    const receivedAt = new Date().toISOString()
    const occurredAt = this.readDate(data, [
      'occurredAt',
      'datetime',
      'date',
      'timestamp',
      'time',
      'official_date_notification',
    ])
    const warning = this.readString(data, ['warning', 'message', 'official_reports_notification'])

    return {
      id: createHash('sha256').update(`${kind}:${eventKey}`).digest('hex'),
      kind,
      source,
      latitude,
      longitude,
      receivedAt,
      distanceKm: Number(distanceKm.toFixed(1)),
      ...(occurredAt ? { occurredAt } : {}),
      ...(magnitude === null ? {} : { magnitude }),
      ...(depthKm === null ? {} : { depthKm }),
      ...(place ? { place } : {}),
      ...(revision === null ? {} : { revision: Math.max(0, Math.round(revision)) }),
      ...(estimatedIntensity === null
        ? {}
        : { estimatedIntensity: Number(estimatedIntensity.toFixed(1)) }),
      ...(warning ? { warning } : {}),
    }
  }

  /** Parses a JSON-encoded nested data field while rejecting arrays and primitives. */
  private parseNestedPayload(value: unknown): Record<string, unknown> {
    if (isRecord(value)) return value
    if (typeof value !== 'string') return {}
    try {
      const parsed: unknown = JSON.parse(value)
      return isRecord(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  /** Reads the first finite numeric payload alias. */
  private readNumber(data: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = data[key]
      const number =
        typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
      if (Number.isFinite(number)) return number
    }
    return null
  }

  /** Reads the first non-empty string payload alias. */
  private readString(data: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = data[key]
      if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 1_000)
    }
    return null
  }

  /** Converts second/millisecond epochs and ISO-compatible date strings. */
  private readDate(data: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = data[key]
      const numeric =
        typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
      const date = Number.isFinite(numeric)
        ? new Date(numeric < 10_000_000_000 ? numeric * 1_000 : numeric)
        : typeof value === 'string'
          ? new Date(value)
          : null
      if (date && !Number.isNaN(date.getTime())) return date.toISOString()
    }
    return null
  }

  /** Estimates local macroseismic intensity when a realtime payload omits it. */
  private estimateIntensity(magnitude: number, distanceKm: number, depthKm: number): number {
    const hypocentralDistance = Math.max(1, Math.hypot(distanceKm, Math.max(0, depthKm)))
    return Math.max(0, Math.min(10, 1.5 * magnitude - 3.5 * Math.log10(hypocentralDistance) + 3))
  }

  /** Applies real-time and seismic-network notification settings without dropping sessions. */
  private shouldNotify(earthquake: EarthquakeEvent): boolean {
    if (earthquake.kind === 'realtime') {
      return this.settings.realtimeAlertsEnabled && (earthquake.estimatedIntensity ?? 0) >= 1.5
    }
    if (!this.settings.seismicNotificationsEnabled) return false
    const magnitude = earthquake.magnitude ?? 0
    const distance = earthquake.distanceKm ?? Number.POSITIVE_INFINITY
    return (
      magnitude >= this.settings.seismicMinimumMagnitude &&
      distance <= this.settings.seismicMaximumDistanceKm
    )
  }

  /** Chooses normal or fullscreen delivery while keeping mild realtime alerts non-disruptive. */
  private resolvePresentation(
    earthquake: EarthquakeEvent,
    shouldNotify: boolean,
  ): EarthquakeReceivedEvent['presentation'] {
    if (!shouldNotify) return 'none'
    if (earthquake.kind === 'seismic-network') {
      return this.settings.seismicNotificationPresentation
    }
    if (this.settings.realtimeNotificationPresentation === 'normal') return 'normal'
    return (earthquake.estimatedIntensity ?? 0) >= 3 ? 'fullscreen' : 'normal'
  }

  /** Brings the existing hardened renderer forward for its fullscreen alert layer. */
  private showFullscreenWindow(): void {
    if (!this.fullscreenWindowState) {
      this.fullscreenWindowState = {
        bounds: this.window.getNormalBounds(),
        maximized: this.window.isMaximized(),
        visible: this.window.isVisible(),
      }
    }
    this.clearFullscreenRetries()
    if (this.window.isMinimized()) this.window.restore()
    this.window.show()
    const displayBounds = screen.getDisplayMatching(this.window.getBounds()).bounds
    if (this.window.isMaximized()) this.window.unmaximize()
    this.window.setBounds(displayBounds)
    this.window.setAlwaysOnTop(true, 'screen-saver')
    this.window.setFullScreen(true)
    this.window.focus()
    this.fullscreenRetryTimers = [150, 500].map((delay) =>
      setTimeout(() => {
        if (this.window.isDestroyed() || this.window.isFullScreen()) return
        this.window.setBounds(displayBounds)
        this.window.setFullScreen(true)
        this.window.show()
        this.window.focus()
      }, delay),
    )
  }

  /** Leaves the alert fullscreen state and restores the previous window geometry. */
  public dismissFullscreen(): void {
    this.clearFullscreenRetries()
    const previous = this.fullscreenWindowState
    this.fullscreenWindowState = null
    let restored = false
    const restoreWindow = (): void => {
      if (restored || this.window.isDestroyed()) return
      restored = true
      this.window.setAlwaysOnTop(this.settings.alwaysOnTop)
      if (!previous) return
      if (previous.maximized) this.window.maximize()
      else this.window.setBounds(previous.bounds)
      if (!previous.visible) this.window.hide()
    }
    if (!this.window.isFullScreen()) {
      restoreWindow()
      return
    }
    this.window.once('leave-full-screen', () => {
      setTimeout(restoreWindow, 100)
    })
    this.window.setFullScreen(false)
    setTimeout(restoreWindow, 750)
  }

  /** Cancels delayed fullscreen retries after dismissal or application shutdown. */
  private clearFullscreenRetries(): void {
    this.fullscreenRetryTimers.forEach((timer) => {
      clearTimeout(timer)
    })
    this.fullscreenRetryTimers = []
  }

  /** Plays the bundled realtime alarm only while presenting a fullscreen warning. */
  private shouldPlayAlarm(
    earthquake: EarthquakeEvent,
    presentation: EarthquakeReceivedEvent['presentation'],
  ): boolean {
    if (presentation !== 'fullscreen' || earthquake.kind !== 'realtime') return false
    if (this.settings.realtimeSilentWhenMild && (earthquake.estimatedIntensity ?? 0) < 3) {
      return false
    }
    return true
  }

  /** Shows an operating-system notification with a protocol-safe Windows activation target. */
  private showNativeNotification(
    earthquake: EarthquakeEvent,
    title: string,
    sessionId: string,
  ): void {
    try {
      if (Notification.isSupported()) {
        const notificationTitle =
          earthquake.kind === 'realtime' ? 'Real-time earthquake alert' : 'Seismic network'
        const body = `${title}${earthquake.distanceKm === undefined ? '' : ` · ${earthquake.distanceKm.toFixed(0)} km`}`
        const protocolUrl = this.notificationProtocol
          ? createEarthquakeNotificationUrl(sessionId)
          : null
        const notification = new Notification(
          process.platform === 'win32' && protocolUrl
            ? {
                toastXml: createWindowsEarthquakeToastXml(
                  notificationTitle,
                  body,
                  protocolUrl,
                  earthquake.kind === 'realtime',
                ),
              }
            : {
                title: notificationTitle,
                body,
                silent: earthquake.kind === 'realtime',
              },
        )
        notification.on('click', () => {
          this.openNotification(sessionId)
        })
        notification.show()
      } else {
        this.logger.warn('EarthquakeService', 'Native notifications are not supported.')
      }
    } catch (error) {
      this.logger.warn('EarthquakeService', 'Native earthquake notification failed.', error)
    }
  }

  /** Creates a compact human-readable session title for the sidebar and notification. */
  private createSessionTitle(earthquake: EarthquakeEvent): string {
    const magnitude =
      earthquake.magnitude === undefined ? '' : `M${earthquake.magnitude.toFixed(1)} `
    const place =
      earthquake.place ?? `${earthquake.latitude.toFixed(2)}, ${earthquake.longitude.toFixed(2)}`
    return `${magnitude}${place}`.trim()
  }

  /** Schedules the next connection/token check in the exact user-selected minute interval. */
  private scheduleNextCheck(): void {
    if (this.checkTimer) clearTimeout(this.checkTimer)
    const intervalMs = this.settings.fcmCheckIntervalMinutes * 60_000
    const nextCheckAt = new Date(Date.now() + intervalMs).toISOString()
    this.status = { ...this.status, nextCheckAt }
    this.emitStatus()
    this.checkTimer = setTimeout(() => void this.refresh(), Math.min(intervalMs, 2_147_000_000))
  }

  /** Replaces status and notifies every attached renderer bridge. */
  private updateStatus(status: EarthquakeServiceStatus): void {
    this.status = status
    this.emitStatus()
  }

  /** Emits a detached snapshot so listeners cannot mutate service state. */
  private emitStatus(): void {
    const snapshot = this.getStatus()
    this.statusListeners.forEach((listener) => {
      listener(snapshot)
    })
  }

  /** Loads reusable FCM credentials and deduplication identifiers from AppData. */
  private async loadReceiverState(): Promise<ReceiverState> {
    try {
      const value: unknown = JSON.parse(
        await readFile(join(this.dataRoot, 'fcm-state.json'), 'utf8'),
      )
      const encrypted = legacyEncryptedReceiverStateSchema.safeParse(value)
      if (encrypted.success) {
        if (!safeStorage.isEncryptionAvailable()) return { persistentIds: [] }
        const decrypted = safeStorage.decryptString(Buffer.from(encrypted.data.encrypted, 'base64'))
        const migrated = receiverStateSchema.parse(JSON.parse(decrypted))
        await this.saveReceiverState(migrated)
        return migrated
      }
      return receiverStateSchema.parse(value)
    } catch {
      return { persistentIds: [] }
    }
  }

  /** Persists the generated token credentials as readable JSON for reuse across restarts. */
  private async saveReceiverState(state: ReceiverState): Promise<void> {
    const validated = receiverStateSchema.parse(state)
    const operation = this.stateWriteTail
      .catch(() => undefined)
      .then(() =>
        writeFile(
          join(this.dataRoot, 'fcm-state.json'),
          `${JSON.stringify(validated, null, 2)}\n`,
          {
            encoding: 'utf8',
            mode: 0o600,
          },
        ),
      )
    this.stateWriteTail = operation
    await operation
  }
}
