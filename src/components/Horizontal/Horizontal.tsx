import React, { CSSProperties } from 'react'
import * as S from './style'

export type GapOptionType = 'small' | 'middle' | 'large' | 'none'

type Props = {
  gap?: number | GapOptionType
  style?: CSSProperties
  onClick?: () => void
  children?: React.ReactNode
}
export default function Horizontal({
  gap,
  style,
  onClick,
  children
}: Props): JSX.Element {
  return (
    <S.Container gap={gap} style={style} onClick={onClick}>
      {children}
    </S.Container>
  )
}
