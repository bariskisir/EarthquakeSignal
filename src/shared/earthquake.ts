/**
 * Provides deterministic topic naming and distance calculations shared by both processes.
 */

export const EARTHQUAKE_GLOBAL_TOPIC = 'global'
export const ESTIMATED_S_WAVE_SPEED_KM_PER_SECOND = 3.5
const EARTH_RADIUS_KM = 6_371

/** Describes the estimated realtime wavefront at one instant. */
export interface EarthquakeWaveState {
  radiusKm: number
  remainingSeconds: number
  arrived: boolean
}

/** Resolves a coordinate to the fixed ten-degree Earthquake Network topic tile. */
export const createEarthquakeTileTopic = (latitude: number, longitude: number): string => {
  const longitudeTile = Math.floor((longitude + 180) / 10)
  const latitudeTile = Math.floor((latitude + 90) / 10)
  return `x${longitudeTile}y${latitudeTile}`
}

/** Returns the two topics used by the desktop receiver without periodic topic polling. */
export const createEarthquakeTopics = (latitude: number, longitude: number): string[] => [
  EARTHQUAKE_GLOBAL_TOPIC,
  createEarthquakeTileTopic(latitude, longitude),
]

/** Calculates surface distance between two WGS84 coordinates in kilometres. */
export const calculateDistanceKm = (
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
): number => {
  const radians = (degrees: number): number => (degrees * Math.PI) / 180
  const latitudeDelta = radians(secondLatitude - firstLatitude)
  const longitudeDelta = radians(secondLongitude - firstLongitude)
  const first = radians(firstLatitude)
  const second = radians(secondLatitude)
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(first) * Math.cos(second) * Math.sin(longitudeDelta / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

/** Finds a WGS84 destination at a surface distance and initial bearing. */
export const calculateDestinationCoordinates = (
  latitude: number,
  longitude: number,
  distanceKm: number,
  bearingDegrees: number,
): readonly [number, number] => {
  const radians = (degrees: number): number => (degrees * Math.PI) / 180
  const degrees = (value: number): number => (value * 180) / Math.PI
  const angularDistance = Math.max(0, distanceKm) / EARTH_RADIUS_KM
  const bearing = radians(bearingDegrees)
  const startLatitude = radians(latitude)
  const startLongitude = radians(longitude)
  const destinationLatitude = Math.asin(
    Math.sin(startLatitude) * Math.cos(angularDistance) +
      Math.cos(startLatitude) * Math.sin(angularDistance) * Math.cos(bearing),
  )
  const destinationLongitude =
    startLongitude +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(startLatitude),
      Math.cos(angularDistance) - Math.sin(startLatitude) * Math.sin(destinationLatitude),
    )
  const normalizedLongitude = ((degrees(destinationLongitude) + 540) % 360) - 180
  return [degrees(destinationLatitude), normalizedLongitude]
}

/** Estimates wavefront radius and arrival countdown using a fixed S-wave velocity. */
export const calculateEarthquakeWaveState = (
  distanceKm: number,
  elapsedSeconds: number,
): EarthquakeWaveState => {
  const safeDistance = Math.max(0, distanceKm)
  const safeElapsed = Math.max(0, elapsedSeconds)
  const travelSeconds = safeDistance / ESTIMATED_S_WAVE_SPEED_KM_PER_SECOND
  const remainingSeconds = Math.max(0, Math.ceil(travelSeconds - safeElapsed))
  return {
    radiusKm: safeElapsed * ESTIMATED_S_WAVE_SPEED_KM_PER_SECOND,
    remainingSeconds,
    arrived: remainingSeconds === 0,
  }
}
