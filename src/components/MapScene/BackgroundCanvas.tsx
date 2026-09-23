import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react'
import {
  getMapBackgroundPosition,
  getMapBackgroundTiling,
  hasMapBackgroundScroll
} from 'utils/mapBackground'
import type { MapBackgroundLayer, MapSceneLayout } from 'utils/mapScene'
import styles from './style.module.scss'

export type BackgroundCanvasHandle = { draw: () => void }

type Props = {
  layers: MapBackgroundLayer[]
  layout: MapSceneLayout
  width: number
  height: number
  foregroundTop: number
  cameraXRef: React.RefObject<number>
  cameraYRef: React.RefObject<number>
  front?: boolean
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const timeout = window.setTimeout(() => {
      image.onload = null
      image.onerror = null
      image.src = ''
      reject(new Error(`Background image timed out: ${src}`))
    }, 20000)
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      clearTimeout(timeout)
      resolve(image)
    }
    image.onerror = () => {
      clearTimeout(timeout)
      reject(new Error(`Background image failed: ${src}`))
    }
    image.src = src
  })

// Build a repeating cell without resizing the artwork. A larger cx/cy leaves
// a transparent gap; a smaller one composites the overlapping neighbouring tiles.
const createPattern = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  layer: MapBackgroundLayer
) => {
  const frame = layer.sequence.frames[0]
  const tiling = getMapBackgroundTiling(layer, frame)
  if (
    !layer.flip &&
    tiling.width === frame.width &&
    tiling.height === frame.height
  ) {
    return context.createPattern(image, tiling.repeat)
  }
  const cell = document.createElement('canvas')
  cell.width = tiling.width
  cell.height = tiling.height
  const ctx = cell.getContext('2d')
  if (!ctx) return null
  const startX = -Math.floor((frame.width - 1) / cell.width) * cell.width
  const startY = -Math.floor((frame.height - 1) / cell.height) * cell.height
  for (let y = startY; y <= 0; y += cell.height) {
    for (let x = startX; x <= 0; x += cell.width) {
      ctx.save()
      ctx.translate(x + (layer.flip ? frame.width : 0), y)
      if (layer.flip) ctx.scale(-1, 1)
      ctx.drawImage(image, 0, 0)
      ctx.restore()
    }
  }
  return context.createPattern(cell, tiling.repeat)
}

const BackgroundCanvas = forwardRef<BackgroundCanvasHandle, Props>(
  (
    {
      layers,
      layout,
      width,
      height,
      foregroundTop,
      cameraXRef,
      cameraYRef,
      front
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawRef = useRef<() => void>(() => {})
    const elapsedRef = useRef(0)
    useImperativeHandle(ref, () => ({ draw: () => drawRef.current() }), [])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas || width <= 0 || height <= 0) return
      const context = canvas.getContext('2d')
      if (!context) return
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.imageSmoothingEnabled = false
      let active = true
      let frameId: number | undefined
      let lastTime: number | undefined
      const motionPreference = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      )
      const prepared = new Map<
        number,
        { layer: MapBackgroundLayer; pattern: CanvasPattern }
      >()
      const hasAutoScroll = layers.some(hasMapBackgroundScroll)

      const draw = () => {
        if (!active || document.hidden) return
        context.clearRect(0, 0, width, height)
        for (const { layer, pattern } of [...prepared.values()].sort(
          (a, b) => a.layer.index - b.layer.index
        )) {
          const position = getMapBackgroundPosition(
            layer,
            layer.sequence.frames[0],
            layout,
            {
              width,
              height,
              foregroundTop,
              cameraX: cameraXRef.current,
              cameraY: cameraYRef.current,
              elapsedMs: elapsedRef.current
            }
          )
          context.save()
          context.globalAlpha = layer.alpha
          context.translate(position.x, position.y)
          context.fillStyle = pattern
          context.fillRect(-position.x, -position.y, width, height)
          context.restore()
        }
      }
      drawRef.current = draw

      const tick = (time: number) => {
        if (!active) return
        if (lastTime !== undefined)
          elapsedRef.current += Math.min(time - lastTime, 100)
        lastTime = time
        draw()
        frameId = requestAnimationFrame(tick)
      }
      const updateAnimation = () => {
        if (frameId !== undefined) cancelAnimationFrame(frameId)
        frameId = undefined
        lastTime = undefined
        draw()
        if (hasAutoScroll && !document.hidden && !motionPreference.matches) {
          frameId = requestAnimationFrame(tick)
        }
      }
      document.addEventListener('visibilitychange', updateAnimation)
      motionPreference.addEventListener('change', updateAnimation)
      updateAnimation()
      for (const layer of layers) {
        const frame = layer.sequence.frames[0]
        if (!frame || frame.width <= 0 || frame.height <= 0) continue
        void loadImage(frame.src)
          .then((image) => {
            if (!active) return
            const pattern = createPattern(context, image, layer)
            if (pattern) prepared.set(layer.index, { layer, pattern })
            draw()
          })
          .catch((error) => {
            if (active) console.warn(error)
          })
      }
      return () => {
        active = false
        drawRef.current = () => {}
        if (frameId !== undefined) cancelAnimationFrame(frameId)
        document.removeEventListener('visibilitychange', updateAnimation)
        motionPreference.removeEventListener('change', updateAnimation)
      }
    }, [layers, layout, width, height, foregroundTop, cameraXRef, cameraYRef])

    return (
      <canvas
        ref={canvasRef}
        className={styles.backgroundCanvas}
        aria-hidden="true"
        data-map-background-front={front ? 'true' : 'false'}
        data-map-background-count={layers.length}
      />
    )
  }
)

export default BackgroundCanvas
