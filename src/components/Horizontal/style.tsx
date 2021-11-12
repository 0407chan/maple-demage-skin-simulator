import styled from 'styled-components'

type Props = {
  gap?: number
}
export const Container = styled.div<Props>`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  gap: 16px;

  ${(props) =>
    props.gap !== undefined && {
      gap: props.gap
    }}
`
