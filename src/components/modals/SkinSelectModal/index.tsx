import { wzVersionState } from 'atoms/wzVersion'
import { SkinMap } from 'constants/damageSkinMapper'
import useBoolean from 'hooks/useBoolean'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { ItemDto } from 'type/damage-skin'
import {
  SkinFilterName,
  trackDamageSkinSelected,
  trackSelectorOpened
} from 'utils/analytics'
import { preloadWzImageSequences } from 'utils/wzImageAnimation'
import { SkinItem } from './SkinItem'
import styles from './style.module.scss'
import { useSkinList } from './useSkinList'
import { matchesSkinFilter, SkinFilter } from './util'

type SkinSelectModalProps = {
  currentSkin?: ItemDto
  onConfirm: (num: number) => void
  setCurrentSkin: (skin?: ItemDto) => void
  hideCloseButton?: boolean
}

const FILTER_OPTIONS: Array<{ label: string; value: SkinFilter }> = [
  { label: '전체', value: 'all' },
  { label: '유닛', value: 'unit' },
  { label: '액션', value: 'action' }
]

const FILTER_ANALYTICS_NAMES: Record<SkinFilter, SkinFilterName> = {
  all: '전체',
  unit: '유닛',
  action: '액션'
}

const getSkinImageUrls = (baseUrl: string) => {
  const urls: string[] = []

  for (let i = 0; i <= 9; i++) {
    urls.push(`${baseUrl}/NoCri0/${i}`)
    urls.push(`${baseUrl}/NoCri1/${i}`)
    urls.push(`${baseUrl}/NoRed0/${i}`)
    urls.push(`${baseUrl}/NoRed1/${i}`)
  }

  urls.push(`${baseUrl}/NoCri1/effect3`)
  urls.push(`${baseUrl}/NoCustom/NoCri1/3`)
  urls.push(`${baseUrl}/NoCustom/NoCri1/4`)
  urls.push(`${baseUrl}/NoCustom/NoRed1/3`)
  urls.push(`${baseUrl}/NoCustom/NoRed1/4`)

  return urls
}

