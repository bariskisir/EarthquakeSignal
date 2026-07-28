/**
 * Composes the session sidebar and reusable application workspace.
 */

import SessionsSidebar from '@renderer/components/sidebar/SessionsSidebar'
import styles from './HomePage.module.scss'

/** Renders the primary application workspace. */
const HomePage = (): React.JSX.Element => (
  <main className={styles.container}>
    <SessionsSidebar />
    <section className={styles.workspace} />
  </main>
)

export default HomePage
