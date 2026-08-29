import { SkinMap } from 'constants/damageSkinMapper'
import useBoolean from 'hooks/useBoolean'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactGA from 'react-ga4'
import { ItemDto } from 'type/damage-skin'
import { SkinItem } from './SkinItem'
import styles from './style.module.scss'
import { useSkinList } from './useSkinList'
import { Segmented, Spin } from 'antd'
import { useRecoilValue } from 'recoil'
import { wzVersionState } from 'atoms/wzVersion'
import { Button, Divider, Input } from 'antd'
import { preloadBase64Images } from 'utils/base64ImageCache'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'

type SkinSelectModalProps = {
  currentSkin?: ItemDto
  onConfirm: (num: number) => void
  setCurrentSkin: (skin?: ItemDto) => void
  hideCloseButton?: boolean
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
  const [filter, setFilter] = useState<'all' | 'unit' | 'action'>('all')

  const preloadSkinImages = useCallback(
    (skinNumber: number) => {
      if (!wzVersion.version || !wzVersion.region) return Promise.resolve()

      const baseUrl = `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${skinNumber}`
      return preloadBase64Images(getSkinImageUrls(baseUrl))
    },
    [wzVersion.region, wzVersion.version]
  )

  // 기본 스킨 설정
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

  // currentSkin 변경 시에도 프리로드 (새로고침 후에도 동작)
  useEffect(() => {
    if (currentSkin) {
      const skinNumbers = SkinMap[currentSkin.id]
      if (skinNumbers && skinNumbers.length > 0) {
        void preloadSkinImages(skinNumbers[0])
      }
    }
  }, [currentSkin, preloadSkinImages])

  const handleSkinSelect = (skin: ItemDto) => {
    ReactGA.event({
      category: 'button_click',
      action: 'select_skin',
      label: skin.name,
      value: 1
    })
    setCurrentSkin(skin)
    const skinNumbers = SkinMap[skin.id]
    if (skinNumbers && skinNumbers.length > 0) {
      onConfirm(skinNumbers[0])
    }

    onClose()
  }

  const filteredSkins = useMemo(() => {
    const normalizedSearchKey = searchKey.trim().toLocaleLowerCase('ko-KR')

    return currentItemList.filter((item) => {
      const matchesSearch =
        normalizedSearchKey.length === 0 ||
        item.name.toLocaleLowerCase('ko-KR').includes(normalizedSearchKey)
      const matchesFilter =
        filter === 'all' ||
        (filter === 'unit' && item.name.includes('유닛')) ||
        (filter === 'action' && (SkinMap[item.id]?.length ?? 0) > 1)

      return matchesSearch && matchesFilter
    })
  }, [currentItemList, filter, searchKey])

  return (
    <>
      {currentSkin && (
        <button
          ref={triggerRef}
          type="button"
          className={styles.skinButton}
          style={{ position: 'absolute', top: 8, left: 0 }}
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <img
            className={styles.skinImg}
            src={`https://maplestory.io/api/${wzVersion.region}/${wzVersion.version}/item/${currentSkin.id}/icon`}
            alt=""
          />
          <span className={styles.skinText}>{currentSkin.name}</span>
        </button>
      )}

      <div
        className={`${styles.backBoard} ${open ? styles.open : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <Spin spinning={isLoading}>
        <div
          ref={dialogRef}
          className={`${styles.container} ${open ? styles.open : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="skin-dialog-title"
          aria-hidden={!open}
          tabIndex={-1}
        >
          <div id="skin-dialog-title" className={styles.header}>
            데미지 스킨 선택
          </div>
          <Input
            id="skin-search"
            className={styles.input}
            maxLength={20}
            value={searchKey}
            placeholder="검색"
            aria-label="데미지 스킨 검색"
            onChange={(e) => setSearchKey(e.target.value)}
          />

          {!hideCloseButton && (
            <Button
              size="small"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="데미지 스킨 선택 닫기"
            >
              <div className="ex left" />
              <div className="ex right" />
            </Button>
          )}

          {currentSkin && (
            <>
              <div style={{ color: '#eeeeee' }}>현재 스킨</div>
              <SkinItem
                skin={currentSkin}
                currentSkin={currentSkin}
                searchKey={searchKey}
                onSelect={handleSkinSelect}
              />
              <Divider className={styles.divider} />
            </>
          )}

          <Segmented
            options={[
              { label: '전체', value: 'all' },
              { label: '유닛', value: 'unit' },
              { label: '액션', value: 'action' }
            ]}
            value={filter}
            onChange={(value) => setFilter(value as 'all' | 'unit' | 'action')}
          />
          <div className={styles.body}>
            {filteredSkins.length > 0 ? (
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
              <span className={styles.infoText}>
                [{searchKey}] 스킨이 없습니다.
              </span>
            )}
          </div>
        </div>
      </Spin>
    </>
  )
}
