import { Input as OriginalInput } from 'antd'
import styled from 'styled-components'

export const TriggerButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  display: inline-flex;
  min-width: 44px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(33, 39, 51, 0.86);
  box-shadow: 0 8px 24px rgba(8, 10, 15, 0.18);
  color: #f6f8fb;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: rgba(255, 200, 87, 0.48);
    background: rgba(43, 50, 64, 0.96);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 200, 87, 0.34);
    outline-offset: 3px;
  }

  @media screen and (max-width: 640px) {
    top: 14px;
    right: 14px;
  }
`

export const TriggerIcon = styled.span`
  display: grid;
  width: 17px;
  gap: 3px;

  span {
    position: relative;
    display: block;
    height: 1.5px;
    border-radius: 999px;
    background: #ffc857;
  }

  span::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 4px;
    height: 4px;
    border: 1.5px solid #ffc857;
    border-radius: 50%;
    background: #252b37;
    transform: translate(-50%, -50%);
  }

  span:nth-child(1)::after,
  span:nth-child(3)::after {
    left: 35%;
  }

  span:nth-child(2)::after {
    left: 68%;
  }
`

export const BackBoard = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 4;
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  background: rgba(6, 8, 13, 0.68);
  backdrop-filter: blur(8px);
  transition:
    opacity 240ms ease,
    visibility 240ms ease;
`

export const Container = styled.div<{ $open: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 8;
  display: flex;
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  width: min(560px, calc(100vw - 48px));
  max-height: calc(100dvh - 48px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  background:
    radial-gradient(circle at 88% 0%, rgba(255, 200, 87, 0.1), transparent 35%),
    linear-gradient(160deg, rgba(30, 36, 48, 0.99), rgba(20, 24, 33, 0.99));
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.52),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: ${({ $open }) =>
    $open
      ? 'translate(-50%, -50%) scale(1)'
      : 'translate(-50%, -47%) scale(0.97)'};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition:
    opacity 220ms ease,
    transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1),
    visibility 280ms ease;

  &:focus-visible {
    outline: 3px solid rgba(255, 200, 87, 0.4);
    outline-offset: 4px;
  }

  @media screen and (max-width: 640px) {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: min(90dvh, 760px);
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 28px 28px 0 0;
    opacity: 1;
    transform: ${({ $open }) => ($open ? 'translateY(0)' : 'translateY(105%)')};
    transition:
      transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
      visibility 320ms ease;
  }

  @media screen and (max-width: 640px) and (max-height: 540px) {
    max-height: calc(100dvh - 10px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition-duration: 1ms;
  }
`

export const SheetHandle = styled.div`
  display: none;

  @media screen and (max-width: 640px) {
    display: block;
    width: 42px;
    height: 4px;
    flex: 0 0 auto;
    margin: 10px auto 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.2);
  }
`

export const Header = styled.header`
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 30px 30px 20px;

  @media screen and (max-width: 640px) {
    padding: 16px 20px 16px;
  }
`

export const HeaderCopy = styled.div`
  min-width: 0;
`

export const Eyebrow = styled.span`
  display: block;
  margin-bottom: 7px;
  color: #ffc857;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
`

export const DialogTitle = styled.h2`
  margin: 0;
  color: #f7f8fb;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.15;

  @media screen and (max-width: 640px) {
    font-size: 24px;
  }
`

export const Description = styled.p`
  margin: 8px 0 0;
  color: #929aaa;
  font-size: 13px;
  line-height: 1.45;
`

export const CloseButton = styled.button`
  position: relative;
  display: flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.055);
  color: #c7ced9;
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;

  span::before,
  span::after {
    content: '';
    position: absolute;
    top: 19px;
    left: 12px;
    width: 16px;
    height: 2px;
    border-radius: 999px;
    background: currentColor;
  }

  span::before {
    transform: rotate(45deg);
  }

  span::after {
    transform: rotate(-45deg);
  }

  &:hover {
    border-color: rgba(255, 200, 87, 0.25);
    background: rgba(255, 200, 87, 0.09);
    color: #ffc857;
    transform: rotate(3deg);
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 200, 87, 0.3);
    outline-offset: 2px;
  }
