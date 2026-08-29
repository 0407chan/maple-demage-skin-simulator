import { getMapIconUrl, getMapRenderUrl, useGetMapList } from 'api/map'
import { wzVersionState } from 'atoms/wzVersion'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'
import useBoolean from 'hooks/useBoolean'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Highlighter from 'react-highlight-words'
import { useRecoilValue } from 'recoil'
import { MapleMap } from 'type/map'
import { loadMapBaseBackground, measureMapGround } from 'utils/mapScene'
import styles from './style.module.scss'

type BackgroundSelectModalProps = {
  currentBackground?: MapleMap
  onSelect: (background?: MapleMap) => void
}

const SEARCH_DEBOUNCE_MS = 300
const RESULT_COUNT = 60

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
  const [open, { setTrue: onOpen, setFalse: onClose }] = useBoolean(false)
  const preparingRef = useRef(false)
  const [preparingBackground, setPreparingBackground] = useState<MapleMap>()
  const [searchKey, setSearchKey] = useState('')
  const [debouncedSearchKey, setDebouncedSearchKey] = useState('')
  const wzVersion = useRecoilValue(wzVersionState)

  const handleClose = useCallback(() => {
    if (!preparingRef.current) onClose()
  }, [onClose])
  const { dialogRef, triggerRef } = useAccessibleDialog(
    open,
    handleClose,
    '#background-search'
  )

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearchKey(searchKey.trim()),
      SEARCH_DEBOUNCE_MS
    )

    return () => window.clearTimeout(timer)
  }, [searchKey])

  const query = useMemo(
    () => ({
      region: wzVersion.region,
      version: wzVersion.version,
      startPosition: 0,
      count: RESULT_COUNT,
      searchFor: debouncedSearchKey || undefined
    }),
    [debouncedSearchKey, wzVersion.region, wzVersion.version]
  )
  const {
    data: maps = [],
    isError,
    isFetching,
    isLoading,
    refetch
  } = useGetMapList(query, open)

  const getIconUrl = (map: MapleMap) => {
    if (wzVersion.version === undefined || wzVersion.region === undefined) {
      return undefined
    }

    return getMapIconUrl(map.id, wzVersion.version, wzVersion.region)
  }

  const handleSelect = async (map: MapleMap) => {
    if (preparingRef.current) return

    const version = wzVersion.version
    const region = wzVersion.region
    if (version === undefined || region === undefined) {
      onSelect(map)
      onClose()
      return
    }

    preparingRef.current = true
    setPreparingBackground(map)

    const preloadResults = await Promise.allSettled([
      loadMapBaseBackground(map.id, version, region),
      measureMapGround(getMapRenderUrl(map.id, version, region))
    ])
    const failedPreloads = preloadResults.filter(
      (result) => result.status === 'rejected'
    )
    if (failedPreloads.length > 0) {
      console.warn('맵 배경 일부를 미리 불러오지 못했습니다.', failedPreloads)
    }

    preparingRef.current = false
    setPreparingBackground(undefined)
    onSelect(map)
    onClose()
  }

  const handleReset = () => {
    if (preparingRef.current) return
    onSelect(undefined)
    onClose()
  }

  const isSearchPending = searchKey.trim() !== debouncedSearchKey || isFetching
  const isVersionReady =
    wzVersion.version !== undefined && wzVersion.region !== undefined
  const currentName = currentBackground?.name ?? '기본 배경'
  const currentIconUrl = currentBackground
    ? getIconUrl(currentBackground)
    : undefined

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.triggerButton}
        onClick={onOpen}
        aria-label={`배경 변경: 현재 ${currentName}`}
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
          <strong>{currentName}</strong>
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
        onClick={handleClose}
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
              배경 변경
            </h2>
            <p
              id="background-dialog-description"
              className={styles.description}
            >
              맵 이름으로 검색한 뒤 전투 배경을 골라보세요.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={preparingBackground !== undefined}
            aria-label="배경 변경 닫기"
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
              placeholder="예: 헤네시스, 리스항구, 루디브리엄"
              aria-label="맵 검색"
              onChange={(event) => setSearchKey(event.target.value)}
            />
            {searchKey && (
              <button
                type="button"
                className={styles.clearButton}
                aria-label="검색어 지우기"
                onClick={() => setSearchKey('')}
              >
                <span aria-hidden="true" />
              </button>
            )}
          </div>
          <p className={styles.searchHint} aria-live="polite">
            {preparingBackground
              ? `${preparingBackground.name} 배경을 준비하는 중이에요.`
              : isSearchPending
                ? '맵을 찾는 중이에요.'
                : `검색 결과 ${maps.length}개`}
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
              <span>현재 배경</span>
              <strong>{currentName}</strong>
              {currentBackground?.streetName && (
                <small>{currentBackground.streetName}</small>
              )}
            </span>
          </div>
          <button
            type="button"
            className={`${styles.resetButton} ${!currentBackground ? styles.selectedReset : ''}`}
            onClick={handleReset}
            disabled={preparingBackground !== undefined}
            aria-pressed={!currentBackground}
          >
            <LandscapeIcon />
            <span>
              <strong>기본 배경</strong>
              <small>단색 배경으로 돌아가기</small>
            </span>
            {!currentBackground && (
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m5 10 3 3 7-7" />
              </svg>
            )}
          </button>
        </div>

        <div className={styles.resultList}>
          {!isVersionReady || isLoading || isSearchPending ? (
            <div className={styles.statusState} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              맵을 불러오고 있어요.
            </div>
          ) : isError ? (
            <div className={styles.statusState} role="alert">
              <strong>맵을 불러오지 못했어요.</strong>
              <button type="button" onClick={() => void refetch()}>
                다시 시도
              </button>
            </div>
          ) : maps.length === 0 ? (
            <div className={styles.statusState} role="status">
              <span className={styles.emptyIcon} aria-hidden="true">
                ?
              </span>
              <strong>검색 결과가 없어요.</strong>
              <span>다른 맵 이름으로 찾아보세요.</span>
            </div>
          ) : (
            maps.map((map) => {
              const isCurrent = map.id === currentBackground?.id
              const isPreparing = map.id === preparingBackground?.id
              const iconUrl = getIconUrl(map)

              return (
                <button
                  key={map.id}
                  type="button"
                  className={`${styles.mapItem} ${isCurrent ? styles.currentMap : ''}`}
                  onClick={() => void handleSelect(map)}
                  aria-pressed={isCurrent}
                  aria-busy={isPreparing}
                  disabled={preparingBackground !== undefined}
                >
                  <span className={styles.itemIconFrame} aria-hidden="true">
                    {iconUrl ? (
                      <img src={iconUrl} alt="" loading="lazy" />
                    ) : (
                      <LandscapeIcon />
                    )}
                  </span>
                  <span className={styles.itemCopy}>
                    <strong>
                      <Highlighter
                        autoEscape
                        caseSensitive={false}
                        highlightClassName={styles.highlight}
                        searchWords={[debouncedSearchKey]}
                        textToHighlight={map.name}
                      />
                    </strong>
                    <span>{map.streetName || `맵 #${map.id}`}</span>
                  </span>
                  {isPreparing ? (
                    <span className={styles.itemSpinner} aria-hidden="true" />
                  ) : isCurrent ? (
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
        </div>
      </div>
    </>
  )
}
