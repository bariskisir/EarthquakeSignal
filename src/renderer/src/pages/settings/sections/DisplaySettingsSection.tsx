/**
 * Renders application appearance and navbar layout preferences.
 */

import { useEffect, useRef } from 'react'
import { Button, Input, Segmented, Select, Tooltip } from 'antd'
import L from 'leaflet'
import { Minus, Monitor, Moon, PanelLeft, PanelTop, Plus, RotateCcw, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { doesProviderRequireApiKey, getMapTileConfig, resolveMapIsDark } from '@shared/mapTiles'
import {
  MAP_TILE_PROVIDERS,
  PAGE_ZOOM_LIMITS,
  type MapThemeMode,
  type MapTileProvider,
  type NavbarPosition,
  type ThemeMode,
} from '@shared/types'
import { useSettingsActions } from '@renderer/hooks/useSettingsActions'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useAppSelector } from '@renderer/store'
import SettingLabel from '../components/SettingLabel'
import styles from '../SettingsPage.module.scss'

/** Displays theme and primary navbar placement controls. */
const DisplaySettingsSection = (): React.JSX.Element => {
  const settings = useAppSelector((state) => state.app.settings)
  const settingsActions = useSettingsActions()
  const { theme } = useTheme()
  const isDark = resolveMapIsDark(settings.mapTheme, theme)
  const { t } = useTranslation()
  const mapPreviewRef = useRef<HTMLDivElement | null>(null)
  const mapPreviewInstanceRef = useRef<L.Map | null>(null)
  const mapPreviewTileRef = useRef<L.TileLayer | null>(null)

  /** Persists a bounded page zoom change at the same tenth-step used by Electron. */
  const changePageZoom = (delta: number): void => {
    const pageZoom = Math.min(
      PAGE_ZOOM_LIMITS.max,
      Math.max(PAGE_ZOOM_LIMITS.min, Number((settings.pageZoom + delta).toFixed(1))),
    )
    void settingsActions.saveSettings({ pageZoom })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: preview map is created once; tile updates handled by second effect
  useEffect(() => {
    const element = mapPreviewRef.current
    if (!element || mapPreviewInstanceRef.current) return
    const map = L.map(element, {
      zoomControl: true,
      attributionControl: true,
    }).setView([settings.earthquakeLatitude, settings.earthquakeLongitude], 5)
    L.circleMarker([settings.earthquakeLatitude, settings.earthquakeLongitude], {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#4f46e5',
      fillOpacity: 1,
    }).addTo(map)
    const initialTile = getMapTileConfig(settings.mapTileProvider, isDark, settings.mapApiKey)
    const initialLayer = L.tileLayer(initialTile.url, {
      maxZoom: 19,
      attribution: initialTile.attribution,
      className: initialTile.className ?? '',
    }).addTo(map)
    mapPreviewTileRef.current = initialLayer
    mapPreviewInstanceRef.current = map
    const timer = window.setTimeout(() => map.invalidateSize(), 0)
    let refitTimer = 0
    const observer = new ResizeObserver(() => {
      window.clearTimeout(refitTimer)
      refitTimer = window.setTimeout(() => map.invalidateSize(), 150)
    })
    observer.observe(element)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(refitTimer)
      observer.disconnect()
      map.remove()
      mapPreviewInstanceRef.current = null
      mapPreviewTileRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapPreviewInstanceRef.current
    if (!map) return
    mapPreviewTileRef.current?.removeFrom(map)
    const tileConfig = getMapTileConfig(settings.mapTileProvider, isDark, settings.mapApiKey)
    const layer = L.tileLayer(tileConfig.url, {
      maxZoom: 19,
      attribution: tileConfig.attribution,
      className: tileConfig.className ?? '',
    }).addTo(map)
    mapPreviewTileRef.current = layer
  }, [settings.mapTileProvider, settings.mapApiKey, isDark])

  return (
    <div className={styles.settingContainer}>
      <h2 className={styles.groupTitle}>{t('settings.displaySettings')}</h2>
      <section className={styles.settingGroup}>
        <div className={styles.settingRow}>
          <SettingLabel title={t('settings.theme')} description={t('settings.themeDescription')} />
          <div className={styles.settingControl}>
            <Segmented
              value={settings.theme}
              options={[
                {
                  value: 'light',
                  label: (
                    <span className={styles.segmentedOption}>
                      <Sun size={15} />
                      {t('themes.light')}
                    </span>
                  ),
                },
                {
                  value: 'dark',
                  label: (
                    <span className={styles.segmentedOption}>
                      <Moon size={15} />
                      {t('themes.dark')}
                    </span>
                  ),
                },
                {
                  value: 'system',
                  label: (
                    <span className={styles.segmentedOption}>
                      <Monitor size={15} />
                      {t('themes.system')}
                    </span>
                  ),
                },
              ]}
              onChange={(theme) => void settingsActions.saveSettings({ theme: theme as ThemeMode })}
            />
          </div>
        </div>
        <div className={styles.settingRow}>
          <SettingLabel
            title={t('settings.navbarPosition')}
            description={t('settings.navbarPositionDescription')}
          />
          <div className={styles.settingControl}>
            <Segmented
              value={settings.navbarPosition}
              options={[
                {
                  value: 'left',
                  label: (
                    <span className={styles.segmentedOption}>
                      <PanelLeft size={15} />
                      {t('settings.navbarPositions.left')}
                    </span>
                  ),
                },
                {
                  value: 'top',
                  label: (
                    <span className={styles.segmentedOption}>
                      <PanelTop size={15} />
                      {t('settings.navbarPositions.top')}
                    </span>
                  ),
                },
              ]}
              onChange={(navbarPosition) =>
                void settingsActions.saveSettings({
                  navbarPosition: navbarPosition as NavbarPosition,
                })
              }
            />
          </div>
        </div>
      </section>
      <h2 className={styles.groupTitle}>{t('settings.zoomSettings')}</h2>
      <section className={styles.settingGroup}>
        <div className={styles.settingRow}>
          <SettingLabel
            title={t('settings.pageZoom')}
            description={t('settings.pageZoomDescription')}
          />
          <div className={styles.zoomControl}>
            <Tooltip title={t('settings.zoomOut')}>
              <Button
                type="text"
                aria-label={t('settings.zoomOut')}
                disabled={settings.pageZoom <= PAGE_ZOOM_LIMITS.min}
                icon={<Minus size={15} />}
                onClick={() => changePageZoom(-PAGE_ZOOM_LIMITS.step)}
              />
            </Tooltip>
            <span className={styles.zoomValue}>{Math.round(settings.pageZoom * 100)}%</span>
            <Tooltip title={t('settings.zoomIn')}>
              <Button
                type="text"
                aria-label={t('settings.zoomIn')}
                disabled={settings.pageZoom >= PAGE_ZOOM_LIMITS.max}
                icon={<Plus size={15} />}
                onClick={() => changePageZoom(PAGE_ZOOM_LIMITS.step)}
              />
            </Tooltip>
            <Tooltip title={t('settings.resetZoom')}>
              <Button
                type="text"
                aria-label={t('settings.resetZoom')}
                disabled={settings.pageZoom === PAGE_ZOOM_LIMITS.default}
                icon={<RotateCcw size={15} />}
                onClick={() =>
                  void settingsActions.saveSettings({ pageZoom: PAGE_ZOOM_LIMITS.default })
                }
              />
            </Tooltip>
          </div>
        </div>
      </section>
      <h2 className={styles.groupTitle}>{t('settings.mapSettings')}</h2>
      <section className={styles.settingGroup}>
        <div className={styles.settingRow}>
          <SettingLabel
            title={t('settings.mapTileProvider')}
            description={t('settings.mapTileProviderDescription')}
          />
          <Select
            className={styles.wideControl ?? ''}
            value={settings.mapTileProvider}
            options={MAP_TILE_PROVIDERS.map((provider) => ({
              value: provider,
              label: t(`settings.mapTileProviders.${provider}`),
            }))}
            onChange={(mapTileProvider: MapTileProvider) =>
              void settingsActions.saveSettings({ mapTileProvider })
            }
          />
        </div>
        <div className={styles.settingRow}>
          <SettingLabel
            title={t('settings.mapTheme')}
            description={t('settings.mapThemeDescription')}
          />
          <div className={styles.settingControl}>
            <Segmented
              value={settings.mapTheme}
              options={[
                {
                  value: 'light',
                  label: (
                    <span className={styles.segmentedOption}>
                      <Sun size={15} />
                      {t('settings.mapThemeModes.light')}
                    </span>
                  ),
                },
                {
                  value: 'dark',
                  label: (
                    <span className={styles.segmentedOption}>
                      <Moon size={15} />
                      {t('settings.mapThemeModes.dark')}
                    </span>
                  ),
                },
                {
                  value: 'system',
                  label: (
                    <span className={styles.segmentedOption}>
                      <Monitor size={15} />
                      {t('settings.mapThemeModes.system')}
                    </span>
                  ),
                },
              ]}
              onChange={(mapTheme) =>
                void settingsActions.saveSettings({ mapTheme: mapTheme as MapThemeMode })
              }
            />
          </div>
        </div>
        {doesProviderRequireApiKey(settings.mapTileProvider) && (
          <div className={styles.settingRow}>
            <SettingLabel
              title={t('settings.mapApiKey')}
              description={t('settings.mapApiKeyDescription')}
            />
            <Input.Password
              className={styles.wideControl ?? ''}
              value={settings.mapApiKey}
              placeholder={t('settings.mapApiKeyPlaceholder')}
              allowClear
              onChange={(event) =>
                void settingsActions.saveSettings({ mapApiKey: event.target.value })
              }
            />
          </div>
        )}
        <div ref={mapPreviewRef} className={styles.mapPreview} />
      </section>
    </div>
  )
}

export default DisplaySettingsSection
