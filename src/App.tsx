import React, { KeyboardEvent, useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import { useRecoilState } from 'recoil'
import { v4 as uuid } from 'uuid'
// 이미지 임포트
import SettingModal from 'components/modals/SettingModal'
import { SkinSelectModal } from 'components/modals/SkinSelectModal'
import {
  ATTACK_ANIMATION_DURATION,
  DEFAULT_SETTINGS,
  DEFAULT_SKIN_NUMBER,
  GA_EVENTS,
  REGION
} from 'constants/app_constants'
import { useImageLoader } from 'hooks/useImageLoader'
import hitImage from 'images/hit1_0.png'
import standImage from 'images/stand.gif'
import { useCallback } from 'react'
import { getRandomInt } from 'utils/number'
import { useGetWzVersion } from './api/damage-skin'
import * as S from './appStyle'
import { wzVersionState } from './atoms/wzVersion'
import DamageWrapper from './components/DamageWrapper'
import { DamageWrapperType, ItemDto } from './type/damage-skin'
import { Setting } from './type/setting'

const LOCAL_STORAGE_KEY = 'damageSkinState'

export interface AppState {
  skinNumber: number
  damageWrapperList: DamageWrapperType[]
  isAttacked: boolean
  currentSkin?: ItemDto
  setting: Setting
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      return {
        skinNumber: parsedSettings.skinNumber || DEFAULT_SKIN_NUMBER,
        damageWrapperList: [],
        isAttacked: false,
        currentSkin: parsedSettings.currentSkin,
        setting: {
          numberAttack:
            parsedSettings.setting.numberAttack ||
            DEFAULT_SETTINGS.NUMBER_ATTACK,
          maxDamage:
            parsedSettings.setting.maxDamage || DEFAULT_SETTINGS.MAX_DAMAGE,
          minDamage:
            parsedSettings.setting.minDamage || DEFAULT_SETTINGS.MIN_DAMAGE,
          criticalRate:
            parsedSettings.setting.criticalRate ||
            DEFAULT_SETTINGS.CRITICAL_RATE
        }
      }
    }
    return {
      skinNumber: DEFAULT_SKIN_NUMBER,
      damageWrapperList: [],
      isAttacked: false,
      currentSkin: undefined,
      setting: {
        numberAttack: DEFAULT_SETTINGS.NUMBER_ATTACK,
        maxDamage: DEFAULT_SETTINGS.MAX_DAMAGE,
        minDamage: DEFAULT_SETTINGS.MIN_DAMAGE,
        criticalRate: DEFAULT_SETTINGS.CRITICAL_RATE
      }
    }
  })

  const { criticalHeight, normalHeight } = useImageLoader(state.skinNumber)

  const [_, setWzVersion] = useRecoilState(wzVersionState)

  const { data: wzVersionData } = useGetWzVersion()

  useEffect(() => {
    if (wzVersionData) {
      const version = wzVersionData
        .filter((item) => item.region === "KMST")
        .at(-1)?.mapleVersionId

      console.log(`current version: KMST`, version)

      if (version !== undefined) {
        setWzVersion({ version: Number(version), region: "KMST" })
      }
    }
  }, [wzVersionData])

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        skinNumber: state.skinNumber,
        currentSkin: state.currentSkin,
        setting: state.setting
      })
    )
  }, [state.skinNumber, state.currentSkin, state.setting])

  const onSetSkinNumber = (newId: number) => {
    setState((prevState) => ({
      ...prevState,
      skinNumber: newId,
      damageWrapperList: []
    }))
  }

  const handleAttack = () => {
    ReactGA.event(GA_EVENTS.ATTACK_MUSHROOM)

    // 데미지 목록 생성
    const newDamageList = Array.from(
      { length: state.setting.numberAttack || 0 },
      (_, index) => {
        const isCritical =
          Math.random() * 100 < (state.setting.criticalRate || 0)
        return {
          id: uuid(),
          skinNumber: state.skinNumber,
          level: index,
          damage: getRandomInt({
            min: state.setting.minDamage || 0,
            max: state.setting.maxDamage || 0
          }),
          isCritical
        }
      }
    )

    // marginBottom 값 계산
    let totalHeight = 0
    const damageListWithMargin = newDamageList.map((damage) => {
      const currentMargin = totalHeight
      totalHeight += damage.isCritical ? criticalHeight : normalHeight
      return { ...damage, marginBottom: currentMargin }
    })

    // 상태 업데이트
    setState((prevState) => ({
      ...prevState,
      isAttacked: true,
      damageWrapperList: [
        ...prevState.damageWrapperList,
        { id: uuid(), damageList: damageListWithMargin }
      ]
    }))
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleAttack()
    }
  }

  useEffect(() => {
    if (state.isAttacked) {
      const timer = setTimeout(() => {
        setState((prevState) => ({ ...prevState, isAttacked: false }))
      }, ATTACK_ANIMATION_DURATION)

      // 정리 함수 반환
      return () => {
        clearTimeout(timer)
      }
    }
  }, [state.isAttacked])

  const initReactGA = () => {
    ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID || '')
  }

  useEffect(() => {
    initReactGA()
  }, [])

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      criticalHeight,
      normalHeight
    }))
  }, [criticalHeight, normalHeight])

  const preloadDamageSkinImages = useCallback(() => {
    const imageUrls = [
      ...Array(10)
        .fill(0)
        .flatMap((_, index) => [
          `./images/export/Effect-DamageSkin.img-${state.skinNumber}-NoCri1-${index}.png`,
          `./images/export/Effect-DamageSkin.img-${state.skinNumber}-NoCri0-${index}.png`,
          `./images/export/Effect-DamageSkin.img-${state.skinNumber}-NoRed1-${index}.png`,
          `./images/export/Effect-DamageSkin.img-${state.skinNumber}-NoRed0-${index}.png`
        ]),
      `./images/export/Effect-DamageSkin.img-${state.skinNumber}-NoCri1-effect3.png`,
      `./images/export/Effect-DamageSkin.img-${state.skinNumber}-NoCustom-NoCri0-3.png`,
      `./images/export/Effect-DamageSkin.img-${state.skinNumber}-NoCustom-NoCri0-4.png`,
      `./images/export/Effect-DamageSkin.img-${state.skinNumber}-NoCustom-NoRed0-3.png`,
      `./images/export/Effect-DamageSkin.img-${state.skinNumber}-NoCustom-NoRed0-4.png`
    ]

    const img = new Image()
    let index = 0

    const loadNextImage = () => {
      if (index < imageUrls.length) {
        img.onload = img.onerror = loadNextImage
        img.src = imageUrls[index++]
      }
    }

    loadNextImage()
  }, [state.skinNumber])

  useEffect(() => {
    preloadDamageSkinImages()
  }, [preloadDamageSkinImages])

  return (
    <>
      <SettingModal
        setting={state.setting}
        setSetting={(newSetting: Setting) =>
          setState((prevState) => ({ ...prevState, setting: newSetting }))
        }
      />
      <SkinSelectModal
        currentSkin={state.currentSkin}
        setCurrentSkin={(skin?: ItemDto) =>
          setState((prevState) => ({ ...prevState, currentSkin: skin }))
        }
        onConfirm={(newId: number) => onSetSkinNumber(newId)}
      />
      <S.Body className="no-drag">
        <div style={{ height: '30%' }} />
        {state.damageWrapperList.map((item) => (
          <DamageWrapper
            key={item.id}
            damageWrapper={item}
            setState={setState}
            currentSkin={state.currentSkin}
          />
        ))}
        <S.OrangeMushroom
          draggable="false"
          src={state.isAttacked ? hitImage : standImage}
          alt="주황 버섯 공격하기"
          onClick={handleAttack}
          onKeyPress={handleKeyPress}
          tabIndex={0}
          role="button"
          aria-label="주황 버섯 공격하기"
        />
      </S.Body>
    </>
  )
}

export default App
