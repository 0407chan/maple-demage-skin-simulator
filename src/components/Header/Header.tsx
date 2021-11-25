import { ItemDto } from '@/type/damage-skin'
import Button from 'antd/lib/button'
import React, { useState } from 'react'
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
        <Button disabled>세팅</Button>
      </S.Container>
      <SkinSelectModal
        isOpen={showSkinModal}
        setCurrentSkin={setCurrentSkin}
        onCancel={onCloseModal}
        onConfirm={(num: number) => onSetSkinNumber(num)}
      />
    </>
  )
}

export default Header
