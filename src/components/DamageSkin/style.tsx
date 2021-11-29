import styled, { keyframes } from 'styled-components'

const skinDisapper = keyframes`
  0% {
    transform: translateY(0px);
    opacity: 1;
  }

  50%{
    transform: translateY(-40px);
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateY(-80px);
  }
`

export const Container = styled.div<{ stop?: boolean; delay?: number }>`
  display: flex;
  position: absolute;
  align-items: center;
  opacity: 0;
  animation: ${skinDisapper} 1s linear;
  ${(props) =>
    props.stop && {
      animation: 'unset',
      opacity: 1
    }}

  ${(props) =>
    props.delay !== undefined && {
      animationDelay: `${props.delay * 0.1}s`
    }}
`

export const CriEffect = styled.div`
  display: flex;
`
