/** Verifies fixed topic naming and coordinate distance calculations. */

import { describe, expect, it } from 'vitest'
import {
  calculateDistanceKm,
  calculateDestinationCoordinates,
  calculateEarthquakeWaveState,
  createEarthquakeTileTopic,
  createEarthquakeTopics,
} from '../src/shared/earthquake'

describe('earthquake utilities', () => {
  it('uses global and Ankara fixed ten-degree tile topics', () => {
    expect(createEarthquakeTileTopic(39.9334, 32.8597)).toBe('x21y12')
    expect(createEarthquakeTopics(39.9334, 32.8597)).toEqual(['global', 'x21y12'])
  })

  it('keeps negative coordinates in deterministic tile names', () => {
    expect(createEarthquakeTileTopic(-1, -1)).toBe('x17y8')
  })

  it('calculates a realistic Ankara to Istanbul surface distance', () => {
    expect(calculateDistanceKm(39.9334, 32.8597, 41.0082, 28.9784)).toBeCloseTo(352, -1)
  })

  it('places test events at the requested distance and bearing', () => {
    const destination = calculateDestinationCoordinates(39.9334, 32.8597, 300, 125)
    expect(calculateDistanceKm(39.9334, 32.8597, destination[0], destination[1])).toBeCloseTo(
      300,
      6,
    )
  })

  it('calculates realtime wave radius and remaining arrival seconds', () => {
    expect(calculateEarthquakeWaveState(35, 5)).toEqual({
      radiusKm: 17.5,
      remainingSeconds: 5,
      arrived: false,
    })
    expect(calculateEarthquakeWaveState(35, 12)).toEqual({
      radiusKm: 42,
      remainingSeconds: 0,
      arrived: true,
    })
  })
})
