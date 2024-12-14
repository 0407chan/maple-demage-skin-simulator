import { SkinMap } from 'constants/damageSkinMapper'
import useBoolean from 'hooks/useBoolean'
import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import { ItemDto } from 'type/damage-skin'
import { SkinItem } from './SkinItem'
import * as S from './style'
import { useSkinList } from './useSkinList'

type SkinSelectModalProps = {
  currentSkin?: ItemDto
  onConfirm: (num: number) => void
  setCurrentSkin: (skin?: ItemDto) => void
  hideCloseButton?: boolean
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

  useEffect(() => {
    if (!currentSkin && currentItemList.length > 0) {
      const defaultSkin = currentItemList.find((item) =>
        item.name.includes('흐물냥 데미지 스킨')
      )
      setCurrentSkin(defaultSkin)
    }
  }, [currentItemList, currentSkin, setCurrentSkin])

  const handleSkinSelect = (skin: ItemDto) => {
    ReactGA.event({
      category: 'button_click',
      action: 'select_skin',
      label: skin.name,
      value: 1
    })
    setCurrentSkin(skin)
    onConfirm(SkinMap[skin.id])
    onClose()
  }

  const getFilteredSkins = (items: ItemDto[]) => {
    if (!searchKey) return items
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchKey.toLowerCase())
    )
  }

  if (isLoading) {
    return <S.Container open={open}>로딩중...</S.Container>
  }

  return (
    <>
      {currentSkin && (
        <S.SkinButton
          style={{ position: 'absolute', top: 8, left: 0 }}
          onClick={onOpen}
        >
          <img
            className="skin-img"
            src={`https://maplestory.io/api/KMS/356/item/${currentSkin.id}/icon`}
            alt={currentSkin.name}
          />
          <span className="skin-text">{currentSkin.name}</span>
        </S.SkinButton>
      )}

      <S.BackBoard open={open} onClick={onClose} />
      <S.Container open={open}>
        <S.Header>데미지 스킨 선택</S.Header>
        <S.Input
          maxLength={20}
          value={searchKey}
          placeholder="검색"
          onChange={(e) => setSearchKey(e.target.value)}
        />

        {!hideCloseButton && (
          <S.CloseButton size="small" onClick={onClose}>
            <div className="ex left" />
            <div className="ex right" />
          </S.CloseButton>
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
            <S.Divider />
          </>
        )}

        <S.Body>
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
            <S.InfoText>[{searchKey}] 스킨이 없습니다.</S.InfoText>
          )}
        </S.Body>
      </S.Container>
    </>
  )
}
