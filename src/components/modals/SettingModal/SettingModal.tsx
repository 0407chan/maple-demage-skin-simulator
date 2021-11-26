import Horizontal from '@/components/Horizontal'
import MapleInput from '@/components/MapleInput'
import useWindowSize from '@/hooks/useWindowSize'
import { Setting } from '@/type/setting'
import { numberWithCommas } from '@/utils/number'
import React from 'react'
import * as S from './style'

const MAX_DAMAGE = 150000000000
const MIN_DAMAGE = 1
const MAX_CRITICAL = 100
type Props = {
  isOpen: boolean
  setting: Setting
  setSetting: React.Dispatch<React.SetStateAction<Setting>>
  onCancel: () => void
}
const SettingModal: React.FC<Props> = ({
  isOpen,
  onCancel,
  setting,
  setSetting
}) => {
  const { isMobile } = useWindowSize()
  const onCloseModal = () => {
    onCancel()
  }
  return (
    <>
      {isMobile() && <S.BackBoard isOpen={isOpen} onClick={onCloseModal} />}
      <S.Container isOpen={isOpen}>
        <S.Header>SETTING</S.Header>
        <S.CloseButton size="small" onClick={onCloseModal}>
          <div className="ex left" />
          <div className="ex right" />
        </S.CloseButton>
        <S.Body>
          <S.TitleLabel>데미지 세팅</S.TitleLabel>
          <S.Content>
            <Horizontal gap={16}>
              <S.Label>최대 데미지</S.Label>
              <MapleInput
                maxLength={16}
                style={{ width: '100%' }}
                placeholder="최대 데미지를 입력하세요."
                value={
                  setting.maxDamage !== undefined
                    ? numberWithCommas(setting.maxDamage)
                    : ''
                }
                onChange={(event) => {
                  let newValue = event.target.value
                    .replace(/[^0-9]/g, '')
                    .replaceAll(',', '')
                  let newMin = `${setting.minDamage || 0}`
                  if (Number(newValue) === 0) {
                    newValue = `${MIN_DAMAGE}`
                  }
                  if (Number(newValue) <= (setting.minDamage || 0)) {
                    newMin = newValue
                  }
                  if (Number(newValue) >= MAX_DAMAGE) {
                    newValue = `${MAX_DAMAGE}`
                  }
                  setSetting({
                    ...setting,
                    maxDamage: newValue !== '' ? Number(newValue) : undefined,
                    minDamage: Number(newMin)
                  })
                }}
              />
            </Horizontal>
            <Horizontal gap={16}>
              <S.Label>최소 데미지</S.Label>
              <MapleInput
                maxLength={16}
                placeholder="최소 데미지를 입력하세요."
                style={{ width: '100%' }}
                value={
                  setting.minDamage !== undefined
                    ? numberWithCommas(setting.minDamage)
                    : ''
                }
                onChange={(event) => {
                  let newValue = event.target.value
                    .replace(/[^0-9]/g, '')
                    .replaceAll(',', '')
                  let newMax = `${setting.maxDamage || 0}`

                  if (Number(newValue) >= MAX_DAMAGE) {
                    newValue = `${MAX_DAMAGE}`
                  }
                  if (Number(newValue) === 0) {
                    newValue = `${MIN_DAMAGE}`
                  }
                  if (Number(newValue) >= (setting.maxDamage || 0)) {
                    newMax = newValue
                  }
                  setSetting({
                    ...setting,
                    minDamage: newValue !== '' ? Number(newValue) : undefined,
                    maxDamage: Number(newMax)
                  })
                }}
              />
            </Horizontal>
          </S.Content>
        </S.Body>
        <S.Body style={{ marginTop: 8 }}>
          <S.TitleLabel>크리티컬 세팅</S.TitleLabel>
          <S.Content>
            <Horizontal gap={16}>
              <S.Label>크리티컬</S.Label>
              <MapleInput
                maxLength={4}
                style={{ width: '100%' }}
                placeholder="크리티컬 확률을 입력하세요."
                value={
                  setting.criticalRate !== undefined
                    ? numberWithCommas(setting.criticalRate)
                    : ''
                }
                onChange={(event) => {
                  let newValue = event.target.value
                    .replace(/[^0-9]/g, '')
                    .replaceAll(',', '')
                  if (Number(newValue) >= MAX_CRITICAL) {
                    newValue = `${MAX_CRITICAL}`
                  }
                  setSetting({
                    ...setting,
                    criticalRate: newValue !== '' ? Number(newValue) : undefined
                  })
                }}
              />
            </Horizontal>
          </S.Content>
        </S.Body>
      </S.Container>
    </>
  )
}

export default SettingModal
