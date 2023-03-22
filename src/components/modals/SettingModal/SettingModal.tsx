import GreenButton from 'components/GreenButton'
import Horizontal from 'components/Horizontal'
import MapleButton from 'components/MapleButton'
import MapleInput from 'components/MapleInput'
import useWindowSize from 'hooks/useWindowSize'
import React from 'react'
import { Setting } from 'type/setting'
import { numberWithCommas } from 'utils/number'
import * as S from './style'

const MAX_DAMAGE = 150000000000
const MIN_DAMAGE = 1
const MAX_CRITICAL = 100
const MAX_NUMBER_ATTACK = 10
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
              <Horizontal gap={8}>
                <GreenButton
                  style={{ padding: '4px 8px' }}
                  disabled={!setting.criticalRate || setting.criticalRate <= 0}
                  onClick={() => {
                    let newValue =
                      setting.criticalRate !== undefined
                        ? setting.criticalRate
                        : 0

                    if (newValue < 10) {
                      newValue = 0
                    } else {
                      newValue = newValue - 10
                    }
                    setSetting({
                      ...setting,
                      criticalRate: newValue
                    })
                  }}
                >
                  -10
                </GreenButton>
                <MapleInput
                  maxLength={4}
                  style={{ width: '100%', textAlign: 'center' }}
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
                      criticalRate:
                        newValue !== '' ? Number(newValue) : undefined
                    })
                  }}
                />
                <MapleButton
                  style={{ padding: '4px 8px' }}
                  disabled={
                    setting.criticalRate === undefined ||
                    setting.criticalRate >= 100
                  }
                  onClick={() => {
                    let newValue =
                      setting.criticalRate !== undefined
                        ? setting.criticalRate
                        : 0

                    if (newValue > 90) {
                      newValue = 100
                    } else {
                      newValue = newValue + 10
                    }
                    setSetting({
                      ...setting,
                      criticalRate: newValue
                    })
                  }}
                >
                  +10
                </MapleButton>
              </Horizontal>
            </Horizontal>
          </S.Content>
        </S.Body>
        <S.Body style={{ marginTop: 8 }}>
          <S.TitleLabel>타수 세팅</S.TitleLabel>
          <S.Content>
            <Horizontal gap={16}>
              <S.Label>타수</S.Label>
              <Horizontal gap={8}>
                <GreenButton
                  style={{ padding: '4px 8px' }}
                  disabled={!setting.numberAttack || setting.numberAttack <= 1}
                  onClick={() =>
                    setSetting({
                      ...setting,
                      numberAttack:
                        setting.numberAttack !== undefined
                          ? setting.numberAttack - 1
                          : setting.numberAttack
                    })
                  }
                >
                  -1
                </GreenButton>
                <MapleInput
                  maxLength={3}
                  style={{ width: '100%', textAlign: 'center' }}
                  placeholder="타수를 입력하세요."
                  value={
                    setting.numberAttack !== undefined
                      ? numberWithCommas(setting.numberAttack)
                      : ''
                  }
                  onChange={(event) => {
                    let newValue = event.target.value
                      .replace(/[^0-9]/g, '')
                      .replaceAll(',', '')
                    if (Number(newValue) >= MAX_NUMBER_ATTACK) {
                      newValue = `${MAX_NUMBER_ATTACK}`
                    }
                    if (Number(newValue) === 0) {
                      newValue = `${MIN_DAMAGE}`
                    }
                    setSetting({
                      ...setting,
                      numberAttack:
                        newValue !== '' ? Number(newValue) : undefined
                    })
                  }}
                />
                <MapleButton
                  style={{ padding: '4px 8px' }}
                  disabled={!setting.numberAttack || setting.numberAttack >= 10}
                  onClick={() =>
                    setSetting({
                      ...setting,
                      numberAttack:
                        setting.numberAttack !== undefined
                          ? setting.numberAttack + 1
                          : setting.numberAttack
                    })
                  }
                >
                  +1
                </MapleButton>
              </Horizontal>
            </Horizontal>
          </S.Content>
        </S.Body>
      </S.Container>
    </>
  )
}

export default SettingModal
