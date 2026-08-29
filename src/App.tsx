import React, { useEffect, useRef, useState } from 'react'
import ReactGA from 'react-ga4'
import { v4 as uuid } from 'uuid'
// 이미지 임포트
import {
  getMonsterAnimationUrl,
  getMonsterIconUrl,
  useGetMonsterDetail
} from 'api/monster'
import { wzVersionState } from 'atoms/wzVersion'
import { MonsterSelectModal } from 'components/modals/MonsterSelectModal'
import SettingModal from 'components/modals/SettingModal'
import { SkinSelectModal } from 'components/modals/SkinSelectModal'
import {
  ATTACK_ANIMATION_DURATION,
  DEFAULT_MONSTER,
  DEFAULT_SETTINGS,
  DEFAULT_SKIN_NUMBER,
  GA_EVENTS,
  SETTING_LIMITS
} from 'constants/app_constants'
import { useImageLoader } from 'hooks/useImageLoader'
import hitImage from 'images/hit1_0.png'
import standImage from 'images/stand.gif'
import { useRecoilValue } from 'recoil'
import { getDamageAnchorTop, getDamageSpawnBottom } from 'utils/damageSpawn'
import { getPrimaryMonsterAnimation } from 'utils/monsterAnimation'
import { getRandomInt } from 'utils/number'
import DamageWrapper from './components/DamageWrapper'
import { DamageWrapperType, ItemDto } from './type/damage-skin'
import { Monster } from './type/monster'
import { Setting } from './type/setting'
import styles from './App.module.scss'
import clsx from 'clsx'

const LOCAL_STORAGE_KEY = 'damageSkinState'

export interface AppState {
  skinNumber: number
  damageWrapperList: DamageWrapperType[]
  isAttacked: boolean
  currentSkin?: ItemDto
  currentMonster: Monster
  setting: Setting
}

const createDefaultState = (): AppState => ({
  skinNumber: DEFAULT_SKIN_NUMBER,
  damageWrapperList: [],
  isAttacked: false,
  currentSkin: undefined,
  currentMonster: DEFAULT_MONSTER,
  setting: {
    numberAttack: DEFAULT_SETTINGS.NUMBER_ATTACK,
    maxDamage: DEFAULT_SETTINGS.MAX_DAMAGE,
    minDamage: DEFAULT_SETTINGS.MIN_DAMAGE,
    criticalRate: DEFAULT_SETTINGS.CRITICAL_RATE
  }
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getBoundedNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number
) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.trunc(value)))
}

const getStoredSkin = (value: unknown): ItemDto | undefined => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.name !== 'string'
  ) {
    return undefined
  }

  return value as ItemDto
}

const getStoredMonster = (value: unknown): Monster => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    !Number.isSafeInteger(value.id) ||
    typeof value.name !== 'string'
  ) {
    return DEFAULT_MONSTER
  }

  return {
    id: value.id,
    name: value.name,
    mobType: typeof value.mobType === 'string' ? value.mobType : '',
    level:
      typeof value.level === 'number' && Number.isFinite(value.level)
        ? Math.max(0, Math.trunc(value.level))
        : 0,
    isBoss: value.isBoss === true
  }
}