export const SkinSelectModal: React.FC<SkinSelectModalProps> = ({
  currentSkin,
  hideCloseButton = false,
  setCurrentSkin,
  onConfirm
}) => {
  const [open, { setTrue: onOpen, setFalse: onClose }] = useBoolean(false)
  const { dialogRef, triggerRef } = useAccessibleDialog(
    open,
    onClose,
    '#skin-search'
  )
  const [searchKey, setSearchKey] = useState('')
  const { currentItemList, isLoading } = useSkinList()
  const wzVersion = useRecoilValue(wzVersionState)
  const [filter, setFilter] = useState<SkinFilter>('all')

  const getItemIconUrl = (skin: ItemDto) =>
    `https://maplestory.io/api/${wzVersion.region}/${wzVersion.version}/item/${skin.id}/icon`

  const preloadSkinImages = useCallback(
    (skinNumber: number) => {
      if (!wzVersion.version || !wzVersion.region) return Promise.resolve()

      const baseUrl = `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${skinNumber}`
      return preloadWzImageSequences(getSkinImageUrls(baseUrl))
    },
    [wzVersion.region, wzVersion.version]
  )

  useEffect(() => {
    if (!currentSkin && currentItemList.length > 0) {
      const defaultSkin = currentItemList.find((item) =>
        item.name.includes('흐물냥 데미지 스킨')
      )
      if (defaultSkin) {
        setCurrentSkin(defaultSkin)
      }
    }
  }, [currentItemList, currentSkin, setCurrentSkin])

  useEffect(() => {
    if (currentSkin) {
      const skinNumbers = SkinMap[currentSkin.id]
      if (skinNumbers && skinNumbers.length > 0) {
        void preloadSkinImages(skinNumbers[0])
      }
    }
  }, [currentSkin, preloadSkinImages])

  const handleSkinSelect = (skin: ItemDto) => {
    setCurrentSkin(skin)
    const skinNumbers = SkinMap[skin.id]
    if (skinNumbers && skinNumbers.length > 0) {
      onConfirm(skinNumbers[0])
      trackDamageSkinSelected({
        skin,
        skinEffectId: skinNumbers[0],
        skinVariantCount: skinNumbers.length,
        previousSkin: currentSkin,
        filter: FILTER_ANALYTICS_NAMES[filter],
        searchTerm: searchKey,
        searchResultCount: filteredSkins.length,
        region: wzVersion.region,
        version: wzVersion.version
      })
    }

    onClose()
  }

  const filteredSkins = useMemo(() => {
    const normalizedSearchKey = searchKey.trim().toLocaleLowerCase('ko-KR')

    return currentItemList.filter((item) => {
      const matchesSearch =
        normalizedSearchKey.length === 0 ||
        item.name.toLocaleLowerCase('ko-KR').includes(normalizedSearchKey)
      const matchesFilter = matchesSkinFilter(item, filter)

      return matchesSearch && matchesFilter
    })
  }, [currentItemList, filter, searchKey])

  const handleOpen = () => {
    trackSelectorOpened({
      selectorType: '데미지_스킨',
      currentItemId: currentSkin?.id,
      currentItemName: currentSkin?.name,
      region: wzVersion.region,
      version: wzVersion.version
    })
    onOpen()
  }

  return (
    <>
      {currentSkin && (
        <button
          ref={triggerRef}
          type="button"
          className={styles.skinButton}
          onClick={handleOpen}
          aria-label={`데미지 스킨 선택: ${currentSkin.name}`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={styles.triggerIconFrame} aria-hidden="true">
            <img
              className={styles.skinImg}
              src={getItemIconUrl(currentSkin)}
              alt=""
            />
          </span>
          <span className={styles.triggerCopy}>
            <span className={styles.triggerLabel}>DAMAGE SKIN</span>
            <span className={styles.skinText}>{currentSkin.name}</span>
          </span>
          <svg
            className={styles.triggerChevron}
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="m6.5 8 3.5 3.5L13.5 8" />
          </svg>
        </button>
      )}

      <div
        className={`${styles.backBoard} ${open ? styles.open : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={`${styles.container} ${open ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skin-dialog-title"
        aria-describedby="skin-dialog-description"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className={styles.sheetHandle} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>SKIN LIBRARY</span>
            <h2 id="skin-dialog-title" className={styles.dialogTitle}>
              데미지 스킨 선택
            </h2>
            <p id="skin-dialog-description" className={styles.description}>
              원하는 스킨을 검색하고 바로 적용해 보세요.
            </p>
          </div>

          {!hideCloseButton && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="데미지 스킨 선택 닫기"
            >
              <span aria-hidden="true" />
            </button>
          )}
        </header>

        <div className={styles.controls}>
          <div className={styles.searchField}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m20 20-4.5-4.5m2.5-5A7.5 7.5 0 1 1 3 10.5a7.5 7.5 0 0 1 15 0Z" />
            </svg>
            <input
              id="skin-search"
              type="search"
              className={styles.input}
              maxLength={20}
              value={searchKey}
              placeholder="스킨 이름 검색"
              aria-label="데미지 스킨 검색"
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

          <div
            className={styles.filterGroup}
            role="group"
            aria-label="스킨 유형 필터"
          >
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.filterButton} ${filter === option.value ? styles.activeFilter : ''}`}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {currentSkin && (
          <div className={styles.currentCard}>
            <span className={styles.currentIconFrame} aria-hidden="true">
              <img
                className={styles.skinImg}
                src={getItemIconUrl(currentSkin)}
                alt=""
              />
            </span>
            <span className={styles.currentCopy}>
              <span className={styles.currentLabel}>현재 적용 중</span>
              <strong className={styles.currentName}>{currentSkin.name}</strong>
            </span>
            <span className={styles.appliedBadge}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m5 10 3 3 7-7" />
              </svg>
              적용됨
            </span>
          </div>
        )}

        <div className={styles.listHeader}>
          <span>스킨 목록</span>
          <span className={styles.resultCount} aria-live="polite">
            {isLoading ? '불러오는 중' : `${filteredSkins.length}개`}
          </span>
        </div>

        <div className={styles.body}>
          {isLoading ? (
            <div className={styles.loadingState} role="status">
              <span className={styles.spinner} aria-hidden="true" />
              스킨을 불러오고 있어요.
            </div>
          ) : filteredSkins.length > 0 ? (
            filteredSkins.map((skin) => (
              <SkinItem
                key={skin.id}
                skin={skin}
                currentSkin={currentSkin}
                searchKey={searchKey}
                onSelect={handleSkinSelect}
              />
            ))
          ) : (
            <div className={styles.emptyState} role="status">
              <span className={styles.emptyIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m20 20-4.5-4.5m2.5-5A7.5 7.5 0 1 1 3 10.5a7.5 7.5 0 0 1 15 0Z" />
                </svg>
              </span>
              <strong>검색 결과가 없어요.</strong>
              <span>다른 이름이나 필터로 다시 찾아보세요.</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
