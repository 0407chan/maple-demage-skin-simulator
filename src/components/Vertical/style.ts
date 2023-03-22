import styled from 'styled-components'
import { GapOptionType } from '../Horizontal/Horizontal'
import { gapOption } from '../Horizontal/style'

type Props = {
  gap?: number | GapOptionType
}

export const Container = styled.div<Props>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 100%;

  ${({ gap }) => {
    if (gap === undefined) return { gap: '16px' }
    if (Number.isInteger(gap)) return { gap: `${gap}px` }
    return { gap: `${gapOption[gap as GapOptionType]}px` }
  }}
`