const loadInitialState = (): AppState => {
  const defaultState = createDefaultState()

  try {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!savedState) return defaultState

    const parsedState: unknown = JSON.parse(savedState)
    if (!isRecord(parsedState)) return defaultState

    const parsedSetting = isRecord(parsedState.setting)
      ? parsedState.setting
      : {}
    const maxDamage = getBoundedNumber(
      parsedSetting.maxDamage,
      DEFAULT_SETTINGS.MAX_DAMAGE,
      SETTING_LIMITS.MIN_DAMAGE,
      SETTING_LIMITS.MAX_DAMAGE
    )
    const minDamage = Math.min(
      maxDamage,
      getBoundedNumber(
        parsedSetting.minDamage,
        DEFAULT_SETTINGS.MIN_DAMAGE,
        SETTING_LIMITS.MIN_DAMAGE,
        SETTING_LIMITS.MAX_DAMAGE
      )
    )

    return {
      skinNumber: getBoundedNumber(
        parsedState.skinNumber,
        DEFAULT_SKIN_NUMBER,
        1,
        Number.MAX_SAFE_INTEGER
      ),
      damageWrapperList: [],
      isAttacked: false,
      currentSkin: getStoredSkin(parsedState.currentSkin),
      currentMonster: getStoredMonster(parsedState.currentMonster),
      setting: {
        numberAttack: getBoundedNumber(
          parsedSetting.numberAttack,
          DEFAULT_SETTINGS.NUMBER_ATTACK,
          SETTING_LIMITS.MIN_NUMBER_ATTACK,
          SETTING_LIMITS.MAX_NUMBER_ATTACK
        ),
        maxDamage,
        minDamage,
        criticalRate: getBoundedNumber(
          parsedSetting.criticalRate,
          DEFAULT_SETTINGS.CRITICAL_RATE,
          SETTING_LIMITS.MIN_CRITICAL_RATE,
          SETTING_LIMITS.MAX_CRITICAL_RATE
        )
      }
    }
  } catch {
    return defaultState
  }
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadInitialState)
  const monsterButtonRef = useRef<HTMLButtonElement>(null)
  const monsterImageRef = useRef<HTMLImageElement>(null)
  const idleMonsterTopOffsetRef = useRef<{
    monsterId: number
    topOffset: number
  } | null>(null)
  const wzVersion = useRecoilValue(wzVersionState)
  const { data: currentMonsterDetail } = useGetMonsterDetail(
    state.currentMonster.id,
    wzVersion.version,
    wzVersion.region
  )

  const { criticalHeight, normalHeight } = useImageLoader(state.skinNumber)
  const idleAnimation = getPrimaryMonsterAnimation(
    currentMonsterDetail?.framebooks,
    'idle'
  )
  const hitAnimation = getPrimaryMonsterAnimation(
    currentMonsterDetail?.framebooks,
    'hit'
  )
  const activeAnimation = state.isAttacked
    ? (hitAnimation ?? idleAnimation)
    : idleAnimation
  const remoteMonsterImage =
    wzVersion.version !== undefined &&
    wzVersion.region !== undefined &&
    activeAnimation
      ? getMonsterAnimationUrl(
          state.currentMonster.id,
          activeAnimation,
          wzVersion.version,
          wzVersion.region
        )
      : undefined
  const remoteMonsterIcon =
    wzVersion.version !== undefined && wzVersion.region !== undefined
      ? getMonsterIconUrl(
          state.currentMonster.id,
          wzVersion.version,
          wzVersion.region
        )
      : undefined
  const localMonsterFallback = state.isAttacked ? hitImage : standImage
  const monsterFallbackImage =
    state.currentMonster.id === DEFAULT_MONSTER.id
      ? localMonsterFallback
      : (remoteMonsterIcon ?? localMonsterFallback)
  const [monsterImageFailed, setMonsterImageFailed] = useState(false)
  const monsterImage = monsterImageFailed
    ? monsterFallbackImage
    : (remoteMonsterImage ?? monsterFallbackImage)

  useEffect(() => {
    setMonsterImageFailed(false)
  }, [remoteMonsterImage, monsterFallbackImage])

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          skinNumber: state.skinNumber,
          currentSkin: state.currentSkin,
          currentMonster: state.currentMonster,
          setting: state.setting
        })
      )
    } catch (error) {
      console.warn('설정을 저장하지 못했습니다.', error)
    }
  }, [state.skinNumber, state.currentSkin, state.currentMonster, state.setting])

  const onSetSkinNumber = (newId: number) => {
    setState((prevState) => ({
      ...prevState,
      skinNumber: newId,
      damageWrapperList: []
    }))
  }

  const captureIdleMonsterTopOffset = () => {
    if (state.isAttacked) return

    const buttonRect = monsterButtonRef.current?.getBoundingClientRect()
    const imageRect = monsterImageRef.current?.getBoundingClientRect()
    if (!buttonRect || !imageRect) return

    idleMonsterTopOffsetRef.current = {
      monsterId: state.currentMonster.id,
      topOffset: buttonRect.bottom - imageRect.top
    }
  }

  const handleAttack = () => {
    ReactGA.event(GA_EVENTS.ATTACK_MONSTER)

    const monsterButtonRect = monsterButtonRef.current?.getBoundingClientRect()
    const monsterImageRect = monsterImageRef.current?.getBoundingClientRect()
    const idleMonsterTopOffset =
      idleMonsterTopOffsetRef.current?.monsterId === state.currentMonster.id
        ? idleMonsterTopOffsetRef.current.topOffset
        : undefined
    const monsterTop =
      monsterButtonRect && monsterImageRect
        ? getDamageAnchorTop({
            monsterAnchorBottom: monsterButtonRect.bottom,
            currentMonsterTop: monsterImageRect.top,
            idleMonsterTopOffset
          })
        : window.innerHeight * 0.6

    if (!state.isAttacked && monsterButtonRect && monsterImageRect) {
      idleMonsterTopOffsetRef.current = {
        monsterId: state.currentMonster.id,
        topOffset: monsterButtonRect.bottom - monsterImageRect.top
      }
    }

    const spawnBottom = getDamageSpawnBottom({
      viewportHeight: window.innerHeight,
      monsterTop
    })

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
        { id: uuid(), damageList: damageListWithMargin, spawnBottom }
      ]
    }))
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
      <MonsterSelectModal
        currentMonster={state.currentMonster}
        onSelect={(monster) =>
          setState((prevState) => ({
            ...prevState,
            currentMonster: monster,
            isAttacked: false,
            damageWrapperList: []
          }))
        }
      />
      {import.meta.env.DEV && (
        <a
          href="#mapping"
          style={{
            position: 'fixed',
            top: '20px',
            right: '80px',
            padding: '4px 8px',
            background: '#1890ff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: 1000
          }}
        >
          매핑 도구
        </a>
      )}
      <div className={clsx(styles.Body, 'no-drag')}>
        {state.damageWrapperList.map((item) => (
          <DamageWrapper
            key={item.id}
            damageWrapper={item}
            setState={setState}
            currentSkin={state.currentSkin}
          />
        ))}
        <button
          ref={monsterButtonRef}
          type="button"
          className={styles.MonsterButton}
          onClick={handleAttack}
          aria-label={`${state.currentMonster.name} 공격하기`}
        >
          <img
            ref={monsterImageRef}
            className={styles.MonsterImage}
            draggable="false"
            src={monsterImage}
            onLoad={captureIdleMonsterTopOffset}
            onError={() => setMonsterImageFailed(true)}
            alt=""
          />
        </button>
      </div>
    </>
  )
}

export default App
