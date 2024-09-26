import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ItemDto } from 'type/damage-skin'
import { Setting } from 'type/setting'
import GreenButton from '../GreenButton'
import SettingModal from '../modals/SettingModal'
import SkinSelectModal from '../modals/SkinSelectModal'
import * as S from './style'

type Props = {
  skinNumber: number
  onSetSkinNumber: (newId: number) => void
  currentSkin?: ItemDto
  setCurrentSkin: (skin?: ItemDto) => void
  setting: Setting
  setSetting: (newSetting: Setting) => void
}
const Header: React.FC<Props> = ({
  skinNumber,
  onSetSkinNumber,
  currentSkin,
  setCurrentSkin,
  setting,
  setSetting
}) => {
  const [showSkinModal, setShowSkinModal] = useState<boolean>(false)
  const [showSettingModal, setShowSettingModal] = useState<boolean>(false)

  const onOpenModal = useCallback(() => setShowSkinModal(true), [])
  const onCloseModal = useCallback(() => setShowSkinModal(false), [])
  const onOpenSetting = useCallback(() => setShowSettingModal(true), [])
  const onCloseSetting = useCallback(() => setShowSettingModal(false), [])

  const onConfirm = useCallback((newSkinNumber: number) => {
    onSetSkinNumber(newSkinNumber)
  }, [onSetSkinNumber])

  const preLoadImage = useCallback(() => {
    const img = new Image()
    for (let index = 0; index <= 9; index++) {
      img.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoCri1-${index}.png`
      img.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoCri0-${index}.png`
      img.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoRed1-${index}.png`
      img.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoRed0-${index}.png`
    }
    img.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoCri1-effect3.png`
    img.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoCustom-NoCri0-3.png`
    img.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoCustom-NoCri0-4.png`
    img.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoCustom-NoRed0-3.png`
    img.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoCustom-NoRed0-4.png`
  }, [skinNumber])

  const changeFavicon = useMemo(() => {
    return () => {
      if (currentSkin === undefined) return
      let link: HTMLLinkElement | null =
        document.querySelector('link[rel="shortcut icon"]') ||
        document.querySelector('link[rel="icon"]')

      if (!link) {
        link = document.createElement('link')
        link.id = 'favicon'
        link.rel = 'shortcut icon'
        document.head.appendChild(link)
      }

      link.href = `https://maplestory.io/api/KMS/356/item/${currentSkin.id}/icon`
    }
  }, [currentSkin])

  useEffect(() => {
    changeFavicon()
  }, [changeFavicon])

  useEffect(() => {
    preLoadImage()
  }, [preLoadImage])

  return (
    <>
      {currentSkin && (
        <S.Container>
          <S.SkinButton onClick={onOpenModal}>
            <img
              className="skin-img"
              src={`https://maplestory.io/api/KMS/356/item/${currentSkin.id}/icon`}
            />
            <span className="skin-text">{currentSkin.name}</span>
          </S.SkinButton>
          {/* <Horizontal style={{ justifyContent: 'center' }}>
          <Button
          disabled={skinNumber === 1}
          onClick={() => onSetSkinNumber(skinNumber - 1)}
          >
          -
          </Button>
          <InputNumber
          style={{ width: 80, textAlign: 'center' }}
          value={skinNumber}
          onChange={(value) => onSetSkinNumber(value)}
          />
          <Button onClick={() => onSetSkinNumber(skinNumber + 1)}>+</Button>
        </Horizontal> */}
          <GreenButton onClick={onOpenSetting}>세팅</GreenButton>
        </S.Container>
      )}
      <SettingModal
        isOpen={showSettingModal}
        setting={setting}
        setSetting={setSetting}
        onCancel={onCloseSetting}
      />
      <SkinSelectModal
        isOpen={showSkinModal}
        currentSkin={currentSkin}
        setCurrentSkin={setCurrentSkin}
        onCancel={onCloseModal}
        onConfirm={onConfirm}
      />
    </>
  )
}

export default Header
