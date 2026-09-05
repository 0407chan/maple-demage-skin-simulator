import { wzVersionState } from 'atoms/wzVersion'
import { useGetItemDetail } from 'api/damage-skin'
import { SkinMap } from 'constants/damageSkinMapper'
import useBoolean from 'hooks/useBoolean'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'
import { useI18n } from 'i18n'
import { useLocalizedGameContent } from 'hooks/useLocalizedGameContent'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { ItemDto } from 'type/damage-skin'
import {
  SkinFilterName,
  trackDamageSkinSelected,
  trackSelectorOpened
} from 'utils/analytics'
import { preloadWzImageSequences } from 'utils/wzImageAnimation'
import { getPrebuiltActionSkinUrls } from 'utils/prebuiltActionSkin'
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

const FILTER_OPTIONS = [
  { key: 'skin.filter.all', value: 'all' },
  { key: 'skin.filter.unit', value: 'unit' },
  { key: 'skin.filter.action', value: 'action' }
] as const satisfies ReadonlyArray<{ key: string; value: SkinFilter }>

const SEARCH_DEBOUNCE_MS = 150

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
  const { formatCount, t } = useI18n()
  const localizedContent = useLocalizedGameContent()
  const [open, { setTrue: onOpen, setFalse: onClose }] = useBoolean(false)
  const { dialogRef, triggerRef } = useAccessibleDialog(
    open,
    onClose,
    '#skin-search'
  )
  const [searchKey, setSearchKey] = useState('')
  const [debouncedSearchKey, setDebouncedSearchKey] = useState('')
  const { currentItemList, localizedNames, isLoading, isLocalizedSearching } =
    useSkinList(debouncedSearchKey)
  const wzVersion = useRecoilValue(wzVersionState)
  const [filter, setFilter] = useState<SkinFilter>('all')
  const { data: localizedCurrentSkin } = useGetItemDetail(
    currentSkin?.id,
    localizedContent.version,
    localizedContent.region,
    localizedContent.locale !== 'ko'
  )

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearchKey(searchKey.trim()),
      SEARCH_DEBOUNCE_MS
    )

    return () => window.clearTimeout(timer)
  }, [searchKey])

  const getItemIconUrl = (skin: ItemDto) =>
    `https://maplestory.io/api/${wzVersion.region}/${wzVersion.version}/item/${skin.id}/icon`

  const preloadSkinImages = useCallback(
    (skinNumber: number) => {
      if (!wzVersion.version || !wzVersion.region) return Promise.resolve()

      const baseUrl = `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${skinNumber}`
      return preloadWzImageSequences(
        getPrebuiltActionSkinUrls(baseUrl) ?? getSkinImageUrls(baseUrl)
      )
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
        searchTerm: debouncedSearchKey,
        searchResultCount: filteredSkins.length,
        region: wzVersion.region,
        version: wzVersion.version
      })
    }

    onClose()
  }

  const filteredSkins = useMemo(() => {
    const normalizedSearchKey = debouncedSearchKey.toLocaleLowerCase()

    return currentItemList.filter((item) => {
      const localizedName =
        localizedNames.get(item.id) ??
        (item.id === currentSkin?.id
          ? localizedCurrentSkin?.description?.name
          : undefined)
      const matchesSearch =
        normalizedSearchKey.length === 0 ||
        item.name.toLocaleLowerCase('ko-KR').includes(normalizedSearchKey) ||
        localizedName?.toLocaleLowerCase().includes(normalizedSearchKey)
      const matchesFilter = matchesSkinFilter(item, filter)

      return matchesSearch && matchesFilter
    })
  }, [
    currentItemList,
    currentSkin?.id,
    debouncedSearchKey,
    filter,
    localizedCurrentSkin?.description?.name,
    localizedNames
  ])

  const getLocalizedSkinName = (skin: ItemDto) =>
    localizedNames.get(skin.id) ??
    (skin.id === currentSkin?.id
      ? localizedCurrentSkin?.description?.name
      : undefined)

  const currentSkinName =
    localizedCurrentSkin?.description?.name ?? currentSkin?.name
  const currentSkinNameLanguage = localizedCurrentSkin?.description?.name
    ? localizedContent.localeTag
    : 'ko-KR'
  const isSearchPending = searchKey.trim() !== debouncedSearchKey
  const isSearching = isSearchPending || isLocalizedSearching
  const isListLoading = isLoading || (isSearching && filteredSkins.length === 0)

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
          aria-label={t('skin.selectCurrent', {
            name: currentSkinName ?? currentSkin.name
          })}
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
            <span className={styles.skinText} lang={currentSkinNameLanguage}>
              {currentSkinName}
            </span>
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
              {t('skin.title')}
            </h2>
            <p id="skin-dialog-description" className={styles.description}>
              {t('skin.description')}
            </p>
          </div>

          {!hideCloseButton && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label={t('skin.close')}
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
              placeholder={t('skin.placeholder')}
              aria-label={t('skin.searchLabel')}
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

          <div
            className={styles.filterGroup}
            role="group"
            aria-label={t('skin.filterLabel')}
          >
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.filterButton} ${filter === option.value ? styles.activeFilter : ''}`}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {t(option.key)}
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
              <span className={styles.currentLabel}>{t('skin.current')}</span>
              <strong
                className={styles.currentName}
                lang={currentSkinNameLanguage}
              >
                {currentSkinName}
              </strong>
            </span>
            <span className={styles.appliedBadge}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m5 10 3 3 7-7" />
              </svg>
              {t('skin.applied')}
            </span>
          </div>
        )}

        <div className={styles.listHeader}>
          <span>{t('skin.list')}</span>
          <span className={styles.resultCount} aria-live="polite">
            {isListLoading
              ? t('skin.loadingShort')
              : formatCount('count', filteredSkins.length)}
          </span>
        </div>

        {open && (
          <div className={styles.body}>
            {isListLoading ? (
              <div className={styles.loadingState} role="status">
                <span className={styles.spinner} aria-hidden="true" />
                {t('skin.loading')}
              </div>
            ) : filteredSkins.length > 0 ? (
              filteredSkins.map((skin) => (
                <SkinItem
                  key={skin.id}
                  skin={skin}
                  currentSkin={currentSkin}
                  displayName={getLocalizedSkinName(skin) ?? skin.name}
                  nameLanguage={
                    getLocalizedSkinName(skin)
                      ? localizedContent.localeTag
                      : 'ko-KR'
                  }
                  searchKey={debouncedSearchKey}
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
                <strong>{t('common.noResults')}</strong>
                <span>{t('skin.emptyHint')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
