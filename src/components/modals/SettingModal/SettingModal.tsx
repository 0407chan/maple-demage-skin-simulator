import { SETTING_LIMITS } from 'constants/app_constants'
import useBoolean from 'hooks/useBoolean'
import { useAccessibleDialog } from 'hooks/useAccessibleDialog'
import { LocalePreference, localeOptions, useI18n } from 'i18n'
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
  const { localePreference, setLocalePreference, t } = useI18n()
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

  const updateMonsterInvincible = (monsterInvincible: boolean) => {
    setSetting({
      ...setting,
      monsterInvincible
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
        {t('settings.trigger')}
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
            <S.DialogTitle id="setting-dialog-title">
              {t('settings.title')}
            </S.DialogTitle>
            <S.Description id="setting-dialog-description">
              {t('settings.description')}
            </S.Description>
          </S.HeaderCopy>
          <S.CloseButton
            type="button"
            onClick={handleClose}
            aria-label={t('settings.close')}
          >
            <span aria-hidden="true" />
          </S.CloseButton>
        </S.Header>

        <S.ScrollArea>
          <S.LanguageCard>
            <S.SectionHeading>
              <S.SectionIcon data-tone="blue" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3.1a15.7 15.7 0 0 0-1.2-5A8 8 0 0 1 18.9 11ZM12 4c.9 1.1 1.6 3.5 1.8 7H10.2c.2-3.5.9-5.9 1.8-7ZM9.4 6a15.7 15.7 0 0 0-1.2 5H5.1A8 8 0 0 1 9.4 6ZM5.1 13h3.1a15.7 15.7 0 0 0 1.2 5 8 8 0 0 1-4.3-5Zm6.9 7c-.9-1.1-1.6-3.5-1.8-7h3.6c-.2 3.5-.9 5.9-1.8 7Zm2.6-2a15.7 15.7 0 0 0 1.2-5h3.1a8 8 0 0 1-4.3 5Z" />
                </svg>
              </S.SectionIcon>
              <S.SectionCopy>
                <S.SectionTitle>{t('settings.language')}</S.SectionTitle>
                <S.SectionDescription>
                  {t('settings.languageDescription')}
                </S.SectionDescription>
              </S.SectionCopy>
            </S.SectionHeading>
            <S.LanguageSelect
              value={localePreference}
              aria-label={t('settings.languageLabel')}
              onChange={(event) =>
                setLocalePreference(event.target.value as LocalePreference)
              }
            >
              <option value="auto">{t('settings.languageAuto')}</option>
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </S.LanguageSelect>
          </S.LanguageCard>

          <S.DamageCard>
            <S.SectionHeading>
              <S.SectionIcon data-tone="gold" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m13.7 2-8 11.1h5.1L9.9 22l8.4-12.1h-5.2L13.7 2Z" />
                </svg>
              </S.SectionIcon>
              <S.SectionCopy>
                <S.SectionTitle>{t('settings.damageRange')}</S.SectionTitle>
                <S.SectionDescription>
                  {t('settings.damageRangeDescription')}
                </S.SectionDescription>
              </S.SectionCopy>
            </S.SectionHeading>

            <S.DamageFields>
              <S.Field>
                <S.FieldHeader>
                  <S.FieldLabel htmlFor="min-damage">
                    {t('settings.minDamage')}
                  </S.FieldLabel>
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
                  <S.FieldLabel htmlFor="max-damage">
                    {t('settings.maxDamage')}
                  </S.FieldLabel>
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
                  <S.SectionTitle>{t('settings.critical')}</S.SectionTitle>
                  <S.SectionDescription>
                    {t('settings.criticalDescription')}
                  </S.SectionDescription>
                </S.SectionCopy>
              </S.SectionHeading>

              <S.Stepper>
                <S.StepButton
                  type="button"
                  aria-label={t('settings.criticalDecrease')}
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
                    aria-label={t('settings.criticalRate')}
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
                  aria-label={t('settings.criticalIncrease')}
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
                  <S.SectionTitle>{t('settings.hitCount')}</S.SectionTitle>
                  <S.SectionDescription>
                    {t('settings.hitCountDescription')}
                  </S.SectionDescription>
                </S.SectionCopy>
              </S.SectionHeading>

              <S.Stepper>
                <S.StepButton
                  type="button"
                  aria-label={t('settings.hitCountDecrease')}
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
                    aria-label={t('settings.hitCountLabel')}
                    inputMode="numeric"
                    maxLength={2}
                    value={
                      setting.numberAttack !== undefined
                        ? numberWithCommas(setting.numberAttack)
                        : ''
                    }
                    onChange={(event) => updateAttackCount(event.target.value)}
                  />
                  <S.Unit aria-hidden="true">
                    {t('settings.hitCountUnit')}
                  </S.Unit>
                </S.StepValue>
                <S.StepButton
                  type="button"
                  aria-label={t('settings.hitCountIncrease')}
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

          <S.InvincibleCard htmlFor="monster-invincible">
            <S.SectionHeading>
              <S.SectionIcon data-tone="blue" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.5 20 6v5.3c0 4.8-3.1 8.8-8 10.2-4.9-1.4-8-5.4-8-10.2V6l8-3.5Zm0 4.1-4.5 2v2.7c0 2.8 1.6 5.2 4.5 6.4 2.9-1.2 4.5-3.6 4.5-6.4V8.6l-4.5-2Z" />
                </svg>
              </S.SectionIcon>
              <S.SectionCopy>
                <S.SectionTitle>{t('settings.invincible')}</S.SectionTitle>
                <S.SectionDescription>
                  {t('settings.invincibleDescription')}
                </S.SectionDescription>
              </S.SectionCopy>
            </S.SectionHeading>

            <S.ToggleControl>
              <S.ToggleInput
                id="monster-invincible"
                type="checkbox"
                checked={setting.monsterInvincible !== false}
                onChange={(event) =>
                  updateMonsterInvincible(event.target.checked)
                }
              />
              <S.ToggleTrack aria-hidden="true">
                <S.ToggleThumb />
              </S.ToggleTrack>
              <S.ToggleState aria-hidden="true">
                {setting.monsterInvincible !== false ? 'ON' : 'OFF'}
              </S.ToggleState>
            </S.ToggleControl>
          </S.InvincibleCard>

          <S.AutoSaveNotice>
            <S.StatusDot aria-hidden="true" />
            {t('settings.autoSave')}
          </S.AutoSaveNotice>
        </S.ScrollArea>
      </S.Container>
    </>
  )
}

export default SettingModal
