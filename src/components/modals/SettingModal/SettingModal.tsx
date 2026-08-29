import { Button } from 'antd'
import GreenButton from 'components/GreenButton'
import Horizontal from 'components/Horizontal'
import MapleInput from 'components/MapleInput'
import useBoolean from 'hooks/useBoolean'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'
import React from 'react'
import { Setting } from 'type/setting'
import { numberWithCommas } from 'utils/number'
import * as S from './style'
import { SETTING_LIMITS } from 'constants/app_constants'

type Props = {
  setting: Setting
  setSetting: (newSetting: Setting) => void
}
const SettingModal: React.FC<Props> = ({ setting, setSetting }) => {
  const [open, { setTrue: onOpen, setFalse: onClose }] = useBoolean(false)
  const { dialogRef, triggerRef } = useAccessibleDialog(
    open,
    onClose,
    '#max-damage'
  )

  return (
    <>
      <GreenButton
        ref={triggerRef}
        style={{
          position: 'absolute',
          top: 20,
          right: 20
        }}
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        세팅
      </GreenButton>
      <S.BackBoard open={open} onClick={onClose} aria-hidden="true" />
      <S.Container
        ref={dialogRef}
        open={open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="setting-dialog-title"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <S.Header id="setting-dialog-title">SETTING</S.Header>
        <S.CloseButton size="small" onClick={onClose} aria-label="설정 닫기">
          <div className="ex left" />
          <div className="ex right" />
        </S.CloseButton>
        <S.ScrollArea>
          <S.Body>
            <S.TitleLabel>데미지 세팅</S.TitleLabel>
            <S.Content>
              <Horizontal gap={16}>
                <S.Label htmlFor="max-damage">최대 데미지</S.Label>
                <MapleInput
                  id="max-damage"
                  inputMode="numeric"
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
                      newValue = `${SETTING_LIMITS.MIN_DAMAGE}`
                    }
                    if (Number(newValue) <= (setting.minDamage || 0)) {
                      newMin = newValue
                    }
                    if (Number(newValue) >= SETTING_LIMITS.MAX_DAMAGE) {
                      newValue = `${SETTING_LIMITS.MAX_DAMAGE}`
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
                <S.Label htmlFor="min-damage">최소 데미지</S.Label>
                <MapleInput
                  id="min-damage"
                  inputMode="numeric"
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

                    if (Number(newValue) >= SETTING_LIMITS.MAX_DAMAGE) {
                      newValue = `${SETTING_LIMITS.MAX_DAMAGE}`
                    }
                    if (Number(newValue) === 0) {
                      newValue = `${SETTING_LIMITS.MIN_DAMAGE}`
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
                <S.Label htmlFor="critical-rate">크리티컬</S.Label>
                <Horizontal gap={8}>
                  <GreenButton
                    style={{ padding: '4px 8px' }}
                    disabled={
                      !setting.criticalRate || setting.criticalRate <= 0
                    }
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
                    id="critical-rate"
                    inputMode="numeric"
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
                      if (
                        Number(newValue) >= SETTING_LIMITS.MAX_CRITICAL_RATE
                      ) {
                        newValue = `${SETTING_LIMITS.MAX_CRITICAL_RATE}`
                      }
                      setSetting({
                        ...setting,
                        criticalRate:
                          newValue !== '' ? Number(newValue) : undefined
                      })
                    }}
                  />
                  <Button
                    style={{ padding: '4px 8px' }}
                    type="primary"
                    disabled={
                      setting.criticalRate === undefined ||
                      setting.criticalRate >= SETTING_LIMITS.MAX_CRITICAL_RATE
                    }
                    onClick={() => {
                      let newValue =
                        setting.criticalRate !== undefined
                          ? setting.criticalRate
                          : 0

                      if (newValue > 90) {
                        newValue = SETTING_LIMITS.MAX_CRITICAL_RATE
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
                  </Button>
                </Horizontal>
              </Horizontal>
            </S.Content>
          </S.Body>
          <S.Body style={{ marginTop: 8 }}>
            <S.TitleLabel>타수 세팅</S.TitleLabel>
            <S.Content>
              <Horizontal gap={16}>
                <S.Label htmlFor="attack-count">타수</S.Label>
                <Horizontal gap={8}>
                  <GreenButton
                    style={{ padding: '4px 8px' }}
                    disabled={
                      !setting.numberAttack || setting.numberAttack <= 1
                    }
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
                    id="attack-count"
                    inputMode="numeric"
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
                      if (
                        Number(newValue) >= SETTING_LIMITS.MAX_NUMBER_ATTACK
                      ) {
                        newValue = `${SETTING_LIMITS.MAX_NUMBER_ATTACK}`
                      }
                      if (Number(newValue) === 0) {
                        newValue = `${SETTING_LIMITS.MIN_NUMBER_ATTACK}`
                      }
                      setSetting({
                        ...setting,
                        numberAttack:
                          newValue !== '' ? Number(newValue) : undefined
                      })
                    }}
                  />
                  <Button
                    style={{ padding: '4px 8px' }}
                    type="primary"
                    disabled={
                      !setting.numberAttack ||
                      setting.numberAttack >= SETTING_LIMITS.MAX_NUMBER_ATTACK
                    }
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
                  </Button>
                </Horizontal>
              </Horizontal>
            </S.Content>
          </S.Body>
        </S.ScrollArea>
      </S.Container>
    </>
  )
}

export default SettingModal
