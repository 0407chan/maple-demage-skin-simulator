import { getBundledMapScene } from 'utils/bundledMaps'
import { reconstructMap } from 'utils/reconstructMap'
import type { ReconstructedMap } from 'utils/reconstructMap'
import type { MapSourceProgress } from 'utils/mapSourceClient'
import type { MapleMapDetail } from 'type/map'
import type { RegionType } from 'type/wz'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  clampMapCameraX,
  clampMapCameraY,
  getMapCameraBounds,
  getMapSceneLayout
} from 'utils/mapScene'
import type {
  MapBackgroundLayer,
  MapCameraBounds,
  MapGroundMetrics
} from 'utils/mapScene'
import styles from './style.module.scss'
import { useI18n } from 'i18n'
import { getMapPlacementX, getMapPlacementY } from 'utils/monsterPlacement'
import type { PlacementPoint } from 'utils/monsterPlacement'
import BackgroundCanvas from './BackgroundCanvas'
import type { BackgroundCanvasHandle } from './BackgroundCanvas'

export type MapMovementState = {
  horizontalDirection: -1 | 0 | 1
  isMoving: boolean
}

type Props = {
  mapId: number
  version?: number
  region?: RegionType
  monsterFootY?: number
  monsterFootX?: number
  onPlacementOffsetChange?: (point: PlacementPoint) => void
  foregroundRef?: React.Ref<HTMLImageElement>
  navigationEnabled?: boolean
  onMovementChange?: (movement: MapMovementState) => void
}

