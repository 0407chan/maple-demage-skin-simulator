import { getBundledMapIconUrl, getBundledMapList } from 'utils/bundledMaps'
import { getMapIconUrl, useMapLibrary } from 'api/map'
import { wzVersionState } from 'atoms/wzVersion'
import { useRecoilValue } from 'recoil'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'
import { useLocalizedGameContent } from 'hooks/useLocalizedGameContent'
import useBoolean from 'hooks/useBoolean'
import { useI18n } from 'i18n'
import React, { useEffect, useMemo, useState } from 'react'
import Highlighter from 'react-highlight-words'
import { MapleMap } from 'type/map'
import { mergeMapLists } from 'utils/mapSelection'
import styles from './style.module.scss'

type BackgroundSelectModalProps = {
  currentBackground?: MapleMap
  onSelect: (background?: MapleMap) => void
}

const LandscapeIcon: React.FC = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <path d="M4 6.5h24v19H4z" />
    <circle cx="22" cy="12" r="2.5" />
    <path d="m6.5 23 7.2-8 4.1 4 3.2-3.1 4.5 7.1" />
  </svg>
)

export const BackgroundSelectModal: React.FC<BackgroundSelectModalProps> = ({
  currentBackground,
  onSelect
}) => {
  const { formatCount, locale, t } = useI18n()
  const [open, { setTrue: onOpen, setFalse: onClose }] = useBoolean(false)
  const [searchKey, setSearchKey] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const localizedContent = useLocalizedGameContent()
  const wzVersion = useRecoilValue(wzVersionState)

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(searchKey.trim()),
      250
    )
    return () => window.clearTimeout(timer)
  }, [searchKey])

  const localizedQuery = useMapLibrary(
    {
      region: localizedContent.region,
      version: localizedContent.version,
      searchFor: debouncedSearch || undefined
    },
    open
  )
  const usingFallback =
    localizedQuery.isLoadingError &&
    (localizedContent.region !== wzVersion.region ||
      localizedContent.version !== wzVersion.version)
  const fallbackQuery = useMapLibrary(
    {
      region: wzVersion.region,
      version: wzVersion.version,
      searchFor: debouncedSearch || undefined
    },
    open && usingFallback
  )
  const remoteQuery = usingFallback ? fallbackQuery : localizedQuery
  const isSearchPending = searchKey.trim() !== debouncedSearch
  const isLoading =
    isSearchPending || localizedContent.isLoading || remoteQuery.isLoading
  const sourceVersion = usingFallback
    ? wzVersion.version
    : localizedContent.version
  const hasRemoteError =
    remoteQuery.isError || (!isLoading && sourceVersion === undefined)

  const { dialogRef, triggerRef } = useAccessibleDialog(
    open,
    onClose,
    '#background-search'
  )

  const maps = useMemo(
    () =>
      mergeMapLists(
        getBundledMapList(locale, searchKey),
        isSearchPending ? [] : (remoteQuery.data?.pages.flat() ?? [])
      ),
    [locale, searchKey, isSearchPending, remoteQuery.data]
  )
  const allMaps = useMemo(() => getBundledMapList(locale), [locale])

  const handleSelect = (map: MapleMap) => {
    onSelect(map)
    onClose()
  }

  const handleReset = () => {
    onSelect(undefined)
    onClose()
  }

  const localizedCurrentBackground = [...allMaps, ...maps].find(
    (map) => map.id === currentBackground?.id
  )
  const currentName =
    localizedCurrentBackground?.name ??
    currentBackground?.name ??
    t('background.default')
  const currentStreetName =
    localizedCurrentBackground?.streetName ?? currentBackground?.streetName
  const currentNameLanguage = locale
  const resultNameLanguage = usingFallback ? 'ko-KR' : locale
  const getIconUrl = (id: number) =>
    getBundledMapIconUrl(id) ??
    (wzVersion.version !== undefined && wzVersion.region !== undefined
      ? getMapIconUrl(id, wzVersion.version, wzVersion.region)
      : undefined)
  const currentIconUrl = currentBackground
    ? getIconUrl(currentBackground.id)
    : undefined

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.triggerButton}
        onClick={onOpen}
        aria-label={t('background.changeCurrent', { name: currentName })}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={styles.triggerIconFrame} aria-hidden="true">
          {currentIconUrl ? (
            <img src={currentIconUrl} alt="" />
          ) : (
            <LandscapeIcon />
          )}
        </span>
        <span className={styles.triggerCopy}>
          <span className={styles.triggerLabel}>BACKGROUND</span>
          <strong lang={currentNameLanguage}>{currentName}</strong>
        </span>
        <svg
          className={styles.triggerChevron}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="m6.5 8 3.5 3.5L13.5 8" />
        </svg>
      </button>

      <div
        className={`${styles.backdrop} ${open ? styles.open : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={`${styles.container} ${open ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="background-dialog-title"
        aria-describedby="background-dialog-description"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className={styles.sheetHandle} aria-hidden="true" />

        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>MAP LIBRARY</span>
            <h2 id="background-dialog-title" className={styles.dialogTitle}>
              {t('background.title')}
            </h2>
            <p
              id="background-dialog-description"
              className={styles.description}
            >
              {t('background.description')}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('background.close')}
          >
            <span aria-hidden="true" />
          </button>
        </header>

        <div className={styles.searchArea}>
          <div className={styles.searchField}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m20 20-4.5-4.5m2.5-5A7.5 7.5 0 1 1 3 10.5a7.5 7.5 0 0 1 15 0Z" />
            </svg>
            <input
              id="background-search"
              type="search"
              className={styles.input}
              maxLength={30}
              value={searchKey}
              placeholder={t('background.placeholder')}
              aria-label={t('background.searchLabel')}
              onChange={(event) => setSearchKey(event.target.value)}
            />
            {searchKey && (
              <button
                type="button"
                className={styles.clearButton}
                aria-label={t('common.clearSearch')}
                onClick={() => setSearchKey('')}
              >
                <span aria-hidden="true" />
              </button>
            )}
          </div>
          <p className={styles.searchHint} aria-live="polite">
            {isLoading
              ? t('background.searching')
              : formatCount('searchResults', maps.length)}
          </p>
        </div>

        <div className={styles.selectionSummary}>
          <div className={styles.currentCard}>
            <span className={styles.currentIconFrame} aria-hidden="true">
              {currentIconUrl ? (
                <img src={currentIconUrl} alt="" />
              ) : (
                <LandscapeIcon />
              )}
            </span>
            <span className={styles.currentCopy}>
              <span>{t('background.current')}</span>
              <strong lang={currentNameLanguage}>{currentName}</strong>
              {currentStreetName && (
                <small lang={currentNameLanguage}>{currentStreetName}</small>
              )}
              {currentBackground && (
                <small>
                  {t('background.mapNumber', { id: currentBackground.id })}
                </small>
              )}
            </span>
          </div>
          <button
            type="button"
            className={`${styles.resetButton} ${!currentBackground ? styles.selectedReset : ''}`}
            onClick={handleReset}
            aria-pressed={!currentBackground}
          >
            <LandscapeIcon />
            <span>
              <strong>{t('background.default')}</strong>
              <small>{t('background.defaultDescription')}</small>
            </span>
            {!currentBackground && (
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m5 10 3 3 7-7" />
              </svg>
            )}
          </button>
        </div>

        <div className={styles.resultList}>
          {open && isLoading && (
            <div className={styles.statusState} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              {t('background.loading')}
            </div>
          )}
          {open && hasRemoteError && (
            <div className={styles.statusState} role="alert">
              <strong>{t('background.error')}</strong>
              <button
                type="button"
                onClick={() =>
                  void (remoteQuery.isFetchNextPageError
                    ? remoteQuery.fetchNextPage()
                    : remoteQuery.refetch())
                }
              >
                {t('common.retry')}
              </button>
            </div>
          )}
          {maps.length === 0 && !isLoading && !hasRemoteError ? (
            <div className={styles.statusState} role="status">
              <span className={styles.emptyIcon} aria-hidden="true">
                ?
              </span>
              <strong>{t('common.noResults')}</strong>
              <span>{t('background.emptyHint')}</span>
            </div>
          ) : (
            open &&
            maps.map((map) => {
              const isCurrent = map.id === currentBackground?.id
              const iconUrl = getIconUrl(map.id)

              return (
                <button
                  key={map.id}
                  type="button"
                  className={`${styles.mapItem} ${isCurrent ? styles.currentMap : ''}`}
                  onClick={() => handleSelect(map)}
                  aria-pressed={isCurrent}
                >
                  <span className={styles.itemIconFrame} aria-hidden="true">
                    {iconUrl ? (
                      <img src={iconUrl} alt="" loading="lazy" />
                    ) : (
                      <LandscapeIcon />
                    )}
                  </span>
                  <span className={styles.itemCopy}>
                    <strong lang={resultNameLanguage}>
                      <Highlighter
                        autoEscape
                        caseSensitive={false}
                        highlightClassName={styles.highlight}
                        searchWords={[searchKey.trim()]}
                        textToHighlight={map.name}
                      />
                    </strong>
                    <span lang={resultNameLanguage}>
                      {map.streetName && `${map.streetName} · `}
                      {t('background.mapNumber', { id: map.id })}
                    </span>
                  </span>
                  {isCurrent ? (
                    <svg
                      className={styles.selectedIcon}
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path d="m5 10 3 3 7-7" />
                    </svg>
                  ) : null}
                </button>
              )
            })
          )}
          {open &&
            !isSearchPending &&
            remoteQuery.hasNextPage &&
            !remoteQuery.isFetchNextPageError && (
              <div className={styles.statusState}>
                <button
                  type="button"
                  disabled={remoteQuery.isFetchingNextPage}
                  onClick={() => void remoteQuery.fetchNextPage()}
                >
                  {t(
                    remoteQuery.isFetchingNextPage
                      ? 'background.loading'
                      : 'background.loadMore'
                  )}
                </button>
              </div>
            )}
        </div>
      </div>
    </>
  )
}
