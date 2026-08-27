/**
 * Resolves Leaflet tile layer configuration for the selectable map providers.
 */

import { MAP_TILE_PROVIDERS_REQUIRING_API_KEY, type MapTileProvider } from './types'

export interface MapTileConfig {
  url: string
  attribution: string
  className?: string | undefined
  isVector?: boolean | undefined
}

/**
 * Resolves whether the map should use its dark variant.
 */
export const resolveMapIsDark = (
  mapTheme: 'system' | 'light' | 'dark',
  resolvedTheme: 'light' | 'dark',
): boolean => (mapTheme === 'system' ? resolvedTheme === 'dark' : mapTheme === 'dark')

/**
 * Returns true when the provider is configured to require an API key.
 */
export const doesProviderRequireApiKey = (provider: MapTileProvider): boolean =>
  (MAP_TILE_PROVIDERS_REQUIRING_API_KEY as readonly string[]).includes(provider)

/**
 * Returns the tile URL and attribution for a provider and resolved theme.
 */
export const getMapTileConfig = (
  provider: MapTileProvider,
  isDark: boolean,
  mapApiKey?: string,
): MapTileConfig => {
  if (provider === 'osm') {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      className: isDark ? 'osm-dark-tiles' : undefined,
    }
  }
  if (provider === 'osmHot') {
    return {
      url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors, Tiles style by HOT',
      className: isDark ? 'osmHot-dark-tiles' : undefined,
    }
  }
  if (provider === 'openTopoMap') {
    return {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap © OpenStreetMap contributors',
      className: isDark ? 'openTopoMap-dark-tiles' : undefined,
    }
  }
  if (provider === 'cyclOsm') {
    return {
      url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      attribution: '© CyclOSM © OpenStreetMap contributors',
      className: isDark ? 'cyclOsm-dark-tiles' : undefined,
    }
  }
  if (provider === 'wikimedia') {
    return {
      url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
      attribution: '© Wikimedia © OpenStreetMap contributors',
      className: isDark ? 'wikimedia-dark-tiles' : undefined,
    }
  }
  if (provider === 'esriStreet') {
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
      className: isDark ? 'esriStreet-dark-tiles' : undefined,
    }
  }
  if (provider === 'esriImagery') {
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
      className: isDark ? 'esriImagery-dark-tiles' : undefined,
    }
  }
  if (provider === 'esriTopo') {
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
      className: isDark ? 'esriTopo-dark-tiles' : undefined,
    }
  }
  if (provider === 'google') {
    return {
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: '© Google Maps',
      className: isDark ? 'google-dark-tiles' : undefined,
    }
  }
  if (provider === 'carto') {
    const style = isDark ? 'dark_all' : 'light_all'
    const baseUrl = `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`
    const apiKey = mapApiKey?.trim()
    // CARTO docs show `?key=` for new rastertiles endpoint and `?api_key=` for legacy;
    // send both to stay compatible with either.
    return {
      url: apiKey
        ? `${baseUrl}?key=${encodeURIComponent(apiKey)}&api_key=${encodeURIComponent(apiKey)}`
        : baseUrl,
      attribution: '© OpenStreetMap contributors © CARTO',
    }
  }
  return {
    url: isDark
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri © OpenStreetMap contributors',
  }
}