type PreparedMapScene = {
  backgroundColor?: string
  backgrounds: MapBackgroundLayer[]
  foregroundUrl: string
  groundMetrics?: MapGroundMetrics
  mapDetail?: MapleMapDetail
  mapId: number
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

const MapScene: React.FC<Props> = ({
  mapId,
  version,
  region,
  monsterFootY,
  monsterFootX,
  onPlacementOffsetChange,
  foregroundRef,
  navigationEnabled = true,
  onMovementChange
}) => {
  const { t } = useI18n()
  const bundledScene = useMemo(() => getBundledMapScene(mapId), [mapId])
  const sourceKey = `${region}/${version}/${mapId}`
  const [remoteScene, setRemoteScene] = useState<{
    key: string
    scene: PreparedMapScene
  }>()
  const [failedSource, setFailedSource] = useState<string>()
  const [retryCount, setRetryCount] = useState(0)
  const [progress, setProgress] = useState<MapSourceProgress>()
  const preparedScene =
    bundledScene ??
    (remoteScene?.key === sourceKey ? remoteScene.scene : undefined)
  const loadFailed = !bundledScene && failedSource === sourceKey
  const [cameraViewport, setCameraViewport] = useState<CameraViewport>({
    bounds: INITIAL_CAMERA_BOUNDS,
    height: 0,
    width: 0
  })
  const sceneRef = useRef<HTMLDivElement>(null)
  const backCanvasRef = useRef<BackgroundCanvasHandle>(null)
  const frontCanvasRef = useRef<BackgroundCanvasHandle>(null)
  const cameraXRef = useRef(0)
  const cameraYRef = useRef(0)
  const cameraBoundsRef = useRef<MapCameraBounds>(INITIAL_CAMERA_BOUNDS)
  const initialPlacementRef = useRef<
    { key: string; x: number; y: number } | undefined
  >(undefined)
  const heldDirectionsRef = useRef({
    down: false,
    left: false,
    right: false,
    up: false
  })
  const movementStateRef = useRef<MapMovementState>(IDLE_MAP_MOVEMENT)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastAnimationTimeRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (bundledScene || version === undefined || region === undefined) return
    let active = true
    let result: ReconstructedMap | undefined
    const controller = new AbortController()
    setRemoteScene(undefined)
    setFailedSource(undefined)
    setProgress(undefined)
    void reconstructMap({
      mapId,
      version,
      region,
      signal: controller.signal,
      refresh: retryCount > 0,
      onProgress: (next) => {
        if (active) setProgress(next)
      }
    })
      .then((scene) => {
        if (!active) {
          scene.dispose()
          return
        }
        result = scene
        setRemoteScene({ key: sourceKey, scene })
      })
      .catch((error) => {
        if (!active) return
        console.warn('맵 원본을 복원하지 못했습니다.', error)
        setFailedSource(sourceKey)
      })
    return () => {
      active = false
      controller.abort()
      result?.dispose()
    }
  }, [bundledScene, mapId, region, version, sourceKey, retryCount])

  const layout = useMemo(
    () =>
      getMapSceneLayout(preparedScene?.mapDetail, preparedScene?.groundMetrics),
    [preparedScene?.groundMetrics, preparedScene?.mapDetail]
  )
  const foregroundTop =
    monsterFootY === undefined ? undefined : monsterFootY - layout.groundY
  const backLayers = useMemo(
    () =>
      preparedScene?.backgrounds.filter((background) => !background.front) ??
      [],
    [preparedScene?.backgrounds]
  )
  const frontLayers = useMemo(
    () =>
      preparedScene?.backgrounds.filter((background) => background.front) ?? [],
    [preparedScene?.backgrounds]
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
      backCanvasRef.current?.draw()
      frontCanvasRef.current?.draw()
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
      const placement = bundledScene?.placement
      if (
        placement &&
        monsterFootX !== undefined &&
        monsterFootY !== undefined
      ) {
        const initial = getMapPlacementX(
          placement.x,
          layout.foregroundWidth,
          viewportWidth,
          monsterFootX
        )
        const initialY = getMapPlacementY(
          placement.y,
          measuredForegroundTop,
          monsterFootY,
          bounds
        )
        const key = `${mapId}/${viewportWidth}/${viewportHeight}/${layout.foregroundWidth}/${layout.foregroundHeight}`
        const previous = initialPlacementRef.current
        if (previous?.key !== key) {
          cameraXRef.current = initial.cameraX
          cameraYRef.current = initialY.cameraY
        } else {
          // Sprite loading/selection can change its visible foot centre. Keep
          // the anchor aligned while preserving any manual camera movement.
          cameraXRef.current += initial.cameraX - previous.x
          cameraYRef.current += initialY.cameraY - previous.y
        }
        initialPlacementRef.current = {
          key,
          x: initial.cameraX,
          y: initialY.cameraY
        }
        onPlacementOffsetChange?.({
          x: initial.monsterOffsetX,
          y: initialY.monsterOffsetY
        })
      } else {
        initialPlacementRef.current = undefined
        onPlacementOffsetChange?.({ x: 0, y: 0 })
      }
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
    mapId,
    bundledScene,
    monsterFootX,
    monsterFootY,
    onPlacementOffsetChange,
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

    if (!navigationEnabled) {
      stopMovement()
      return
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
  }, [navigationEnabled, notifyMovementChange, updateCameraPosition])

  return (
    <>
      <div
        ref={sceneRef}
        className={styles.scene}
        data-map-id={preparedScene?.mapId}
        data-map-source={
          preparedScene
            ? bundledScene
              ? 'bundled'
              : 'reconstructed'
            : undefined
        }
        data-map-navigation-enabled={
          canNavigate && navigationEnabled ? 'true' : 'false'
        }
        data-map-navigation-horizontal={
          canNavigateHorizontally ? 'true' : 'false'
        }
        data-map-navigation-vertical={canNavigateVertically ? 'true' : 'false'}
        style={{ backgroundColor: preparedScene?.backgroundColor }}
        aria-hidden="true"
      >
        {backLayers.length > 0 && (
          <BackgroundCanvas
            key={`back-${mapId}`}
            ref={backCanvasRef}
            layers={backLayers}
            layout={layout}
            width={cameraViewport.width}
            height={cameraViewport.height}
            foregroundTop={resolvedForegroundTop ?? 0}
            cameraXRef={cameraXRef}
            cameraYRef={cameraYRef}
          />
        )}
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
          {preparedScene && (
            <img
              ref={foregroundRef}
              className={styles.foreground}
              crossOrigin="anonymous"
              data-map-region={bundledScene?.source.region ?? region}
              data-map-version={bundledScene?.source.wzVersion ?? version}
              data-map-ground-y={
                monsterFootY !== undefined
                  ? Math.round(monsterFootY)
                  : undefined
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
        </div>
        {frontLayers.length > 0 && (
          <BackgroundCanvas
            key={`front-${mapId}`}
            ref={frontCanvasRef}
            front
            layers={frontLayers}
            layout={layout}
            width={cameraViewport.width}
            height={cameraViewport.height}
            foregroundTop={resolvedForegroundTop ?? 0}
            cameraXRef={cameraXRef}
            cameraYRef={cameraYRef}
          />
        )}
        {canNavigate && navigationEnabled && (
          <div className={styles.navigationHint}>
            {canNavigateHorizontally && '← →'}
            {canNavigateHorizontally && canNavigateVertically && ' '}
            {canNavigateVertically && '↑ ↓'} {t('map.navigation')}
          </div>
        )}
      </div>
      {!preparedScene && (
        <div
          className={styles.loadState}
          role={loadFailed ? 'alert' : 'status'}
        >
          {loadFailed
            ? t('background.error')
            : progress?.phase === 'images'
              ? t('background.progress', {
                  completed: progress.completed,
                  total: progress.total
                })
              : t(
                  progress?.phase === 'render'
                    ? 'background.restoring'
                    : 'background.loading'
                )}
          {loadFailed && (
            <button
              type="button"
              onClick={() => setRetryCount((value) => value + 1)}
            >
              {t('common.retry')}
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default MapScene
