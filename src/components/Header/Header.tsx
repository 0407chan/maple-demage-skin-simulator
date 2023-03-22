import React, { useEffect, useState } from 'react'
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
  setCurrentSkin: React.Dispatch<React.SetStateAction<ItemDto | undefined>>
  setting: Setting
  setSetting: React.Dispatch<React.SetStateAction<Setting>>
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
  const onOpenModal = () => setShowSkinModal(true)
  const onCloseModal = () => setShowSkinModal(false)

  const [showSettingModal, setShowSettingModal] = useState<boolean>(false)
  const onOpenSetting = () => setShowSettingModal(true)
  const onCloseSetting = () => setShowSettingModal(false)

  const onConfirm = (skinNumber: number) => {
    onSetSkinNumber(skinNumber)
  }

  const preLoadImage = () => {
    for (let index = 0; index <= 9; index++) {
      new Image().src = `/images/export/Effect-DamageSkin.img-${skinNumber}-NoCri1-${index}.png`
      new Image().src = `/images/export/Effect-DamageSkin.img-${skinNumber}-NoCri0-${index}.png`
      new Image().src = `/images/export/Effect-DamageSkin.img-${skinNumber}-NoRed1-${index}.png`
      new Image().src = `/images/export/Effect-DamageSkin.img-${skinNumber}-NoRed0-${index}.png`
    }
    new Image().src = `/images/export/Effect-DamageSkin.img-${skinNumber}-NoCri1-effect3.png`
    new Image().src = `/images/export/Effect-DamageSkin.img-${skinNumber}-NoCustom-NoCri0-3.png` // 만
    new Image().src = `/images/export/Effect-DamageSkin.img-${skinNumber}-NoCustom-NoCri0-4.png` // 억
    new Image().src = `/images/export/Effect-DamageSkin.img-${skinNumber}-NoCustom-NoRed0-3.png`
    new Image().src = `/images/export/Effect-DamageSkin.img-${skinNumber}-NoCustom-NoRed0-4.png`
  }

  const changeFavicon = () => {
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
  useEffect(() => {
    changeFavicon()
  }, [currentSkin])

  useEffect(() => {
    preLoadImage()
  }, [skinNumber])

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