`

export const ScrollArea = styled.div`
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 30px calc(26px + env(safe-area-inset-bottom));
  overscroll-behavior: contain;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.16);
  }

  @media screen and (max-width: 640px) {
    padding: 0 16px calc(18px + env(safe-area-inset-bottom));
  }
`

export const DamageCard = styled.section`
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.035);

  @media screen and (max-width: 640px) {
    padding: 17px;
    border-radius: 18px;
  }
`

export const ControlGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;

  @media screen and (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

export const ControlCard = styled.section`
  min-width: 0;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.035);

  @media screen and (max-width: 640px) {
    padding: 16px;
    border-radius: 18px;
  }
`

export const SectionHeading = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
`

export const SectionIcon = styled.span`
  display: flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 13px;

  svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  &[data-tone='gold'] {
    border-color: rgba(255, 200, 87, 0.2);
    background: rgba(255, 200, 87, 0.1);
    color: #ffc857;
  }

  &[data-tone='violet'] {
    border-color: rgba(186, 134, 255, 0.2);
    background: rgba(186, 134, 255, 0.1);
    color: #c59aff;
  }

  &[data-tone='mint'] {
    border-color: rgba(93, 217, 173, 0.2);
    background: rgba(93, 217, 173, 0.1);
    color: #67ddb4;
  }
`

export const SectionCopy = styled.div`
  min-width: 0;
`

export const SectionTitle = styled.h3`
  margin: 0;
  color: #f1f3f7;
  font-size: 15px;
  font-weight: 750;
  letter-spacing: -0.02em;
`

export const SectionDescription = styled.p`
  margin: 3px 0 0;
  overflow: hidden;
  color: #858e9e;
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const DamageFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
`

export const Field = styled.div`
  min-width: 0;
`

export const FieldHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
`

export const FieldLabel = styled.label`
  color: #aeb5c1;
  font-size: 12px;
  font-weight: 650;
`

export const FieldBadge = styled.span`
  color: #667081;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
`

export const NumberInput = styled(OriginalInput)`
  width: 100%;
  height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 13px;
  background: rgba(10, 13, 19, 0.62);
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.18);
  color: #f6f8fb;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;

  &::placeholder {
    color: #5e6673;
  }

  &:hover,
  &:focus,
  &:focus-within {
    border-color: rgba(255, 200, 87, 0.58);
    background: rgba(10, 13, 19, 0.78);
  }

  &:focus,
  &:focus-within {
    box-shadow: 0 0 0 3px rgba(255, 200, 87, 0.1);
  }

  @media screen and (max-width: 390px) {
    padding-inline: 10px;
    font-size: 14px;
  }
`

export const Stepper = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 8px;
  margin-top: 18px;
`

export const StepButton = styled.button`
  display: flex;
  width: 44px;
  height: 46px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.055);
  color: #d7dce5;
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    color 150ms ease,
    transform 150ms ease;

  &:hover:not(:disabled) {
    border-color: rgba(255, 200, 87, 0.35);
    background: rgba(255, 200, 87, 0.1);
    color: #ffc857;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 3px solid rgba(255, 200, 87, 0.26);
    outline-offset: 2px;
  }

  &:disabled {
    color: #535b68;
    cursor: not-allowed;
    opacity: 0.65;
  }
`

export const StepValue = styled.div`
  position: relative;
  min-width: 0;
`

export const StepInput = styled(OriginalInput)`
  width: 100%;
  height: 46px;
  padding-right: 30px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 13px;
  background: rgba(10, 13, 19, 0.62);
  color: #f7f8fb;
  font-size: 18px;
  font-weight: 750;
  text-align: center;

  &:hover,
  &:focus,
  &:focus-within {
    border-color: rgba(255, 200, 87, 0.58);
    background: rgba(10, 13, 19, 0.78);
  }

  &:focus,
  &:focus-within {
    box-shadow: 0 0 0 3px rgba(255, 200, 87, 0.1);
  }
`

export const Unit = styled.span`
  position: absolute;
  top: 50%;
  right: 13px;
  color: #737c8b;
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
  transform: translateY(-50%);
`

export const AutoSaveNotice = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 16px 0 0;
  color: #70798a;
  font-size: 11px;
`

export const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #66d9ac;
  box-shadow: 0 0 0 4px rgba(102, 217, 172, 0.08);
`
