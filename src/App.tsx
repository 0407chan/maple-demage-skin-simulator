import React, { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
// 이미지 임포트
import {
  getMonsterAnimationUrl,
  getMonsterIconUrl,
  useGetMonsterDetail
} from 'api/monster'
import { wzVersionState } from 'atoms/wzVersion'
import { BackgroundSelectModal } from 'components/modals/BackgroundSelectModal'
import MapScene from 'components/MapScene'
import type { MapMovementState } from 'components/MapScene'
import { MonsterSelectModal } from 'components/modals/MonsterSelectModal'
import SettingModal from 'components/modals/SettingModal'
import { SkinSelectModal } from 'components/modals/SkinSelectModal'
import {
  ATTACK_ANIMATION_DURATION,
  DEATH_ANIMATION_DURATION,
  DEFAULT_MONSTER,
  DEFAULT_SETTINGS,
  DEFAULT_SKIN_NUMBER,
  RESPAWN_ANIMATION_DURATION,
  SETTING_LIMITS
} from 'constants/app_constants'
import { useImageLoader } from 'hooks/useImageLoader'
import hitImage from 'images/hit1_0.png'
import standImage from 'images/stand.gif'
import { useRecoilValue } from 'recoil'
import { getDamageAnchorTop, getDamageSpawnBottom } from 'utils/damageSpawn'
import { getDamageSkinFaviconUrl, updateFavicon } from 'utils/favicon'
import {
  getGifAnimationAssetFromUrl,
  getOneShotGifPlaybackDuration
} from 'utils/gifAnimation'
import { GifAnimationOpaqueMetrics } from 'utils/gifFrameMetrics'
import {
  cacheImageMetrics,
  getCachedImageMetrics,
  preloadImages
} from 'utils/imagePreloader'
import { getPrimaryMonsterAnimation } from 'utils/monsterAnimation'
import {
  getMonsterImageAlignment,
  getMonsterImageTransform
} from 'utils/monsterImageAlignment'
import type { MonsterFacingDirection } from 'utils/monsterImageAlignment'
import {
  getMonsterHealthAfterAttack,
  getMonsterHealthPercent,
  getMonsterMaxHealth
} from 'utils/monsterHealth'
import { getRandomInt, numberWithCommas } from 'utils/number'
import { trackMonsterAttacked } from 'utils/analytics'
import { SkinMap } from 'constants/damageSkinMapper'
import DamageWrapper from './components/DamageWrapper'
import { DamageWrapperType, ItemDto } from './type/damage-skin'
import { MapleMap } from './type/map'
import { Monster } from './type/monster'
import { Setting } from './type/setting'
import styles from './App.module.scss'
import clsx from 'clsx'

const LOCAL_STORAGE_KEY = 'damageSkinState'

type MonsterStatus = 'alive' | 'dying' | 'respawning'

const IDLE_MAP_MOVEMENT: MapMovementState = {
  horizontalDirection: 0,
  isMoving: false
}

export interface AppState {
  skinNumber: number
  damageWrapperList: DamageWrapperType[]
  isAttacked: boolean
  monsterHealth: number
  monsterStatus: MonsterStatus
  currentSkin?: ItemDto
  currentMonster: Monster
  currentBackground?: MapleMap
  setting: Setting
}

const createDefaultState = (): AppState => {
  const setting = {
    numberAttack: DEFAULT_SETTINGS.NUMBER_ATTACK,
    maxDamage: DEFAULT_SETTINGS.MAX_DAMAGE,
    minDamage: DEFAULT_SETTINGS.MIN_DAMAGE,
    criticalRate: DEFAULT_SETTINGS.CRITICAL_RATE,
    monsterInvincible: DEFAULT_SETTINGS.MONSTER_INVINCIBLE
  }

  return {
    skinNumber: DEFAULT_SKIN_NUMBER,
    damageWrapperList: [],
    isAttacked: false,
    monsterHealth: getMonsterMaxHealth({
      ...setting,
      isBoss: DEFAULT_MONSTER.isBoss
    }),
    monsterStatus: 'alive',
    currentSkin: undefined,
    currentMonster: DEFAULT_MONSTER,
    currentBackground: undefined,
    setting
  }
}

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

const getStoredBackground = (value: unknown): MapleMap | undefined => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    !Number.isSafeInteger(value.id) ||
    typeof value.name !== 'string' ||
    typeof value.streetName !== 'string'
  ) {
    return undefined
  }

  return {
    id: value.id,
    name: value.name,
    streetName: value.streetName
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

    const currentMonster = getStoredMonster(parsedState.currentMonster)
    const setting = {
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
      ),
      monsterInvincible:
        typeof parsedSetting.monsterInvincible === 'boolean'
          ? parsedSetting.monsterInvincible
          : DEFAULT_SETTINGS.MONSTER_INVINCIBLE
    }

    return {
      skinNumber: getBoundedNumber(
        parsedState.skinNumber,
        DEFAULT_SKIN_NUMBER,
        1,
        Number.MAX_SAFE_INTEGER
      ),
      damageWrapperList: [],
      isAttacked: false,
      monsterHealth: getMonsterMaxHealth({
        ...setting,
        isBoss: currentMonster.isBoss
      }),
      monsterStatus: 'alive',
      currentSkin: getStoredSkin(parsedState.currentSkin),
      currentMonster,
      currentBackground: getStoredBackground(parsedState.currentBackground),
      setting
    }
  } catch {
    return defaultState
  }
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadInitialState)
  const [mapMovement, setMapMovement] =
    useState<MapMovementState>(IDLE_MAP_MOVEMENT)
  const [monsterFacingDirection, setMonsterFacingDirection] =
    useState<MonsterFacingDirection>('left')
  const [, setMonsterMetricsRevision] = useState(0)
  const [monsterFootY, setMonsterFootY] = useState<number>()
  const [deathPlaybackDuration, setDeathPlaybackDuration] = useState(
    DEATH_ANIMATION_DURATION
  )
  const [deathPlaybackImage, setDeathPlaybackImage] = useState<string>()
  const [deathAnimationOpaqueMetrics, setDeathAnimationOpaqueMetrics] =
    useState<GifAnimationOpaqueMetrics>()
  const deathPlaybackDurationRef = useRef(DEATH_ANIMATION_DURATION)
  const deathAnimationBlobRef = useRef<Blob | undefined>(undefined)
  const deathPlaybackImageRef = useRef<string | undefined>(undefined)
  const bodyRef = useRef<HTMLDivElement>(null)
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
  const moveAnimation = getPrimaryMonsterAnimation(
    currentMonsterDetail?.framebooks,
    'move'
  )
  const hitAnimation = getPrimaryMonsterAnimation(
    currentMonsterDetail?.framebooks,
    'hit'
  )
  const deathAnimation = getPrimaryMonsterAnimation(
    currentMonsterDetail?.framebooks,
    'death'
  )
  const remoteIdleMonsterImage =
    wzVersion.version !== undefined &&
    wzVersion.region !== undefined &&
    idleAnimation
      ? getMonsterAnimationUrl(
          state.currentMonster.id,
          idleAnimation,
          wzVersion.version,
          wzVersion.region
        )
      : undefined
  const remoteMoveMonsterImage =
    wzVersion.version !== undefined &&
    wzVersion.region !== undefined &&
    moveAnimation
      ? getMonsterAnimationUrl(
          state.currentMonster.id,
          moveAnimation,
          wzVersion.version,
          wzVersion.region
        )
      : undefined
  const remoteHitMonsterImage =
    wzVersion.version !== undefined &&
    wzVersion.region !== undefined &&
    hitAnimation
      ? getMonsterAnimationUrl(
          state.currentMonster.id,
          hitAnimation,
          wzVersion.version,
          wzVersion.region
        )
      : undefined
  const remoteDeathMonsterImage =
    wzVersion.version !== undefined &&
    wzVersion.region !== undefined &&
    deathAnimation
      ? getMonsterAnimationUrl(
          state.currentMonster.id,
          deathAnimation,
          wzVersion.version,
          wzVersion.region
        )
      : undefined
  const remoteMonsterImage =
    state.monsterStatus === 'dying'
      ? (deathPlaybackImage ??
        remoteDeathMonsterImage ??
        remoteHitMonsterImage ??
        remoteIdleMonsterImage)
      : state.isAttacked
        ? (remoteHitMonsterImage ?? remoteIdleMonsterImage)
        : mapMovement.isMoving && state.monsterStatus === 'alive'
          ? (remoteMoveMonsterImage ?? remoteIdleMonsterImage)
          : remoteIdleMonsterImage
  const remoteMonsterIcon =
    wzVersion.version !== undefined && wzVersion.region !== undefined
      ? getMonsterIconUrl(
          state.currentMonster.id,
          wzVersion.version,
          wzVersion.region
        )
      : undefined
  const idleMonsterFallback =
    state.currentMonster.id === DEFAULT_MONSTER.id
      ? standImage
      : (remoteMonsterIcon ?? standImage)
  const hitMonsterFallback =
    state.currentMonster.id === DEFAULT_MONSTER.id
      ? hitImage
      : (remoteMonsterIcon ?? hitImage)
  const monsterFallbackImage = state.isAttacked
    ? hitMonsterFallback
    : idleMonsterFallback
  const [monsterImageFailed, setMonsterImageFailed] = useState(false)
  const monsterImage = monsterImageFailed
    ? monsterFallbackImage
    : (remoteMonsterImage ?? monsterFallbackImage)
  const idleMonsterImage = remoteIdleMonsterImage ?? idleMonsterFallback
  const monsterMetricsImage =
    !monsterImageFailed && deathPlaybackImage && remoteDeathMonsterImage
      ? remoteDeathMonsterImage
      : monsterImage
  const maxMonsterHealth = getMonsterMaxHealth({
    ...state.setting,
    isBoss: state.currentMonster.isBoss
  })
  const monsterHealthPercent = getMonsterHealthPercent(
    state.monsterHealth,
    maxMonsterHealth
  )
  const monsterHealthLabel = `${numberWithCommas(state.monsterHealth)} / ${numberWithCommas(maxMonsterHealth)}`
  const monsterImageAlignment = monsterImageFailed
    ? { bottomOffset: 0, horizontalOffset: 0 }
    : getMonsterImageAlignment({
        idleMetrics: getCachedImageMetrics(idleMonsterImage),
        activeMetrics: getCachedImageMetrics(monsterMetricsImage),
        activeAnimationMetrics:
          state.monsterStatus === 'dying'
            ? deathAnimationOpaqueMetrics
            : undefined,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      })

  const handleMapMovementChange = useCallback((movement: MapMovementState) => {
    setMapMovement((current) =>
      current.isMoving === movement.isMoving &&
      current.horizontalDirection === movement.horizontalDirection
        ? current
        : movement
    )

    if (movement.horizontalDirection < 0) {
      setMonsterFacingDirection('left')
    } else if (movement.horizontalDirection > 0) {
      setMonsterFacingDirection('right')
    }
  }, [])

  const updateMonsterFootY = useCallback(() => {
    if (
      mapMovement.isMoving ||
      state.isAttacked ||
      state.monsterStatus !== 'alive'
    ) {
      return
    }

    const bodyRect = bodyRef.current?.getBoundingClientRect()
    const image = monsterImageRef.current
    const imageRect = image?.getBoundingClientRect()
    if (!bodyRect || !image || !imageRect) return

    const metrics = getCachedImageMetrics(idleMonsterImage)
    const renderedTransparentBottom = metrics
      ? metrics.transparentBottom * (imageRect.height / metrics.naturalHeight)
      : 0
    const nextFootY =
      imageRect.bottom - bodyRect.top - renderedTransparentBottom

    setMonsterFootY((current) =>
      current === undefined || Math.abs(current - nextFootY) >= 0.5
        ? nextFootY
        : current
    )
  }, [
    idleMonsterImage,
    mapMovement.isMoving,
    state.isAttacked,
    state.monsterStatus
  ])

  useEffect(() => {
    setMonsterImageFailed(false)
  }, [remoteMonsterImage, monsterFallbackImage])

  useEffect(() => {
    const animationUrls = [
      remoteIdleMonsterImage,
      remoteMoveMonsterImage,
      remoteHitMonsterImage,
      remoteDeathMonsterImage
    ].filter((url): url is string => url !== undefined)
    if (animationUrls.length === 0) return

    let cancelled = false
    void preloadImages(animationUrls).then(() => {
      if (!cancelled) setMonsterMetricsRevision((revision) => revision + 1)
    })

    return () => {
      cancelled = true
    }
  }, [
    remoteDeathMonsterImage,
    remoteHitMonsterImage,
    remoteIdleMonsterImage,
    remoteMoveMonsterImage
  ])

  useEffect(() => {
    let cancelled = false
    deathAnimationBlobRef.current = undefined
    setDeathAnimationOpaqueMetrics(undefined)
    deathPlaybackDurationRef.current = DEATH_ANIMATION_DURATION
    setDeathPlaybackDuration(DEATH_ANIMATION_DURATION)

    if (!remoteDeathMonsterImage) return

    void getGifAnimationAssetFromUrl(remoteDeathMonsterImage).then((asset) => {
      if (cancelled || !asset) return

      deathAnimationBlobRef.current = asset.blob
      setDeathAnimationOpaqueMetrics(asset.opaqueMetrics)
      const playbackDuration = getOneShotGifPlaybackDuration(
        asset.durationMs,
        DEATH_ANIMATION_DURATION
      )
      deathPlaybackDurationRef.current = playbackDuration
      setDeathPlaybackDuration(playbackDuration)
    })

    return () => {
      cancelled = true
    }
  }, [remoteDeathMonsterImage])

  const clearDeathPlaybackImage = useCallback(() => {
    if (deathPlaybackImageRef.current) {
      URL.revokeObjectURL(deathPlaybackImageRef.current)
      deathPlaybackImageRef.current = undefined
    }
    setDeathPlaybackImage(undefined)
  }, [])

  useEffect(() => {
    if (state.monsterStatus !== 'dying') clearDeathPlaybackImage()
  }, [clearDeathPlaybackImage, state.monsterStatus])

  useEffect(
    () => () => {
      if (deathPlaybackImageRef.current) {
        URL.revokeObjectURL(deathPlaybackImageRef.current)
      }
    },
    []
  )

  const startDeathPlaybackImage = () => {
    const deathAnimationBlob = deathAnimationBlobRef.current
    if (!deathAnimationBlob) return

    if (deathPlaybackImageRef.current) {
      URL.revokeObjectURL(deathPlaybackImageRef.current)
    }

    const playbackImage = URL.createObjectURL(deathAnimationBlob)
    deathPlaybackImageRef.current = playbackImage
    setDeathPlaybackImage(playbackImage)
  }

  useEffect(() => {
    updateMonsterFootY()
    window.addEventListener('resize', updateMonsterFootY)
    return () => window.removeEventListener('resize', updateMonsterFootY)
  }, [updateMonsterFootY])

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          skinNumber: state.skinNumber,
          currentSkin: state.currentSkin,
          currentMonster: state.currentMonster,
          currentBackground: state.currentBackground,
          setting: state.setting
        })
      )
    } catch (error) {
      console.warn('설정을 저장하지 못했습니다.', error)
    }
  }, [
    state.skinNumber,
    state.currentSkin,
    state.currentMonster,
    state.currentBackground,
    state.setting
  ])

  useEffect(() => {
    if (
      !state.currentSkin ||
      wzVersion.version === undefined ||
      wzVersion.region === undefined
    ) {
      return
    }

    updateFavicon(
      getDamageSkinFaviconUrl(
        state.currentSkin.id,
        wzVersion.version,
        wzVersion.region
      )
    )
  }, [state.currentSkin, wzVersion.region, wzVersion.version])

  const onSetSkinNumber = (newId: number) => {
    setState((prevState) => ({
      ...prevState,
      skinNumber: newId,
      damageWrapperList: []
    }))
  }

  const captureIdleMonsterTopOffset = () => {
    if (
      mapMovement.isMoving ||
      state.isAttacked ||
      state.monsterStatus !== 'alive'
    ) {
      return
    }

    const buttonRect = monsterButtonRef.current?.getBoundingClientRect()
    const imageRect = monsterImageRef.current?.getBoundingClientRect()
    if (!buttonRect || !imageRect) return

    idleMonsterTopOffsetRef.current = {
      monsterId: state.currentMonster.id,
      topOffset: buttonRect.bottom - imageRect.top
    }
  }

  const handleMonsterImageLoad = () => {
    const image = monsterImageRef.current
    if (image) {
      cacheImageMetrics(monsterImage, image)
      setMonsterMetricsRevision((revision) => revision + 1)
    }

    captureIdleMonsterTopOffset()
    updateMonsterFootY()
  }

  const handleAttack = () => {
    if (state.monsterStatus !== 'alive') return

    trackMonsterAttacked({
      monster: state.currentMonster,
      skin: state.currentSkin,
      skinEffectId: state.skinNumber,
      skinVariantCount: state.currentSkin
        ? (SkinMap[state.currentSkin.id]?.length ?? 0)
        : 0,
      setting: state.setting,
      region: wzVersion.region,
      version: wzVersion.version
    })

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
    const totalDamage = newDamageList.reduce(
      (sum, damage) => sum + damage.damage,
      0
    )
    if (
      state.setting.monsterInvincible === false &&
      totalDamage >= state.monsterHealth
    ) {
      startDeathPlaybackImage()
    }

    // 상태 업데이트
    setState((prevState) => {
      if (prevState.monsterStatus !== 'alive') return prevState

      const monsterHealth = getMonsterHealthAfterAttack(
        prevState.monsterHealth,
        totalDamage,
        prevState.setting.monsterInvincible !== false
      )

      return {
        ...prevState,
        isAttacked: true,
        monsterHealth,
        monsterStatus:
          prevState.setting.monsterInvincible === false && monsterHealth === 0
            ? 'dying'
            : 'alive',
        damageWrapperList: [
          ...prevState.damageWrapperList,
          { id: uuid(), damageList: damageListWithMargin, spawnBottom }
        ]
      }
    })
  }

  useEffect(() => {
    if (state.isAttacked && state.monsterStatus === 'alive') {
      const timer = setTimeout(() => {
        setState((prevState) => ({ ...prevState, isAttacked: false }))
      }, ATTACK_ANIMATION_DURATION)

      // 정리 함수 반환
      return () => {
        clearTimeout(timer)
      }
    }
  }, [state.isAttacked, state.monsterStatus])

  useEffect(() => {
    if (state.monsterStatus === 'dying') {
      const timer = window.setTimeout(() => {
        setState((prevState) => {
          if (prevState.monsterStatus !== 'dying') return prevState

          return {
            ...prevState,
            isAttacked: false,
            monsterHealth: getMonsterMaxHealth({
              ...prevState.setting,
              isBoss: prevState.currentMonster.isBoss
            }),
            monsterStatus: 'respawning'
          }
        })
      }, deathPlaybackDurationRef.current)

      return () => window.clearTimeout(timer)
    }

    if (state.monsterStatus === 'respawning') {
      const timer = window.setTimeout(() => {
        setState((prevState) =>
          prevState.monsterStatus === 'respawning'
            ? { ...prevState, monsterStatus: 'alive' }
            : prevState
        )
      }, RESPAWN_ANIMATION_DURATION)

      return () => window.clearTimeout(timer)
    }
  }, [state.monsterStatus])

  return (
    <>
      <SettingModal
        setting={state.setting}
        setSetting={(newSetting: Setting) =>
          setState((prevState) => ({
            ...prevState,
            setting: newSetting,
            damageWrapperList: [],
            isAttacked: false,
            monsterHealth: getMonsterMaxHealth({
              ...newSetting,
              isBoss: prevState.currentMonster.isBoss
            }),
            monsterStatus: 'alive'
          }))
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
            monsterHealth: getMonsterMaxHealth({
              ...prevState.setting,
              isBoss: monster.isBoss
            }),
            monsterStatus: 'alive',
            damageWrapperList: []
          }))
        }
      />
      <BackgroundSelectModal
        currentBackground={state.currentBackground}
        onSelect={(background) =>
          setState((prevState) => ({
            ...prevState,
            currentBackground: background
          }))
        }
      />
      {import.meta.env.DEV && (
        <a
          href="#mapping"
          className={styles.MappingToolButton}
          aria-label="로컬 매핑 도구 열기"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4.5 5.5h4v4h-4zM11.5 5.5h4v4h-4zM4.5 12.5h4v3h-4zM11.5 12.5h4v3h-4z" />
          </svg>
          <span>매핑 도구</span>
        </a>
      )}
      <div ref={bodyRef} className={clsx(styles.Body, 'no-drag')}>
        {state.currentBackground &&
          wzVersion.version !== undefined &&
          wzVersion.region !== undefined && (
            <MapScene
              mapId={state.currentBackground.id}
              monsterFootY={monsterFootY}
              onMovementChange={handleMapMovementChange}
              version={wzVersion.version}
              region={wzVersion.region}
            />
          )}
        {state.damageWrapperList.map((item) => (
          <DamageWrapper
            key={item.id}
            damageWrapper={item}
            setState={setState}
            currentSkin={state.currentSkin}
          />
        ))}
        <div className={styles.MonsterActor}>
          <div
            className={styles.MonsterHealth}
            role="progressbar"
            aria-label={`${state.currentMonster.name} 체력`}
            aria-valuemin={0}
            aria-valuemax={maxMonsterHealth}
            aria-valuenow={state.monsterHealth}
            aria-valuetext={monsterHealthLabel}
          >
            <div className={styles.MonsterHealthMeta} aria-hidden="true">
              <span>{monsterHealthLabel}</span>
            </div>
            <div className={styles.MonsterHealthTrack} aria-hidden="true">
              <span
                className={clsx(styles.MonsterHealthFill, {
                  [styles.MonsterHealthFillLow]:
                    monsterHealthPercent <= 25 &&
                    state.monsterStatus === 'alive'
                })}
                style={{ width: `${monsterHealthPercent}%` }}
              />
            </div>
          </div>
          <button
            ref={monsterButtonRef}
            type="button"
            className={clsx(styles.MonsterButton, {
              [styles.MonsterButtonDying]: state.monsterStatus === 'dying',
              [styles.MonsterButtonRespawning]:
                state.monsterStatus === 'respawning'
            })}
            disabled={state.monsterStatus !== 'alive'}
            onClick={handleAttack}
            style={
              {
                '--monster-death-duration': `${deathPlaybackDuration}ms`
              } as React.CSSProperties
            }
            aria-label={
              state.monsterStatus === 'alive'
                ? `${state.currentMonster.name} 공격하기`
                : state.monsterStatus === 'dying'
                  ? `${state.currentMonster.name} 쓰러지는 중`
                  : `${state.currentMonster.name} 다시 나타나는 중`
            }
          >
            <img
              ref={monsterImageRef}
              className={styles.MonsterImage}
              crossOrigin={
                !monsterImageFailed && remoteMonsterImage
                  ? 'anonymous'
                  : undefined
              }
              data-monster-animation={
                !monsterImageFailed && remoteMonsterImage
                  ? state.monsterStatus === 'dying'
                    ? (deathAnimation ?? hitAnimation ?? idleAnimation)
                    : state.isAttacked
                      ? (hitAnimation ?? idleAnimation)
                      : mapMovement.isMoving
                        ? (moveAnimation ?? idleAnimation)
                        : idleAnimation
                  : undefined
              }
              data-monster-facing={monsterFacingDirection}
              data-monster-moving={mapMovement.isMoving ? 'true' : 'false'}
              draggable="false"
              src={monsterImage}
              style={{
                height: monsterImageAlignment.renderedHeight,
                marginBottom: `${-monsterImageAlignment.bottomOffset}px`,
                maxHeight: monsterImageAlignment.renderedHeight
                  ? 'none'
                  : undefined,
                maxWidth: monsterImageAlignment.renderedWidth
                  ? 'none'
                  : undefined,
                transform: getMonsterImageTransform(
                  monsterImageAlignment.horizontalOffset,
                  monsterFacingDirection
                ),
                width: monsterImageAlignment.renderedWidth
              }}
              onLoad={handleMonsterImageLoad}
              onError={() => setMonsterImageFailed(true)}
              alt=""
            />
          </button>
        </div>
      </div>
    </>
  )
}

export default App
