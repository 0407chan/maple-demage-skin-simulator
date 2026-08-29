import { Button as OriginalButton, Input as OriginalInput } from 'antd/lib'
import styled from 'styled-components'

export const BackBoard = styled.div<{ open: boolean }>`
  display: flex;
  position: fixed;
  inset: 0;
  z-index: 4;
  background-color: rgba(0, 0, 0, 0.3);
  ${(props) =>
    props.open
      ? { visibility: 'visible', opacity: 1 }
      : { visibility: 'hidden', opacity: 0 }}
`
export const Container = styled.div<{ open: boolean }>`
  display: flex;
  position: fixed;
  right: 20px;
  top: 20px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: rgba(60, 60, 60, 0.93);
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.8);
  border-radius: 5px;
  border: 1px solid rgba(169, 169, 169, 0.9);
  padding: 0 15px 15px 15px;
  gap: 10px;
  opacity: 0;
  z-index: 8;
  width: 360px;
  max-width: calc(100vw - 40px);
  max-height: calc(100dvh - 40px);
  box-sizing: border-box;
  overflow: hidden;
  transition: all 0.3s ease;
  ${(props) =>
    props.open
      ? { visibility: 'visible', opacity: 1 }
      : { visibility: 'hidden', opacity: 0 }}

  &:focus-visible {
    outline: 2px solid #ffcc5f;
    outline-offset: 2px;
  }

  @media screen and (max-width: 500px) {
    width: calc(100vw - 40px);
  }

  @media screen and (max-height: 500px) {
    top: 12px;
    right: 12px;
    max-height: calc(100dvh - 24px);
  }
`

export const Header = styled.div`
  display: flex;
  width: 100%;
  font-size: 15px;
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
  gap: 4px;
  width: 100%;
  height: auto;

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

export const ScrollArea = styled.div`
  display: flex;
  min-height: 0;
  width: 100%;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 2px;
  box-sizing: border-box;
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
  border-radius: 5px;
  padding: 10px;
  background-color: #454444e7;
  box-sizing: border-box;
`

export const Footer = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
`

export const CloseButton = styled(OriginalButton)`
  display: flex;
  position: absolute;
  top: 12px;
  right: 15px;
  width: 32px;
  height: 32px;
  font-weight: bold;
  justify-content: center;
  align-items: center;
  border-radius: 5px !important;
  background-color: #e6ae35;
  color: #eeeeee;
  font-weight: bolder;
  border: unset;

  &:hover {
    color: #eeeeee;
    background-color: #f4c04f;
  }

  &:active {
    color: #eeeeee;
    background-color: #e6ae35;
  }
  &:focus {
    background-color: #c9982d;
    color: #eeeeee;
  }

  .ex {
    display: flex;
    position: absolute;
    left: 4;
    width: 14px;
    border-radius: 2px;
    background-color: #eeeeee;
    border: 2px solid #eeeeee;
  }
  .left {
    transform: rotate(45deg);
  }
  .right {
    transform: rotate(135deg);
  }
`

export const Input = styled(OriginalInput)`
  width: calc(100% - 30px);
  background-color: #2b2b2bc7;
  color: #eeeeee;
  border: 1px solid #4f3b11c6;
  &:hover {
    border: 1px solid #9a7320;
  }
  &:focus {
    border: 1px solid #d5a130;
  }
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

export const TitleLabel = styled.div`
  margin-left: 2px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #eeeeee;
`
export const Label = styled.label`
  display: flex;
  width: 40%;
  font-size: 0.9rem;
  color: #cbcbcb;
`
