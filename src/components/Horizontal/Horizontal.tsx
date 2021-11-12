import React from 'react'
import { CSSProperties } from 'styled-components'
import * as S from './style'

type Props = {
  gap?: number
  style?: CSSProperties
}
const Horizontal: React.FC<Props> = ({ gap, style, children }) => {
  return (
    <S.Container gap={gap} style={style}>
      {gap !== undefined && gap < 0 ? (
        <div style={{ marginLeft: gap }}>{children}</div>
      ) : (
        children
      )}
    </S.Container>
  )
}

export default Horizontal
