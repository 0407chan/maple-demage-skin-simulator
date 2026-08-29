import styled from 'styled-components'

export const Container = styled.div<{ $spawnBottom: number }>`
  display: flex;
  position: absolute;
  bottom: ${({ $spawnBottom }) => `${$spawnBottom}px`};
`
