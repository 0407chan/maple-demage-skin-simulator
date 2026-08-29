import { getMonsterIconUrl, useGetMonsterList } from 'api/monster'
import { wzVersionState } from 'atoms/wzVersion'
import useBoolean from 'hooks/useBoolean'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'
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
      region: wzVersion.region,
      version: wzVersion.version,
      startPosition: 0,
      count: RESULT_COUNT,
      searchFor: debouncedSearchKey || undefined
    }),
    [debouncedSearchKey, wzVersion.region, wzVersion.version]
  )
  const {
    data: monsterResults = [],
    isError,
    isFetching,
    isLoading,
    refetch
  } = useGetMonsterList(query, open || debouncedSearchKey.length === 0)
  const monsters = useMemo(
    () => getUniqueByName(monsterResults),
    [monsterResults]
  )

  const getIconUrl = (monster: Monster) => {
    if (wzVersion.version === undefined || wzVersion.region === undefined) {
      return undefined
    }

    return getMonsterIconUrl(monster.id, wzVersion.version, wzVersion.region)
  }

  const handleSelect = (monster: Monster) => {
    const version = wzVersion.version
    const region = wzVersion.region
    onSelect(monster)
    trackMonsterSelected({
      monster,
      previousMonster: currentMonster,
      searchTerm: debouncedSearchKey,
      searchResultCount: monsters.length,
      region,
      version
    })
    onClose()
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
    wzVersion.version !== undefined && wzVersion.region !== undefined

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.triggerButton}
        onClick={handleOpen}
        aria-label={`몬스터 변경: 현재 ${currentMonster.name}`}
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
          <strong>{currentMonster.name}</strong>
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
              몬스터 변경
            </h2>
            <p id="monster-dialog-description" className={styles.description}>
              이름으로 검색한 뒤 공격할 몬스터를 골라보세요.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="몬스터 변경 닫기"
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
              placeholder="예: 슬라임, 주황버섯, 루시드"
              aria-label="몬스터 검색"
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
            {isSearchPending || isFetching
              ? '몬스터를 찾는 중이에요.'
              : `검색 결과 ${monsters.length}개`}
          </p>
        </div>

        <div className={styles.currentCard}>
          <span className={styles.currentIconFrame} aria-hidden="true">
            {getIconUrl(currentMonster) && (
              <img src={getIconUrl(currentMonster)} alt="" />
            )}
          </span>
          <span className={styles.currentCopy}>
            <span>현재 공격 대상</span>
            <strong>{currentMonster.name}</strong>
          </span>
          <span className={styles.levelBadge}>Lv. {currentMonster.level}</span>
        </div>

        <div className={styles.resultList}>
          {!isVersionReady || isLoading || isSearchPending ? (
            <div className={styles.statusState} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              몬스터를 불러오고 있어요.
            </div>
          ) : isError ? (
            <div className={styles.statusState} role="alert">
              <strong>몬스터를 불러오지 못했어요.</strong>
              <button type="button" onClick={() => void refetch()}>
                다시 시도
              </button>
            </div>
          ) : monsters.length === 0 ? (
            <div className={styles.statusState} role="status">
              <span className={styles.emptyIcon} aria-hidden="true">
                ?
              </span>
              <strong>검색 결과가 없어요.</strong>
              <span>다른 몬스터 이름으로 찾아보세요.</span>
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
                    <strong>
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
