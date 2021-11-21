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

export const Container = styled.div`
  display: flex;
  position: absolute;
  opacity: 0;
  animation: ${skinDisapper} 1s linear;
`

export const CriEffect = styled.div`
  display: flex;
`
