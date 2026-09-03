import { getMapDetail, getMapRenderUrl } from 'api/map'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import type { MapleMapDetail } from 'type/map'
import type { RegionType } from 'type/wz'
import {
  clampMapCameraX,
  clampMapCameraY,
  getImageEdgeColors,
  getMapBackgroundLayerOffsets,
  getMapBackgroundRepeat,
  getMapCameraBounds,
  getMapSceneLayout,
  loadMapBackgroundLayers,
  loadMapBackgroundPreviewLayers,
  measureMapGround
} from 'utils/mapScene'
import type {
  MapBackgroundLayer,
  MapCameraBounds,
  MapGroundMetrics,
  MapSceneLayout
} from 'utils/mapScene'
import { getWzAnimationPlayback } from 'utils/wzImageAnimation'
import styles from './style.module.scss'
import { useI18n } from 'i18n'

export type MapMovementState = {
  horizontalDirection: -1 | 0 | 1
  isMoving: boolean
}

type Props = {
  mapId: number
  monsterFootY?: number
  onMovementChange?: (movement: MapMovementState) => void
  region: RegionType
  version: number
}

type PreparedMapScene = {
  backgroundColor?: string
  backgrounds: MapBackgroundLayer[]
  foregroundUrl: string
  groundMetrics?: MapGroundMetrics
  mapDetail?: MapleMapDetail
  mapId: number
}

type BackgroundLayerProps = {
  background: MapBackgroundLayer
  foregroundTop?: number
  layout: MapSceneLayout
  worldTop: number
}

type CameraViewport = {
  bounds: MapCameraBounds
  height: number
  width: number
}

const MAP_CAMERA_SPEED_PX_PER_SECOND = 320
const MAP_CAMERA_KEY_STEP_PX = 24
const MAP_CAMERA_MAX_FRAME_MS = 48
const INITIAL_CAMERA_BOUNDS: MapCameraBounds = {
  maxX: 0,
  maxY: 0,
  minX: 0,
  minY: 0
}
const IDLE_MAP_MOVEMENT: MapMovementState = {
  horizontalDirection: 0,
  isMoving: false
}

const getBackgroundPositionX = (x: number) => {
  const offset = `${x < 0 ? '-' : '+'} ${Math.abs(x)}px`

  return `calc(50% ${offset})`
}

const isMapNavigationBlocked = (target?: EventTarget | null) => {
  const targetElement = target instanceof Element ? target : undefined
  const editingControl = targetElement?.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"]'
  )
  const openDialog = document.querySelector(
    '[role="dialog"][aria-modal="true"][aria-hidden="false"]'
  )

  return (
    (editingControl !== null && editingControl !== undefined) || !!openDialog
  )
}

const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  background,
  foregroundTop,
  layout,
  worldTop
}) => {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    setFrameIndex(0)
    if (
      !background.sequence.animated ||
      background.sequence.frames.length <= 1
    ) {
      return
    }

    let active = true
    let timer: number | undefined
    const animationStart = performance.now()

    const updateFrame = () => {
      if (!active) return

      const playback = getWzAnimationPlayback(
        background.sequence.frames,
        performance.now() - animationStart,
        true
      )
      setFrameIndex(playback.index)

      if (Number.isFinite(playback.remaining)) {
        timer = window.setTimeout(updateFrame, playback.remaining)
      }
    }

    updateFrame()

    return () => {
      active = false
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [background.sequence])

  const frame =
    background.sequence.frames[
      Math.min(frameIndex, background.sequence.frames.length - 1)
    ]
  if (!frame) return null

  const offsets = getMapBackgroundLayerOffsets(background, frame, layout)
  const x = background.flip ? offsets.flippedX : offsets.x
  const y =
    foregroundTop === undefined
      ? `calc(50% + ${offsets.y - layout.foregroundHeight / 2}px)`
      : `${foregroundTop + offsets.y - worldTop}px`

  return (
    <div
      className={styles.backgroundLayer}
      data-map-background-front={background.front ? 'true' : undefined}
      data-map-background-index={background.index}
      style={{
        backgroundImage: `url("${frame.src}")`,
        backgroundPosition: `${getBackgroundPositionX(x)} ${y}`,
        backgroundRepeat: getMapBackgroundRepeat(background.type),
        backgroundSize: `${frame.width}px ${frame.height}px`,
        opacity: background.alpha,
        transform: background.flip ? 'scaleX(-1)' : undefined
      }}
    />
  )
}

