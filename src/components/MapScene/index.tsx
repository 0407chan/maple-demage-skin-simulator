import { getMapRenderUrl } from 'api/map'
import React, { useEffect, useMemo, useState } from 'react'
import type { RegionType } from 'type/wz'
import {
  getImageEdgeColors,
  getMapBackgroundRepeat,
  loadMapBaseBackground,
  measureMapGround
} from 'utils/mapScene'
import type { MapBaseBackground, MapGroundMetrics } from 'utils/mapScene'
import styles from './style.module.scss'

type Props = {
  mapId: number
  monsterFootY?: number
  region: RegionType
  version: number
}

const MapScene: React.FC<Props> = ({
  mapId,
  monsterFootY,
  region,
  version
}) => {
  const [baseBackground, setBaseBackground] = useState<MapBaseBackground>()
  const [groundMetrics, setGroundMetrics] = useState<MapGroundMetrics>()
  const [baseColors, setBaseColors] = useState<{
    bottom?: string
    top?: string
  }>()
  const foregroundUrl = useMemo(
    () => getMapRenderUrl(mapId, version, region),
    [mapId, region, version]
  )

  useEffect(() => {
    let active = true
    setBaseBackground(undefined)
    setBaseColors(undefined)

    void loadMapBaseBackground(mapId, version, region)
      .then((background) => {
        if (!active) return
        setBaseBackground(background)

        if (background) {
          void getImageEdgeColors(background.src).then((colors) => {
            if (active) setBaseColors(colors)
          })
        }
      })
      .catch((error) => {
        console.warn('맵 배경 레이어를 준비하지 못했습니다.', error)
      })

    return () => {
      active = false
    }
  }, [mapId, region, version])

  useEffect(() => {
    let active = true
    setGroundMetrics(undefined)

    void measureMapGround(foregroundUrl)
      .then((metrics) => {
        if (active) setGroundMetrics(metrics)
      })
      .catch((error) => {
        console.warn('맵 발판 위치를 준비하지 못했습니다.', error)
      })

    return () => {
      active = false
    }
  }, [foregroundUrl])

  const foregroundTop =
    monsterFootY !== undefined && groundMetrics
      ? monsterFootY - groundMetrics.groundY
      : undefined
  const baseTop =
    monsterFootY !== undefined && baseBackground
      ? monsterFootY - baseBackground.height
      : undefined
  const baseLeft = `${(baseBackground?.x ?? 0) - (baseBackground?.origin.x ?? 0)}px`
  const baseRepeat = baseBackground
    ? getMapBackgroundRepeat(baseBackground.type)
    : 'no-repeat'
  const needsVerticalFill = !['repeat', 'repeat-y'].includes(baseRepeat)

  return (
    <div className={styles.scene} aria-hidden="true">
      {baseBackground && (
        <>
          <div
            className={styles.baseBackground}
            style={{
              backgroundColor: needsVerticalFill
                ? baseColors?.bottom
                : undefined,
              backgroundImage: `url("${baseBackground.src}")`,
              backgroundPosition: `${baseLeft} ${baseTop ?? 0}px`,
              backgroundRepeat: baseRepeat,
              backgroundSize: `${baseBackground.width}px ${baseBackground.height}px`,
              opacity: baseBackground.alpha,
              transform: baseBackground.flip ? 'scaleX(-1)' : undefined
            }}
          />
          {needsVerticalFill && baseColors?.top && (baseTop ?? 0) > 0 && (
            <div
              className={styles.baseTopFill}
              style={{
                backgroundColor: baseColors.top,
                height: `${baseTop}px`,
                opacity: baseBackground.alpha
              }}
            />
          )}
        </>
      )}
      <img
        className={styles.foreground}
        crossOrigin="anonymous"
        data-map-ground-y={
          monsterFootY !== undefined ? Math.round(monsterFootY) : undefined
        }
        draggable="false"
        src={foregroundUrl}
        style={{
          top: foregroundTop === undefined ? '50%' : `${foregroundTop}px`,
          transform:
            foregroundTop === undefined
              ? 'translate(-50%, -50%)'
              : 'translateX(-50%)'
        }}
        alt=""
      />
    </div>
  )
}

export default MapScene
