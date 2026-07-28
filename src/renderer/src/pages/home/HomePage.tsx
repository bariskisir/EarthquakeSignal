/**
 * Composes the session sidebar and reusable application workspace.
 */

import { Empty, Tag } from 'antd'
import { Activity, Radio } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SessionsSidebar from '@renderer/components/sidebar/SessionsSidebar'
import EarthquakeEventMap from '@renderer/components/earthquake/EarthquakeEventMap'
import { useAppSelector } from '@renderer/store'
import { formatDate } from '@renderer/utils/formatters'
import styles from './HomePage.module.scss'

/** Renders the primary application workspace. */
const HomePage = (): React.JSX.Element => {
  const session = useAppSelector((state) => state.app.currentSession)
  const timeFormat = useAppSelector((state) => state.app.settings.timeFormat)
  const userLatitude = useAppSelector((state) => state.app.settings.earthquakeLatitude)
  const userLongitude = useAppSelector((state) => state.app.settings.earthquakeLongitude)
  const { t } = useTranslation()
  const earthquake = session?.earthquake

  return (
    <main className={styles.container}>
      <SessionsSidebar />
      <section className={styles.workspace}>
        {!earthquake ? (
          <div className={styles.emptyState}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  <strong>{t('earthquake.waitingTitle')}</strong>
                </span>
              }
            />
          </div>
        ) : (
          <article className={styles.eventCard}>
            <header className={styles.eventHeader}>
              <div>
                <Tag
                  color={earthquake.kind === 'realtime' ? 'red' : 'blue'}
                  icon={
                    earthquake.kind === 'realtime' ? <Radio size={12} /> : <Activity size={12} />
                  }
                >
                  {earthquake.kind === 'realtime'
                    ? t('earthquake.realtimeBadge')
                    : t('earthquake.seismicBadge')}
                </Tag>
                <h1>{session.title}</h1>
                {earthquake.place && <p>{earthquake.place}</p>}
              </div>
              {earthquake.magnitude !== undefined && (
                <div className={styles.magnitude}>
                  <span>M</span>
                  {earthquake.magnitude.toFixed(1)}
                </div>
              )}
            </header>
            <div className={styles.eventMap}>
              <EarthquakeEventMap
                key={earthquake.id}
                earthquake={earthquake}
                userLatitude={userLatitude}
                userLongitude={userLongitude}
              />
            </div>
            <dl className={styles.metrics}>
              {earthquake.estimatedIntensity !== undefined && (
                <div>
                  <dt>{t('earthquake.intensity')}</dt>
                  <dd>{earthquake.estimatedIntensity.toFixed(1)}</dd>
                </div>
              )}
              {earthquake.distanceKm !== undefined && (
                <div>
                  <dt>{t('earthquake.distance')}</dt>
                  <dd>{earthquake.distanceKm.toFixed(1)} km</dd>
                </div>
              )}
              {earthquake.depthKm !== undefined && (
                <div>
                  <dt>{t('earthquake.depth')}</dt>
                  <dd>{earthquake.depthKm.toFixed(1)} km</dd>
                </div>
              )}
              <div>
                <dt>{t('earthquake.coordinates')}</dt>
                <dd>
                  {earthquake.latitude.toFixed(4)}, {earthquake.longitude.toFixed(4)}
                </dd>
              </div>
              {earthquake.occurredAt && (
                <div>
                  <dt>{t('earthquake.occurred')}</dt>
                  <dd>{formatDate(earthquake.occurredAt, timeFormat)}</dd>
                </div>
              )}
              <div>
                <dt>{t('earthquake.received')}</dt>
                <dd>{formatDate(earthquake.receivedAt, timeFormat)}</dd>
              </div>
              <div>
                <dt>{t('earthquake.source')}</dt>
                <dd>{earthquake.source}</dd>
              </div>
            </dl>
          </article>
        )}
      </section>
    </main>
  )
}

export default HomePage
