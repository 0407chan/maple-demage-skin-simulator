import { ItemDto } from '@/type/damage-skin'
import React, { useEffect, useState } from 'react'
import SkinSelectModal from '../modals/SkinSelectModal'
import * as S from './style'

type Props = {
  skinNumber: number
  onSetSkinNumber: (newId: number) => void
}
const Header: React.FC<Props> = ({ skinNumber, onSetSkinNumber }) => {
  const [showSkinModal, setShowSkinModal] = useState<boolean>(false)
  const onOpenModal = () => setShowSkinModal(true)
  const onCloseModal = () => setShowSkinModal(false)
  const [currentSkin, setCurrentSkin] = useState<ItemDto>()

  const onConfirm = (skinNumber: number) => {
    onSetSkinNumber(skinNumber)
  }

  const preLoadImage = () => {
    for (let index = 0; index <= 9; index++) {
      new Image().src = `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${skinNumber}-NoCri1-${index}.png`
      new Image().src = `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${skinNumber}-NoCri0-${index}.png`
      new Image().src = `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${skinNumber}-NoRed1-${index}.png`
      new Image().src = `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${skinNumber}-NoRed0-${index}.png`
    }
    new Image().src = `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${skinNumber}-NoCri1-effect3.png`
  }
  useEffect(() => {
    preLoadImage()
  }, [skinNumber])

  return (
    <>
      <S.Container>
        {currentSkin && (
          <S.SkinButton onClick={onOpenModal}>
            <img
              className="skin-img"
              src={`https://maplestory.io/api/KMS/352/item/${currentSkin.id}/icon`}
            />
            <span className="skin-text">{currentSkin.name}</span>
          </S.SkinButton>
        )}
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
        {/* <Button disabled>세팅</Button> */}
      </S.Container>
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