const MapScene: React.FC<Props> = ({
  mapId,
  monsterFootY,
  onMovementChange,
  region,
  version
}) => {
  const { t } = useI18n()
  const [preparedScene, setPreparedScene] = useState<PreparedMapScene>()
  const [cameraViewport, setCameraViewport] = useState<CameraViewport>({
    bounds: INITIAL_CAMERA_BOUNDS,
    height: 0,
    width: 0
  })
  const sceneRef = useRef<HTMLDivElement>(null)
  const cameraXRef = useRef(0)
  const cameraYRef = useRef(0)
  const cameraBoundsRef = useRef<MapCameraBounds>(INITIAL_CAMERA_BOUNDS)
  const heldDirectionsRef = useRef({
    down: false,
    left: false,
    right: false,
    up: false
  })
  const movementStateRef = useRef<MapMovementState>(IDLE_MAP_MOVEMENT)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastAnimationTimeRef = useRef<number | undefined>(undefined)
  const requestedForegroundUrl = useMemo(
    () => getMapRenderUrl(mapId, version, region),
    [mapId, region, version]
  )

  useEffect(() => {
    let active = true
    let committedStage = -1

    const previewRequest = loadMapBackgroundPreviewLayers(
      mapId,
      version,
      region
    ).catch((error) => {
      console.warn('맵 우선 배경 레이어를 준비하지 못했습니다.', error)
      return []
    })
    const backgroundsRequest = loadMapBackgroundLayers(
      mapId,
      version,
      region
    ).catch((error) => {
      console.warn('맵 전체 배경 레이어를 준비하지 못했습니다.', error)
      return previewRequest
    })
    const detailRequest = getMapDetail(mapId, version, region).catch(
      (error) => {
        console.warn('맵 좌표 정보를 준비하지 못했습니다.', error)
        return undefined
      }
    )
    const groundRequest = measureMapGround(requestedForegroundUrl).catch(
      (error) => {
        console.warn('맵 발판 위치를 준비하지 못했습니다.', error)
        return undefined
      }
    )

    const commitScene = async (
      stage: number,
      backgrounds: MapBackgroundLayer[],
      mapDetail: MapleMapDetail | undefined,
      groundMetrics: MapGroundMetrics | undefined
    ) => {
      const baseBackground = backgrounds.find((background) => !background.front)
      const baseFrame = baseBackground?.sequence.frames[0]
      const edgeColors = baseFrame
        ? await getImageEdgeColors(baseFrame.src).catch(() => undefined)
        : undefined

      if (!active || stage < committedStage) return
      committedStage = stage
      setPreparedScene({
        backgroundColor: edgeColors?.top ?? edgeColors?.bottom,
        backgrounds,
        foregroundUrl: requestedForegroundUrl,
        groundMetrics,
        mapDetail,
        mapId
      })
    }

    void Promise.all([detailRequest, groundRequest]).then(
      ([mapDetail, groundMetrics]) => {
        void commitScene(0, [], mapDetail, groundMetrics)
      }
    )

    void Promise.all([previewRequest, detailRequest, groundRequest]).then(
      ([backgrounds, mapDetail, groundMetrics]) => {
        void commitScene(1, backgrounds, mapDetail, groundMetrics)
      }
    )

    void Promise.all([backgroundsRequest, detailRequest, groundRequest]).then(
      ([backgrounds, mapDetail, groundMetrics]) => {
        void commitScene(2, backgrounds, mapDetail, groundMetrics)
      }
    )

    return () => {
      active = false
    }
  }, [mapId, region, requestedForegroundUrl, version])

  const layout = useMemo(
    () =>
      getMapSceneLayout(preparedScene?.mapDetail, preparedScene?.groundMetrics),
    [preparedScene?.groundMetrics, preparedScene?.mapDetail]
  )
  const foregroundTop =
    monsterFootY === undefined ? undefined : monsterFootY - layout.groundY
  const backLayers = preparedScene?.backgrounds.filter(
    (background) => !background.front
  )
  const frontLayers = preparedScene?.backgrounds.filter(
    (background) => background.front
  )

  const updateCameraPosition = useCallback(
    (nextCameraX: number, nextCameraY: number) => {
      const cameraX = clampMapCameraX(nextCameraX, cameraBoundsRef.current)
      const cameraY = clampMapCameraY(nextCameraY, cameraBoundsRef.current)
      cameraXRef.current = cameraX
      cameraYRef.current = cameraY

      const scene = sceneRef.current
      if (!scene) return { x: cameraX, y: cameraY }

      scene.style.setProperty('--map-camera-x', `${cameraX}px`)
      scene.style.setProperty('--map-camera-y', `${cameraY}px`)
      scene.dataset.mapCameraX = cameraX.toFixed(1)
      scene.dataset.mapCameraY = cameraY.toFixed(1)
      return { x: cameraX, y: cameraY }
    },
    []
  )

  const notifyMovementChange = useCallback(
    (isMoving: boolean, horizontalDirection: -1 | 0 | 1) => {
      const current = movementStateRef.current
      if (
        current.isMoving === isMoving &&
        current.horizontalDirection === horizontalDirection
      ) {
        return
      }

      const movement = { horizontalDirection, isMoving }
      movementStateRef.current = movement
      onMovementChange?.(movement)
    },
    [onMovementChange]
  )

  useLayoutEffect(() => {
    updateCameraPosition(0, 0)
    notifyMovementChange(false, 0)
  }, [mapId, notifyMovementChange, updateCameraPosition])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const updateBounds = () => {
      const viewportHeight = scene.clientHeight
      const viewportWidth = scene.clientWidth
      const measuredForegroundTop =
        foregroundTop ?? (viewportHeight - layout.foregroundHeight) / 2
      const bounds = getMapCameraBounds({
        foregroundHeight: layout.foregroundHeight,
        foregroundTop: measuredForegroundTop,
        foregroundWidth: layout.foregroundWidth,
        viewportHeight,
        viewportWidth
      })
      cameraBoundsRef.current = bounds
      setCameraViewport((current) =>
        current.width === viewportWidth &&
        current.height === viewportHeight &&
        current.bounds.maxX === bounds.maxX &&
        current.bounds.maxY === bounds.maxY &&
        current.bounds.minX === bounds.minX &&
        current.bounds.minY === bounds.minY
          ? current
          : { bounds, height: viewportHeight, width: viewportWidth }
      )
      updateCameraPosition(cameraXRef.current, cameraYRef.current)
    }

    updateBounds()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateBounds)
      return () => window.removeEventListener('resize', updateBounds)
    }

    const resizeObserver = new ResizeObserver(updateBounds)
    resizeObserver.observe(scene)
    return () => resizeObserver.disconnect()
  }, [
    foregroundTop,
    layout.foregroundHeight,
    layout.foregroundWidth,
    updateCameraPosition
  ])

  const canNavigateHorizontally =
    cameraViewport.bounds.maxX - cameraViewport.bounds.minX >= 1
  const canNavigateVertically =
    cameraViewport.bounds.maxY - cameraViewport.bounds.minY >= 1
  const canNavigate = canNavigateHorizontally || canNavigateVertically
  const resolvedForegroundTop =
    foregroundTop ??
    (cameraViewport.height > 0
      ? (cameraViewport.height - layout.foregroundHeight) / 2
      : undefined)
  const cameraWorldTop = cameraViewport.bounds.minY
  const cameraWorldHeight =
    cameraViewport.height +
    cameraViewport.bounds.maxY -
    cameraViewport.bounds.minY

  useEffect(() => {
    const stopMovement = () => {
      heldDirectionsRef.current = {
        down: false,
        left: false,
        right: false,
        up: false
      }
      lastAnimationTimeRef.current = undefined
      if (animationFrameRef.current !== undefined) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      notifyMovementChange(false, 0)
    }

    const animate = (time: number) => {
      const directionX =
        Number(heldDirectionsRef.current.right) -
        Number(heldDirectionsRef.current.left)
      const directionY =
        Number(heldDirectionsRef.current.down) -
        Number(heldDirectionsRef.current.up)
      const directionLength = Math.hypot(directionX, directionY)
      if (directionLength === 0 || isMapNavigationBlocked()) {
        stopMovement()
        return
      }

      const previousTime = lastAnimationTimeRef.current ?? time
      const elapsedMs = Math.min(time - previousTime, MAP_CAMERA_MAX_FRAME_MS)
      lastAnimationTimeRef.current = time
      if (elapsedMs <= 0) {
        animationFrameRef.current = window.requestAnimationFrame(animate)
        return
      }

      const distance =
        (MAP_CAMERA_SPEED_PX_PER_SECOND * (elapsedMs / 1000)) / directionLength
      const previousX = cameraXRef.current
      const previousY = cameraYRef.current
      const nextPosition = updateCameraPosition(
        cameraXRef.current + directionX * distance,
        cameraYRef.current + directionY * distance
      )
      const movedX = nextPosition.x - previousX
      const movedY = nextPosition.y - previousY
      if (Math.abs(movedX) < 0.01 && Math.abs(movedY) < 0.01) {
        stopMovement()
        return
      }

      notifyMovementChange(true, movedX < -0.01 ? -1 : movedX > 0.01 ? 1 : 0)
      animationFrameRef.current = window.requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (animationFrameRef.current !== undefined) return
      lastAnimationTimeRef.current = undefined
      animationFrameRef.current = window.requestAnimationFrame(animate)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const isHorizontalKey =
        event.key === 'ArrowLeft' || event.key === 'ArrowRight'
      const isVerticalKey = event.key === 'ArrowUp' || event.key === 'ArrowDown'
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (!isHorizontalKey && !isVerticalKey) ||
        (isHorizontalKey &&
          cameraBoundsRef.current.maxX - cameraBoundsRef.current.minX < 1) ||
        (isVerticalKey &&
          cameraBoundsRef.current.maxY - cameraBoundsRef.current.minY < 1) ||
        isMapNavigationBlocked(event.target)
      ) {
        return
      }

      event.preventDefault()
      const directionX =
        event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
      const directionY =
        event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
      const previousX = cameraXRef.current
      const previousY = cameraYRef.current
      let nextPosition = { x: previousX, y: previousY }
      if (!event.repeat) {
        nextPosition = updateCameraPosition(
          cameraXRef.current + directionX * MAP_CAMERA_KEY_STEP_PX,
          cameraYRef.current + directionY * MAP_CAMERA_KEY_STEP_PX
        )
      }
      if (
        !event.repeat &&
        Math.abs(nextPosition.x - previousX) < 0.01 &&
        Math.abs(nextPosition.y - previousY) < 0.01
      ) {
        return
      }

      if (event.key === 'ArrowLeft') heldDirectionsRef.current.left = true
      if (event.key === 'ArrowRight') heldDirectionsRef.current.right = true
      if (event.key === 'ArrowUp') heldDirectionsRef.current.up = true
      if (event.key === 'ArrowDown') heldDirectionsRef.current.down = true
      notifyMovementChange(true, directionX < 0 ? -1 : directionX > 0 ? 1 : 0)
      startAnimation()
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'ArrowDown'
      ) {
        return
      }

      if (event.key === 'ArrowLeft') heldDirectionsRef.current.left = false
      if (event.key === 'ArrowRight') heldDirectionsRef.current.right = false
      if (event.key === 'ArrowUp') heldDirectionsRef.current.up = false
      if (event.key === 'ArrowDown') heldDirectionsRef.current.down = false
      if (!Object.values(heldDirectionsRef.current).some(Boolean)) {
        stopMovement()
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) stopMovement()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', stopMovement)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopMovement()
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', stopMovement)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [notifyMovementChange, updateCameraPosition])

  return (
    <div
      ref={sceneRef}
      className={styles.scene}
      data-map-id={preparedScene?.mapId}
      data-map-navigation-enabled={canNavigate ? 'true' : 'false'}
      data-map-navigation-horizontal={
        canNavigateHorizontally ? 'true' : 'false'
      }
      data-map-navigation-vertical={canNavigateVertically ? 'true' : 'false'}
      style={{ backgroundColor: preparedScene?.backgroundColor }}
      aria-hidden="true"
    >
      <div
        className={styles.camera}
        style={
          {
            '--map-world-height':
              cameraViewport.height > 0 ? `${cameraWorldHeight}px` : '100%',
            '--map-world-top': `${cameraWorldTop}px`,
            '--map-world-width': `${layout.foregroundWidth}px`
          } as React.CSSProperties
        }
      >
        {backLayers?.map((background) => (
          <BackgroundLayer
            key={`back-${background.index}`}
            background={background}
            foregroundTop={resolvedForegroundTop}
            layout={layout}
            worldTop={cameraWorldTop}
          />
        ))}
        {preparedScene && (
          <img
            className={styles.foreground}
            crossOrigin="anonymous"
            data-map-ground-y={
              monsterFootY !== undefined ? Math.round(monsterFootY) : undefined
            }
            draggable="false"
            src={preparedScene.foregroundUrl}
            style={{
              top:
                resolvedForegroundTop === undefined
                  ? '50%'
                  : `${resolvedForegroundTop - cameraWorldTop}px`,
              transform:
                resolvedForegroundTop === undefined
                  ? 'translate(-50%, -50%)'
                  : 'translateX(-50%)'
            }}
            alt=""
          />
        )}
        {frontLayers?.map((background) => (
          <BackgroundLayer
            key={`front-${background.index}`}
            background={background}
            foregroundTop={resolvedForegroundTop}
            layout={layout}
            worldTop={cameraWorldTop}
          />
        ))}
      </div>
      {canNavigate && (
        <div className={styles.navigationHint}>
          {canNavigateHorizontally && '← →'}
          {canNavigateHorizontally && canNavigateVertically && ' '}
          {canNavigateVertically && '↑ ↓'} {t('map.navigation')}
        </div>
      )}
    </div>
  )
}

export default MapScene
