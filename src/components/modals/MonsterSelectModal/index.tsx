import {
  getMonsterDetail,
  getMonsterDetailQueryKey,
  getMonsterIconUrl,
  useGetMonsterList
} from 'api/monster'
import { useQueryClient } from '@tanstack/react-query'
import { wzVersionState } from 'atoms/wzVersion'
import useBoolean from 'hooks/useBoolean'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'
import { useLocalizedGameContent } from 'hooks/useLocalizedGameContent'
import { useI18n } from 'i18n'
import React, { useEffect, useMemo, useState } from 'react'
import Highlighter from 'react-highlight-words'
import { useRecoilValue } from 'recoil'
import { Monster } from 'type/monster'
import { trackMonsterSelected, trackSelectorOpened } from 'utils/analytics'
import { getUniqueByName } from 'utils/uniqueByName'
import styles from './style.module.scss'

type MonsterSelectModalProps = {
  currentMonster: Monster
  onSelect: (monster: Monster) => void
}

const SEARCH_DEBOUNCE_MS = 150
const RESULT_COUNT = 200

export const MonsterSelectModal: React.FC<MonsterSelectModalProps> = ({
  currentMonster,
  onSelect
}) => {
  const { formatCount, t } = useI18n()
  const queryClient = useQueryClient()
  const localizedContent = useLocalizedGameContent()
  const [open, { setTrue: onOpen, setFalse: onClose }] = useBoolean(false)
  const { dialogRef, triggerRef } = useAccessibleDialog(
    open,
    onClose,
    '#monster-search'
  )
  const wzVersion = useRecoilValue(wzVersionState)
  const [searchKey, setSearchKey] = useState('')
  const [debouncedSearchKey, setDebouncedSearchKey] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearchKey(searchKey.trim()),
      SEARCH_DEBOUNCE_MS
    )

    return () => window.clearTimeout(timer)
  }, [searchKey])

  const query = useMemo(
    () => ({
      region: localizedContent.region,
      version: localizedContent.version,
      startPosition: 0,
      count: RESULT_COUNT,
      searchFor: debouncedSearchKey || undefined
    }),
    [debouncedSearchKey, localizedContent.region, localizedContent.version]
  )
  const localizedResultsQuery = useGetMonsterList(query, open)
  const fallbackResultsQuery = useGetMonsterList(
    {
      ...query,
      region: wzVersion.region,
      version: wzVersion.version
    },
    open && localizedResultsQuery.isError
  )
  const currentNameQuery = useGetMonsterList({
    region: localizedContent.region,
    version: localizedContent.version,
    startPosition: 0,
    count: RESULT_COUNT
  })
  const canonicalMetadataQuery = useGetMonsterList({
    region: wzVersion.region,
    version: wzVersion.version,
    startPosition: 0,
    count: RESULT_COUNT
  })
  const usingFallback = localizedResultsQuery.isError
  const {
    data: monsterResults = [],
    isError,
    isFetching,
    isLoading,
    refetch
  } = usingFallback ? fallbackResultsQuery : localizedResultsQuery
  const monsters = useMemo(() => {
    const canonicalMetadata = new Map(
      (canonicalMetadataQuery.data ?? []).map((monster) => [
        monster.id,
        monster
      ])
    )

    return getUniqueByName(monsterResults).map((monster) => {
      const canonicalMonster = canonicalMetadata.get(monster.id)
      if (!canonicalMonster) return monster

      return {
        ...monster,
        level: canonicalMonster.level,
        isBoss: canonicalMonster.isBoss,
        mobType: canonicalMonster.mobType
      }
    })
  }, [canonicalMetadataQuery.data, monsterResults])

  const getIconUrl = (monster: Monster) => {
    if (wzVersion.version === undefined || wzVersion.region === undefined) {
      return undefined
    }

    return getMonsterIconUrl(monster.id, wzVersion.version, wzVersion.region)
  }

  const handleSelect = (monster: Monster) => {
    const version = wzVersion.version
    const region = wzVersion.region
    const trackSelection = (selectedMonster: Monster) =>
      trackMonsterSelected({
        monster: selectedMonster,
        previousMonster: currentMonster,
        searchTerm: debouncedSearchKey,
        searchResultCount: monsters.length,
        region,
        version
      })

    onSelect(monster)
    onClose()

    if (version === undefined || region === undefined) {
      trackSelection(monster)
      return
    }

    void queryClient
      .fetchQuery({
        queryKey: getMonsterDetailQueryKey(monster.id, version, region),
        queryFn: () => getMonsterDetail(monster.id, version, region),
        staleTime: 1000 * 60 * 60
      })
      .then((canonicalDetail) =>
        trackSelection({
          ...monster,
          level: canonicalDetail.meta?.level ?? monster.level,
          isBoss: canonicalDetail.meta?.isBoss ?? monster.isBoss
        })
      )
      .catch(() => trackSelection(monster))
  }

  const handleOpen = () => {
    trackSelectorOpened({
      selectorType: '몬스터',
      currentItemId: currentMonster.id,
      currentItemName: currentMonster.name,
      region: wzVersion.region,
      version: wzVersion.version
    })
    onOpen()
  }

  const isSearchPending = searchKey.trim() !== debouncedSearchKey
  const isVersionReady =
    localizedContent.version !== undefined &&
    localizedContent.region !== undefined
  const localizedCurrentName = currentNameQuery.data?.find(
    (monster) => monster.id === currentMonster.id
  )?.name
  const currentName = localizedCurrentName ?? currentMonster.name
  const currentNameLanguage = localizedCurrentName
    ? localizedContent.localeTag
    : 'ko-KR'
  const resultNameLanguage = usingFallback
    ? 'ko-KR'
    : localizedContent.localeTag

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.triggerButton}
        onClick={handleOpen}
        aria-label={t('monster.changeCurrent', { name: currentName })}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={styles.triggerIconFrame} aria-hidden="true">
          {getIconUrl(currentMonster) && (
            <img src={getIconUrl(currentMonster)} alt="" />
          )}
        </span>
        <span className={styles.triggerCopy}>
          <span className={styles.triggerLabel}>MONSTER</span>
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
        aria-labelledby="monster-dialog-title"
        aria-describedby="monster-dialog-description"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className={styles.sheetHandle} aria-hidden="true" />

        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>MONSTER LIBRARY</span>
            <h2 id="monster-dialog-title" className={styles.dialogTitle}>
              {t('monster.title')}
            </h2>
            <p id="monster-dialog-description" className={styles.description}>
              {t('monster.description')}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('monster.close')}
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
              id="monster-search"
              type="search"
              className={styles.input}
              maxLength={30}
              value={searchKey}
              placeholder={t('monster.placeholder')}
              aria-label={t('monster.searchLabel')}
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
            {isSearchPending || isFetching
              ? t('monster.searching')
              : formatCount('searchResults', monsters.length)}
          </p>
        </div>

        <div className={styles.currentCard}>
          <span className={styles.currentIconFrame} aria-hidden="true">
            {getIconUrl(currentMonster) && (
              <img src={getIconUrl(currentMonster)} alt="" />
            )}
          </span>
          <span className={styles.currentCopy}>
            <span>{t('monster.currentTarget')}</span>
            <strong lang={currentNameLanguage}>{currentName}</strong>
          </span>
          <span className={styles.levelBadge}>Lv. {currentMonster.level}</span>
        </div>

        <div className={styles.resultList}>
          {!isVersionReady || isLoading || isSearchPending ? (
            <div className={styles.statusState} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              {t('monster.loading')}
            </div>
          ) : isError ? (
            <div className={styles.statusState} role="alert">
              <strong>{t('monster.error')}</strong>
              <button type="button" onClick={() => void refetch()}>
                {t('common.retry')}
              </button>
            </div>
          ) : monsters.length === 0 ? (
            <div className={styles.statusState} role="status">
              <span className={styles.emptyIcon} aria-hidden="true">
                ?
              </span>
              <strong>{t('common.noResults')}</strong>
              <span>{t('monster.emptyHint')}</span>
            </div>
          ) : (
            monsters.map((monster) => {
              const isCurrent = monster.id === currentMonster.id

              return (
                <button
                  key={monster.id}
                  type="button"
                  className={`${styles.monsterItem} ${isCurrent ? styles.currentMonster : ''}`}
                  onClick={() => handleSelect(monster)}
                  aria-pressed={isCurrent}
                >
                  <span className={styles.itemIconFrame} aria-hidden="true">
                    {getIconUrl(monster) && (
                      <img src={getIconUrl(monster)} alt="" loading="lazy" />
                    )}
                  </span>
                  <span className={styles.itemCopy}>
                    <strong lang={resultNameLanguage}>
                      <Highlighter
                        autoEscape
                        caseSensitive={false}
                        highlightClassName={styles.highlight}
                        searchWords={[debouncedSearchKey]}
                        textToHighlight={monster.name}
                      />
                    </strong>
                    <span>
                      Lv. {monster.level} · #{monster.id}
                    </span>
                  </span>
                  {monster.isBoss && (
                    <span className={styles.bossBadge}>BOSS</span>
                  )}
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
        </div>
      </div>
    </>
  )
}
