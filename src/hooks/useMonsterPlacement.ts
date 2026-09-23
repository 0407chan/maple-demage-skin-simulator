import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import type React from 'react'
import type { MapleMap } from 'type/map'
import { getCachedImageMetrics } from 'utils/imagePreloader'
import {
  formatMonsterPlacement,
  getMapPointFromScreen,
  getMonsterFootPoint
} from 'utils/monsterPlacement'
import type { PlacementPoint } from 'utils/monsterPlacement'

const ZERO = { x: 0, y: 0 }

export const useMonsterPlacement = ({
  map,
  bodyRef,
  imageRef,
  mapImageRef,
  imageUrl
}: {
  map?: MapleMap
  bodyRef: React.RefObject<HTMLDivElement | null>
  imageRef: React.RefObject<HTMLImageElement | null>
  mapImageRef: React.RefObject<HTMLImageElement | null>
  imageUrl: string
}) => {
  const [editing, setEditing] = useState(false)
  const [baseOffset, setBaseOffset] = useState<{
    mapId: number
    x: number
    y: number
  }>()
  const [offsets, setOffsets] = useState<Record<number, PlacementPoint>>({})
  const [position, setPosition] = useState<{
    map: PlacementPoint
    screen: PlacementPoint
  }>()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle'
  )
  const dragRef = useRef<
    | { pointerId: number; x: number; y: number; offset: PlacementPoint }
    | undefined
  >(undefined)
  const adjustment = map ? (offsets[map.id] ?? ZERO) : ZERO
  const baseX = map && baseOffset?.mapId === map.id ? baseOffset.x : 0
  const baseY = map && baseOffset?.mapId === map.id ? baseOffset.y : 0
  const offset = { x: baseX + adjustment.x, y: baseY + adjustment.y }
  const offsetRef = useRef(offset)
  offsetRef.current = offset

  const setOffset = useCallback(
    (next: PlacementPoint) => {
      if (!map) return
      offsetRef.current = next
      setOffsets((current) => ({
        ...current,
        [map.id]: { x: next.x - baseX, y: next.y - baseY }
      }))
      setCopyState('idle')
    },
    [map?.id, baseX, baseY]
  )

  const setInitialOffset = useCallback(
    ({ x, y }: PlacementPoint) => {
      if (!map) return
      setBaseOffset((current) =>
        current?.mapId === map.id && current.x === x && current.y === y
          ? current
          : { mapId: map.id, x, y }
      )
    },
    [map?.id]
  )

  const measure = useCallback(() => {
    const image = imageRef.current
    const foreground = mapImageRef.current
    const body = bodyRef.current
    const metrics = getCachedImageMetrics(imageUrl)
    if (
      !map ||
      !image ||
      !foreground?.complete ||
      !foreground.naturalWidth ||
      !body ||
      !metrics
    )
      return
    const rect = foreground.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const foot = getMonsterFootPoint(
      image.getBoundingClientRect(),
      metrics,
      image.dataset.monsterFacing === 'right'
    )
    const bodyRect = body.getBoundingClientRect()
    const next = {
      map: getMapPointFromScreen(foot, rect, {
        width: foreground.naturalWidth,
        height: foreground.naturalHeight
      }),
      screen: { x: foot.x - bodyRect.left, y: foot.y - bodyRect.top }
    }
    setPosition(next)
    return next.map
  }, [bodyRef, imageRef, mapImageRef, imageUrl, map?.id])

  useLayoutEffect(() => {
    if (!editing) return
    measure()
    // Re-measure after parent/scene layout effects and local image decoding.
    const frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  }, [editing, offset.x, offset.y, measure])

  useEffect(() => {
    if (!editing) dragRef.current = undefined
  }, [editing])

  useEffect(() => {
    if (!editing) return
    const image = imageRef.current
    const foreground = mapImageRef.current
    let frame: number | undefined
    const measureAfterLayout = () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    window.addEventListener('resize', measureAfterLayout)
    image?.addEventListener('load', measureAfterLayout)
    foreground?.addEventListener('load', measureAfterLayout)
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
      window.removeEventListener('resize', measureAfterLayout)
      image?.removeEventListener('load', measureAfterLayout)
      foreground?.removeEventListener('load', measureAfterLayout)
    }
  }, [editing, measure, imageRef, mapImageRef])

  useEffect(() => {
    dragRef.current = undefined
    setPosition(undefined)
    setCopyState('idle')
    if (!map) setEditing(false)
  }, [map?.id])

  useEffect(() => {
    if (!editing || !map) return
    const move = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]'
        )
      )
        return
      if (
        document.querySelector(
          '[role="dialog"][aria-modal="true"][aria-hidden="false"]'
        )
      )
        return
      const direction = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1]
      }[event.key]
      if (!direction) return
      event.preventDefault()
      const step = event.shiftKey ? 10 : 1
      setOffset({
        x: offsetRef.current.x + direction[0] * step,
        y: offsetRef.current.y + direction[1] * step
      })
    }
    window.addEventListener('keydown', move)
    return () => window.removeEventListener('keydown', move)
  }, [editing, map?.id, setOffset])

  useEffect(() => {
    if (copyState !== 'copied') return
    const timer = window.setTimeout(() => setCopyState('idle'), 2200)
    return () => window.clearTimeout(timer)
  }, [copyState])

  const stopDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragRef.current = undefined
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const copy = async () => {
    const point = measure()
    if (!map || !point) return
    try {
      await navigator.clipboard.writeText(
        formatMonsterPlacement(map.id, map.name, point, getSource())
      )
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }

  const getSource = () => {
    const image = mapImageRef.current
    const region = image?.dataset.mapRegion
    const wzVersion = Number(image?.dataset.mapVersion)
    return image && region && Number.isSafeInteger(wzVersion) && wzVersion > 0
      ? {
          region,
          wzVersion,
          imageWidth: image.naturalWidth,
          imageHeight: image.naturalHeight
        }
      : undefined
  }

  return {
    editing: editing && !!map,
    setEditing,
    offset,
    offsetRef,
    setInitialOffset,
    position,
    copyState,
    copy,
    copyText:
      map && position
        ? formatMonsterPlacement(map.id, map.name, position.map, getSource())
        : '',
    reset: () => setOffset({ x: baseX, y: baseY }),
    pointerHandlers: {
      onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!editing || event.button !== 0) return
        event.preventDefault()
        dragRef.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          offset: offsetRef.current
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => {
        const drag = dragRef.current
        if (!drag || drag.pointerId !== event.pointerId) return
        setOffset({
          x: drag.offset.x + event.clientX - drag.x,
          y: drag.offset.y + event.clientY - drag.y
        })
      },
      onPointerUp: stopDrag,
      onPointerCancel: stopDrag,
      onLostPointerCapture: () => {
        dragRef.current = undefined
      }
    }
  }
}
