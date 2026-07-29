/**
 * Manages saved sessions in the collapsible workspace sidebar.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dropdown, Empty, Input, Modal, Tooltip, type MenuProps } from 'antd'
import { FileText, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SessionSummary } from '@shared/types'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useSessionActions } from '@renderer/hooks/useSessionActions'
import { useSettingsActions } from '@renderer/hooks/useSettingsActions'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { setEarthquakeFilter, type EarthquakeFilter } from '@renderer/store/appSlice'
import { formatDate } from '@renderer/utils/formatters'
import styles from './SessionsSidebar.module.scss'

const FILTER_OPTIONS: EarthquakeFilter[] = ['all', '4', '5']

/** Renders open, rename, delete, and collapse actions for server-provided sessions. */
const SessionsSidebar = (): React.JSX.Element => {
  const sessions = useAppSelector((state) => state.app.sessions)
  const currentSession = useAppSelector((state) => state.app.currentSession)
  const earthquakeFilter = useAppSelector((state) => state.app.earthquakeFilter)
  const timeFormat = useAppSelector((state) => state.app.settings.timeFormat)
  const sidebarOpen = useAppSelector((state) => state.app.sessionsSidebarOpen)
  const actions = useSessionActions()
  const settingsActions = useSettingsActions()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const light = theme === 'light'
  const [renameTarget, setRenameTarget] = useState<SessionSummary | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)

  const filteredSessions = useMemo(() => {
    if (earthquakeFilter === 'all') return sessions
    const threshold = Number(earthquakeFilter)
    return sessions.filter((s) => s.magnitude !== undefined && s.magnitude >= threshold)
  }, [sessions, earthquakeFilter])

  const currentFilteredIndex = useMemo(() => {
    if (!currentSession) return -1
    return filteredSessions.findIndex((s) => s.id === currentSession.id)
  }, [filteredSessions, currentSession])

  useEffect(() => {
    setFocusedIndex(currentFilteredIndex)
  }, [currentFilteredIndex])

  /** Resolves a generated title from the active interface locale while preserving custom names. */
  const displayTitle = (item: SessionSummary): string =>
    item.isDefaultTitle ? t('sessions.newSession') : item.title

  /** Opens the rename dialog with the selected session's current title. */
  const beginRename = (item: SessionSummary): void => {
    setRenameTarget(item)
    setRenameValue(displayTitle(item))
  }

  /** Persists the edited title and closes the dialog after a successful update. */
  const commitRename = async (): Promise<void> => {
    if (!renameTarget || !renameValue.trim()) return
    setRenaming(true)
    const renamed = await actions.renameSession(renameTarget.id, renameValue.trim())
    setRenaming(false)
    if (renamed) setRenameTarget(null)
  }

  /** Deletes all local session records in one operation. */
  const deleteAllSessions = async (): Promise<void> => {
    if (deletingAll) return
    setDeletingAll(true)
    try {
      await actions.deleteAllSessions()
    } finally {
      setDeletingAll(false)
    }
  }

  /** Builds the right-click context menu for a single session row. */
  const sessionMenu = (item: SessionSummary): MenuProps => ({
    items: [
      { key: 'rename', icon: <Pencil size={14} />, label: t('common.rename') },
      { type: 'divider' },
      {
        key: 'delete',
        danger: true,
        icon: <Trash2 size={14} />,
        label: t('common.delete'),
        disabled: deletingAll,
      },
    ],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation()
      if (key === 'rename') beginRename(item)
      if (key === 'delete') void actions.deleteSession(item.id)
    },
  })

  /** Opens the session at the given filtered index. */
  const openFiltered = useCallback(
    (index: number) => {
      const item = filteredSessions[index]
      if (item) void actions.openSession(item.id)
    },
    [filteredSessions, actions],
  )

  /** Moves keyboard focus and optionally opens the session. */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (filteredSessions.length === 0) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setFocusedIndex((prev) => (prev + 1) % filteredSessions.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setFocusedIndex((prev) => (prev - 1 + filteredSessions.length) % filteredSessions.length)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (focusedIndex >= 0) openFiltered(focusedIndex)
      }
    },
    [filteredSessions, focusedIndex, openFiltered],
  )

  return (
    <>
      <aside
        className={`${styles.container} ${sidebarOpen ? '' : styles.collapsed}`}
        aria-hidden={!sidebarOpen}
      >
        {sidebarOpen && (
          <>
            <header className={styles.header}>
              <div className={styles.filterGroup}>
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`${styles.filterButton} ${earthquakeFilter === option ? styles.filterActive : ''}`}
                    onClick={() => {
                      dispatch(setEarthquakeFilter(option))
                      void settingsActions.saveSettings({ earthquakeFilter: option })
                    }}
                  >
                    {option === 'all' ? 'All' : `${option}+`}
                  </button>
                ))}
              </div>
              <div className={styles.headerActions}>
                <Tooltip title={t('sessions.deleteAll')}>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<Trash2 size={15} />}
                    disabled={deletingAll || sessions.length === 0}
                    onClick={() => void deleteAllSessions()}
                  />
                </Tooltip>
              </div>
            </header>

            <div
              className={styles.scrollArea}
              ref={listRef}
              role="listbox"
              aria-label={t('nav.sessions')}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              {filteredSessions.length === 0 ? (
                <div className={styles.emptyWrap}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('sessions.emptyTitle')}
                  />
                </div>
              ) : (
                <div className={styles.list}>
                  {filteredSessions.map((item, index) => (
                    <Dropdown
                      key={item.id}
                      menu={sessionMenu(item)}
                      trigger={['contextMenu']}
                      disabled={deletingAll}
                    >
                      <div
                        role="option"
                        aria-selected={currentSession?.id === item.id}
                        tabIndex={-1}
                        className={`${styles.item} ${currentSession?.id === item.id ? styles.active : ''} ${index === focusedIndex ? styles.focused : ''}`}
                      >
                        <button
                          type="button"
                          className={styles.openButton}
                          onClick={() => void actions.openSession(item.id)}
                          onFocus={() => setFocusedIndex(index)}
                        >
                          <span className={styles.fileIcon}>
                            <FileText size={14} />
                          </span>
                          <span className={styles.itemBody}>
                            <span className={styles.itemTitle}>{displayTitle(item)}</span>
                            <span className={styles.itemMeta}>
                              {formatDate(item.createdAt, timeFormat)}
                            </span>
                          </span>
                        </button>
                        <Tooltip title={t('common.delete')}>
                          <Button
                            className={styles.deleteButton ?? ''}
                            type="text"
                            danger
                            size="small"
                            disabled={deletingAll}
                            icon={<Trash2 size={13} />}
                            onClick={() => void actions.deleteSession(item.id)}
                          />
                        </Tooltip>
                      </div>
                    </Dropdown>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
      <Modal
        title={t('sessions.renameSession')}
        open={renameTarget !== null}
        okText={t('common.rename')}
        cancelText={t('common.cancel')}
        confirmLoading={renaming}
        okButtonProps={{
          disabled: !renameValue.trim(),
          ...(light ? { ghost: true as const } : {}),
        }}
        onOk={() => void commitRename()}
        onCancel={() => setRenameTarget(null)}
        destroyOnHidden
      >
        <Input
          className={styles.renameInput}
          value={renameValue}
          maxLength={200}
          autoFocus
          placeholder={t('sessions.renameSession')}
          onChange={(event) => setRenameValue(event.target.value)}
          onPressEnter={() => void commitRename()}
        />
      </Modal>
    </>
  )
}

export default SessionsSidebar
