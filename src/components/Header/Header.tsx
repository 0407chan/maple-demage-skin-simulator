import { InputNumber } from 'antd'
import Button from 'antd/lib/button'
import React, { useState } from 'react'
import Horizontal from '../Horizontal'
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
  return (
    <>
      <S.Container>
        <Button onClick={onOpenModal}>스킨</Button>
        <Horizontal style={{ justifyContent: 'center' }}>
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
        </Horizontal>
        <Button disabled>세팅</Button>
      </S.Container>
      <SkinSelectModal isOpen={showSkinModal} onCancel={onCloseModal} />
    </>
  )
}

export default Header
