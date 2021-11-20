import React from 'react'
import * as S from './style'

type Props = {
  skinId?: number
  isCritical?: boolean
}
const DamageSkin: React.FC<Props> = ({ skinId, isCritical }) => {
  return <S.Container>가자</S.Container>
}

export default DamageSkin
