import { SkinMap } from 'constants/damageSkinMapper'
import useBoolean from 'hooks/useBoolean'
import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import { ItemDto } from 'type/damage-skin'
import { SkinItem } from './SkinItem'
import styles from './style.module.scss'
import { useSkinList } from './useSkinList'
import { Spin } from 'antd'
import { useRecoilState, useRecoilValue } from 'recoil'
import { imageCacheState } from 'atoms/imageCache'
import { wzVersionState } from 'atoms/wzVersion'
import { Button, Divider, Input } from 'antd'

type SkinSelectModalProps = {
  currentSkin?: ItemDto
  onConfirm: (num: number) => void
  setCurrentSkin: (skin?: ItemDto) => void
  hideCloseButton?: boolean
}

// API로부터 base64 이미지를 가져오는 함수
const fetchBase64Image = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return `data:image/png;base64,${data.value}`
  } catch (error) {
    console.error('Failed to fetch image:', error)
    return ''
  }
}

export const SkinSelectModal: React.FC<SkinSelectModalProps> = ({
  currentSkin,
  hideCloseButton = false,
  setCurrentSkin,
  onConfirm
}) => {
  const [open, { setTrue: onOpen, setFalse: onClose }] = useBoolean(false)
  const [searchKey, setSearchKey] = useState('')
  const { currentItemList, newSkinItemList, isLoading } = useSkinList()
  const [imageCache, setImageCache] = useRecoilState(imageCacheState)
  const wzVersion = useRecoilValue(wzVersionState)

  // 스킨 이미지 프리로드 함수
  const preloadSkinImages = async (skinNumber: number) => {
    // wzVersion이 없으면 실행 안 함
    if (!wzVersion.version || !wzVersion.region) {
      return
    }

    const baseUrl = `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${skinNumber}`

    const urls: string[] = []

    // 숫자 0-9 이미지들
    for (let i = 0; i <= 9; i++) {
      urls.push(`${baseUrl}/NoCri0/${i}`)
      urls.push(`${baseUrl}/NoCri1/${i}`)
      urls.push(`${baseUrl}/NoRed0/${i}`)
      urls.push(`${baseUrl}/NoRed1/${i}`)
    }

    // 크리티컬 이펙트
    urls.push(`${baseUrl}/NoCri1/effect3`)

    // 유닛 (만, 억)
    urls.push(`${baseUrl}/NoCustom/NoCri1/3`)
    urls.push(`${baseUrl}/NoCustom/NoCri1/4`)
    urls.push(`${baseUrl}/NoCustom/NoRed1/3`)
    urls.push(`${baseUrl}/NoCustom/NoRed1/4`)

    // 캐시에 없는 것만 로드
    const urlsToLoad = urls.filter(url => !imageCache[url])

    // 백그라운드에서 비동기로 로드
    Promise.all(
      urlsToLoad.map(async (url) => {
        const base64 = await fetchBase64Image(url)
        if (base64) {
          setImageCache((prev) => ({ ...prev, [url]: base64 }))
        }
      })
    ).catch((error) => {
      console.error('Failed to preload images:', error)
    })
  }

  // 기본 스킨 설정
  useEffect(() => {
    if (!currentSkin && currentItemList.length > 0) {
      const defaultSkin = currentItemList.find((item) =>
        item.name.includes('흐물냥 데미지 스킨')
      )
      if (defaultSkin) {
        setCurrentSkin(defaultSkin)
        // 기본 스킨 이미지 프리로드
        const skinNumber = SkinMap[defaultSkin.id]
        if (skinNumber) {
          preloadSkinImages(skinNumber)
        }
      }
    }
  }, [currentItemList, currentSkin])

  // currentSkin 변경 시에도 프리로드 (새로고침 후에도 동작)
  useEffect(() => {
    if (currentSkin) {
      const skinNumber = SkinMap[currentSkin.id]
      if (skinNumber) {
        preloadSkinImages(skinNumber)
      }
    }
  }, [currentSkin?.id])

  const handleSkinSelect = (skin: ItemDto) => {
    ReactGA.event({
      category: 'button_click',
      action: 'select_skin',
      label: skin.name,
      value: 1
    })
    setCurrentSkin(skin)
    onConfirm(SkinMap[skin.id])

    // 백그라운드에서 이미지 프리로드
    preloadSkinImages(SkinMap[skin.id])

    onClose()
  }

  const getFilteredSkins = (items: ItemDto[]) => {
    if (!searchKey) return items
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchKey.toLowerCase())
    )
  }

  return (
    <>
      {currentSkin && (
        <div
          className={styles.skinButton}
          style={{ position: 'absolute', top: 8, left: 0 }}
          onClick={onOpen}
        >
          <img
            className={styles.skinImg}
            src={`https://maplestory.io/api/KMS/356/item/${currentSkin.id}/icon`}
            alt={currentSkin.name}
          />
          <span className={styles.skinText}>{currentSkin.name}</span>
        </div>
      )}

      <div className={`${styles.backBoard} ${open ? styles.open : ''}`} onClick={onClose} />
      <Spin spinning={isLoading}>
        <div className={`${styles.container} ${open ? styles.open : ''}`}>
          <div className={styles.header}>데미지 스킨 선택</div>
          <Input
            className={styles.input}
            maxLength={20}
            value={searchKey}
            placeholder="검색"
            onChange={(e) => setSearchKey(e.target.value)}
          />

          {!hideCloseButton && (
            <Button size="small" className={styles.closeButton} onClick={onClose}>
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

          <div className={styles.body}>
            {getFilteredSkins(currentItemList).length > 0 ? (
              getFilteredSkins(currentItemList).map((skin) => (
                <SkinItem
                  key={skin.id}
                  skin={skin}
                  currentSkin={currentSkin}
                  searchKey={searchKey}
                  onSelect={handleSkinSelect}
                />
              ))
            ) : (
              <span className={styles.infoText}>[{searchKey}] 스킨이 없습니다.</span>
            )}
          </div>
        </div>
      </Spin>
    </>
  )
}
