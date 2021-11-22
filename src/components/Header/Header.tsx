import Button from 'antd/lib/button'
import React, { useState } from 'react'
import SkinSelectModal from '../modals/SkinSelectModal'
import * as S from './style'

type Props = {
  temp?: number
}
const Header: React.FC<Props> = ({ temp }) => {
  const [showSkinModal, setShowSkinModal] = useState<boolean>(false)
  const onOpenModal = () => setShowSkinModal(true)
  const onCloseModal = () => setShowSkinModal(false)
  return (
    <>
      <S.Container>
        <Button onClick={onOpenModal}>스킨</Button>
      </S.Container>
      <SkinSelectModal isOpen={showSkinModal} onCancel={onCloseModal} />
    </>
  )
}

export default Header
