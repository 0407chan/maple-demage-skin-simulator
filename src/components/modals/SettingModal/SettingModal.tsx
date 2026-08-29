import { SETTING_LIMITS } from 'constants/app_constants'
import useBoolean from 'hooks/useBoolean'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'
import React, { useCallback, useEffect, useRef } from 'react'
import { Setting } from 'type/setting'
import { trackDamageSettingChanged } from 'utils/analytics'
import { numberWithCommas } from 'utils/number'
import * as S from './style'

type Props = {
  setting: Setting
  setSetting: (newSetting: Setting) => void
}

const digitsOnly = (value: string) =>
  value.replace(/[^0-9]/g, '').replaceAll(',', '')

const SettingModal: React.FC<Props> = ({ setting, setSetting }) => {
  const [open, { setTrue: openDialog, setFalse: closeDialog }] =
    useBoolean(false)
  const initialSettingRef = useRef<Setting | undefined>(undefined)
  const currentSettingRef = useRef(setting)

  useEffect(() => {
    currentSettingRef.current = setting
  }, [setting])

  const handleOpen = useCallback(() => {
    initialSettingRef.current = { ...currentSettingRef.current }
    openDialog()
  }, [openDialog])

  const handleClose = useCallback(() => {
    if (initialSettingRef.current) {
      trackDamageSettingChanged(
        initialSettingRef.current,
        currentSettingRef.current
      )
    }
    initialSettingRef.current = undefined
    closeDialog()
  }, [closeDialog])

  const { dialogRef, triggerRef } = useAccessibleDialog(
    open,
    handleClose,
    '#max-damage'
  )

  const updateMaxDamage = (value: string) => {
    let newValue = digitsOnly(value)
    let newMin = `${setting.minDamage ?? SETTING_LIMITS.MIN_DAMAGE}`

    if (Number(newValue) === 0) {
      newValue = `${SETTING_LIMITS.MIN_DAMAGE}`
    }
    if (Number(newValue) <= (setting.minDamage ?? 0)) {
      newMin = newValue
    }
    if (Number(newValue) >= SETTING_LIMITS.MAX_DAMAGE) {
      newValue = `${SETTING_LIMITS.MAX_DAMAGE}`
    }

    setSetting({
      ...setting,
      maxDamage: Number(newValue),
      minDamage: Number(newMin)
    })
  }

  const updateMinDamage = (value: string) => {
    let newValue = digitsOnly(value)
    let newMax = `${setting.maxDamage ?? SETTING_LIMITS.MIN_DAMAGE}`

    if (Number(newValue) >= SETTING_LIMITS.MAX_DAMAGE) {
      newValue = `${SETTING_LIMITS.MAX_DAMAGE}`
    }
    if (Number(newValue) === 0) {
      newValue = `${SETTING_LIMITS.MIN_DAMAGE}`
    }
    if (Number(newValue) >= (setting.maxDamage ?? 0)) {
      newMax = newValue
    }

    setSetting({
      ...setting,
      minDamage: Number(newValue),
      maxDamage: Number(newMax)
    })
  }

  const updateCriticalRate = (value: string) => {
    let newValue = digitsOnly(value)
    if (Number(newValue) >= SETTING_LIMITS.MAX_CRITICAL_RATE) {
      newValue = `${SETTING_LIMITS.MAX_CRITICAL_RATE}`
    }

    setSetting({
      ...setting,
      criticalRate: newValue !== '' ? Number(newValue) : undefined
    })
  }

  const updateAttackCount = (value: string) => {
    let newValue = digitsOnly(value)
    if (Number(newValue) >= SETTING_LIMITS.MAX_NUMBER_ATTACK) {
      newValue = `${SETTING_LIMITS.MAX_NUMBER_ATTACK}`
    }
    if (Number(newValue) === 0) {
      newValue = `${SETTING_LIMITS.MIN_NUMBER_ATTACK}`
    }

    setSetting({
      ...setting,
      numberAttack: Number(newValue)
    })
  }

  const decreaseCriticalRate = () => {
    const currentValue = setting.criticalRate ?? 0
    setSetting({
      ...setting,
      criticalRate: Math.max(
        SETTING_LIMITS.MIN_CRITICAL_RATE,
        currentValue - 10
      )
    })
  }

  const increaseCriticalRate = () => {
    const currentValue = setting.criticalRate ?? 0
    setSetting({
      ...setting,
      criticalRate: Math.min(
        SETTING_LIMITS.MAX_CRITICAL_RATE,
        currentValue + 10
      )
    })
  }

  const decreaseAttackCount = () => {
    setSetting({
      ...setting,
      numberAttack: Math.max(
        SETTING_LIMITS.MIN_NUMBER_ATTACK,
        (setting.numberAttack ?? SETTING_LIMITS.MIN_NUMBER_ATTACK) - 1
      )
    })
  }

  const increaseAttackCount = () => {
    setSetting({
      ...setting,
      numberAttack: Math.min(
        SETTING_LIMITS.MAX_NUMBER_ATTACK,
        (setting.numberAttack ?? SETTING_LIMITS.MIN_NUMBER_ATTACK) + 1
      )
    })
  }

  return (
    <>
      <S.TriggerButton
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <S.TriggerIcon aria-hidden="true">
          <span />
          <span />
          <span />
        </S.TriggerIcon>
        세팅
      </S.TriggerButton>

      <S.BackBoard $open={open} onClick={handleClose} aria-hidden="true" />
      <S.Container
        ref={dialogRef}
        $open={open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="setting-dialog-title"
        aria-describedby="setting-dialog-description"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <S.SheetHandle aria-hidden="true" />
        <S.Header>
          <S.HeaderCopy>
            <S.Eyebrow>DAMAGE LAB</S.Eyebrow>
            <S.DialogTitle id="setting-dialog-title">데미지 설정</S.DialogTitle>
            <S.Description id="setting-dialog-description">
              전투 수치를 조정하고 결과를 바로 확인해 보세요.
            </S.Description>
          </S.HeaderCopy>
          <S.CloseButton
            type="button"
            onClick={handleClose}
            aria-label="설정 닫기"
          >
            <span aria-hidden="true" />
          </S.CloseButton>
        </S.Header>

        <S.ScrollArea>
          <S.DamageCard>
            <S.SectionHeading>
              <S.SectionIcon data-tone="gold" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m13.7 2-8 11.1h5.1L9.9 22l8.4-12.1h-5.2L13.7 2Z" />
                </svg>
              </S.SectionIcon>
              <S.SectionCopy>
                <S.SectionTitle>데미지 범위</S.SectionTitle>
                <S.SectionDescription>
                  공격 한 번에 표시될 최소·최대 수치
                </S.SectionDescription>
              </S.SectionCopy>
            </S.SectionHeading>

            <S.DamageFields>
              <S.Field>
                <S.FieldHeader>
                  <S.FieldLabel htmlFor="min-damage">최소 데미지</S.FieldLabel>
                  <S.FieldBadge>MIN</S.FieldBadge>
                </S.FieldHeader>
                <S.NumberInput
                  id="min-damage"
                  inputMode="numeric"
                  maxLength={16}
                  placeholder="100,000"
                  value={
                    setting.minDamage !== undefined
                      ? numberWithCommas(setting.minDamage)
                      : ''
                  }
                  onChange={(event) => updateMinDamage(event.target.value)}
                />
              </S.Field>

              <S.Field>
                <S.FieldHeader>
                  <S.FieldLabel htmlFor="max-damage">최대 데미지</S.FieldLabel>
                  <S.FieldBadge>MAX</S.FieldBadge>
                </S.FieldHeader>
                <S.NumberInput
                  id="max-damage"
                  inputMode="numeric"
                  maxLength={16}
                  placeholder="1,000,000"
                  value={
                    setting.maxDamage !== undefined
                      ? numberWithCommas(setting.maxDamage)
                      : ''
                  }
                  onChange={(event) => updateMaxDamage(event.target.value)}
                />
              </S.Field>
            </S.DamageFields>
          </S.DamageCard>

          <S.ControlGrid>
            <S.ControlCard>
              <S.SectionHeading>
                <S.SectionIcon data-tone="violet" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Zm7 13 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
                  </svg>
                </S.SectionIcon>
                <S.SectionCopy>
                  <S.SectionTitle>크리티컬</S.SectionTitle>
                  <S.SectionDescription>
                    치명타가 발생할 확률
                  </S.SectionDescription>
                </S.SectionCopy>
              </S.SectionHeading>

              <S.Stepper>
                <S.StepButton
                  type="button"
                  aria-label="크리티컬 확률 10% 감소"
                  disabled={
                    setting.criticalRate === undefined ||
                    setting.criticalRate <= SETTING_LIMITS.MIN_CRITICAL_RATE
                  }
                  onClick={decreaseCriticalRate}
                >
                  −
                </S.StepButton>
                <S.StepValue>
                  <S.StepInput
                    id="critical-rate"
                    aria-label="크리티컬 확률"
                    inputMode="numeric"
                    maxLength={3}
                    value={
                      setting.criticalRate !== undefined
                        ? numberWithCommas(setting.criticalRate)
                        : ''
                    }
                    onChange={(event) => updateCriticalRate(event.target.value)}
                  />
                  <S.Unit aria-hidden="true">%</S.Unit>
                </S.StepValue>
                <S.StepButton
                  type="button"
                  aria-label="크리티컬 확률 10% 증가"
                  disabled={
                    setting.criticalRate === undefined ||
                    setting.criticalRate >= SETTING_LIMITS.MAX_CRITICAL_RATE
                  }
                  onClick={increaseCriticalRate}
                >
                  +
                </S.StepButton>
              </S.Stepper>
            </S.ControlCard>

            <S.ControlCard>
              <S.SectionHeading>
                <S.SectionIcon data-tone="mint" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 5h14v3H5V5Zm2 5h12v3H7v-3Zm2 5h10v3H9v-3Z" />
                  </svg>
                </S.SectionIcon>
                <S.SectionCopy>
                  <S.SectionTitle>공격 타수</S.SectionTitle>
                  <S.SectionDescription>
                    한 번에 표시할 데미지 수
                  </S.SectionDescription>
                </S.SectionCopy>
              </S.SectionHeading>

              <S.Stepper>
                <S.StepButton
                  type="button"
                  aria-label="공격 타수 1 감소"
                  disabled={
                    setting.numberAttack === undefined ||
                    setting.numberAttack <= SETTING_LIMITS.MIN_NUMBER_ATTACK
                  }
                  onClick={decreaseAttackCount}
                >
                  −
                </S.StepButton>
                <S.StepValue>
                  <S.StepInput
                    id="attack-count"
                    aria-label="공격 타수"
                    inputMode="numeric"
                    maxLength={2}
                    value={
                      setting.numberAttack !== undefined
                        ? numberWithCommas(setting.numberAttack)
                        : ''
                    }
                    onChange={(event) => updateAttackCount(event.target.value)}
                  />
                  <S.Unit aria-hidden="true">회</S.Unit>
                </S.StepValue>
                <S.StepButton
                  type="button"
                  aria-label="공격 타수 1 증가"
                  disabled={
                    setting.numberAttack === undefined ||
                    setting.numberAttack >= SETTING_LIMITS.MAX_NUMBER_ATTACK
                  }
                  onClick={increaseAttackCount}
                >
                  +
                </S.StepButton>
              </S.Stepper>
            </S.ControlCard>
          </S.ControlGrid>

          <S.AutoSaveNotice>
            <S.StatusDot aria-hidden="true" />
            변경한 설정은 자동으로 저장됩니다.
          </S.AutoSaveNotice>
        </S.ScrollArea>
      </S.Container>
    </>
  )
}

export default SettingModal
