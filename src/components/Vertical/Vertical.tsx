import React, { CSSProperties } from 'react'
import { GapOptionType } from '../Horizontal/Horizontal'
import * as S from './style'

type Props = {
  gap?: number | GapOptionType
  style?: CSSProperties
  children?: React.ReactNode
}

const Vertical: React.FC<Props> = ({ gap, style, children }) => {
  return (
    <S.Container gap={gap} style={style}>
      {children}
    </S.Container>
  )
}

export default Vertical
