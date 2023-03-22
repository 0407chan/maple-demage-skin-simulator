import styled from 'styled-components'
import { GapOptionType } from './Horizontal'

type Props = {
  gap?: number | GapOptionType
}

export const gapOption: Record<GapOptionType, number> = {
  large: 24,
  middle: 16,
  small: 8,
  none: 0
}

export const Container = styled.div<Props>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  width: 100%;

  ${({ gap }) => {
    if (gap === undefined) return { gap: '16px' }
    if (Number.isInteger(gap)) return { gap: `${gap}px` }
    return { gap: `${gapOption[gap as GapOptionType]}px` }
  }}
`
