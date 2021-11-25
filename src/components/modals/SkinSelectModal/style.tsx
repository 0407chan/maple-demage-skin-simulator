import { Input as OriginalInput } from 'antd/lib'
import styled from 'styled-components'
export const BackBoard = styled.div<{ isOpen: boolean }>`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 4;
  background-color: rgba(0, 0, 0, 0.3);
  ${(props) =>
    props.isOpen
      ? { visibility: 'visible', opacity: 1 }
      : { visibility: 'hidden', opacity: 0 }}
`
export const Container = styled.div<{ isOpen: boolean }>`
  display: flex;
  position: absolute;
  left: 20px;
  top: 20px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(60, 60, 60, 0.93);
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.8);
  border-radius: 5px;
  border: 1px solid rgba(169, 169, 169, 0.9);
  gap: 10px;
  opacity: 0;
  z-index: 10;
  @media screen and (max-width: 400px) {
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
  }
  width: 360px;
  height: calc(100vh - 40px);
  transition: all 0.3s ease;
  ${(props) =>
    props.isOpen
      ? { visibility: 'visible', opacity: 1 }
      : { visibility: 'hidden', opacity: 0 }}
`

export const Header = styled.div`
  display: flex;
  width: 100%;
  font-size: 12px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #ffcc5f;
  padding-top: 10px;
  padding-bottom: 5px;
`
export const Body = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  overflow-y: scroll;
  gap: 4px;
  width: 100%;
  height: 100%;

  /* width */
  &::-webkit-scrollbar {
    width: 10px;
  }

  /* Track */
  &::-webkit-scrollbar-track {
    background: unset;
  }

  /* Handle */
  &::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background: #777;
  }

  /* Handle on hover */
  &::-webkit-scrollbar-thumb:hover {
    background: #888;
  }
`

export const SkinItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 4px 16px;
  margin-left: 16px;
  border-radius: 5px;
  width: calc(100% - 32px);

  &:hover {
    color: #eeeeee;
    background-color: #7676767e;
  }

  .skin-img {
  }
  .skin-text {
    color: #e1e1e1;
  }
  &.current-skin {
    box-shadow: 0px 0px 5px 1px #eeeeee9a;
    background-color: #eeeeee9a;
    .skin-text {
      color: #181818;
    }
  }
  .current-skin-text {
    color: #91ff31;
    font-weight: bold;
  }
`

export const HighlightText = styled.span`
  background-color: #ffc60a;
  color: #3e3003;
  font-weight: bold;
`

export const Content = styled.div`
  display: flex;
  width: 100%;
  border-radius: 5px;
  background-color: #eeeeeee7;
`

export const Footer = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
`

export const CloseButton = styled.button`
  display: flex;
  position: absolute;
  top: 7px;
  right: 10px;
  font-weight: bold;
  width: fit-content;
  align-items: center;
  border: unset;
  background-color: unset;
  justify-content: center;
  color: #eeeeee;

  &:hover {
    cursor: pointer;
    color: #ffd884;
  }
`

export const Input = styled(OriginalInput)`
  width: calc(100% - 30px);
  background-color: #eeeeee;
  &:disabled {
    background-color: #c8c8c8;
  }
`

export const InfoText = styled.span`
  display: flex;
  width: 100%;
  justify-content: center;
  color: #eeeeee;
`
