import React, { useEffect, useMemo, useState } from 'react'
import {
  getWzAnimationPlayback,
  getWzSequenceBounds,
  loadWzImageSequence,
  WzImageSequence
} from 'utils/wzImageAnimation'

type Props = {
  apiUrl: string
  animationStart: number
  anchored?: boolean
  style?: React.CSSProperties
}

const WzImage: React.FC<Props> = ({
  apiUrl,
  animationStart,
  anchored = false,
  style
}) => {
  const [sequence, setSequence] = useState<WzImageSequence>()
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    let active = true
    setSequence(undefined)
    setFrameIndex(0)

    void loadWzImageSequence(apiUrl)
      .then((loadedSequence) => {
        if (active) setSequence(loadedSequence)
      })
      .catch(() => {
        if (active) setSequence(undefined)
      })

    return () => {
      active = false
    }
  }, [apiUrl])

  useEffect(() => {
    if (!sequence?.animated || sequence.frames.length <= 1) return

    let timer: number | undefined
    let active = true

    const updateFrame = () => {
      if (!active) return

      const playback = getWzAnimationPlayback(
        sequence.frames,
        performance.now() - animationStart,
        sequence.loop
      )
      setFrameIndex(playback.index)

      if (!playback.finished && Number.isFinite(playback.remaining)) {
        timer = window.setTimeout(updateFrame, playback.remaining)
      }
    }

    updateFrame()

    return () => {
      active = false
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [animationStart, sequence])

  const bounds = useMemo(
    () => (sequence ? getWzSequenceBounds(sequence) : undefined),
    [sequence]
  )

  if (!sequence || !bounds) return null

  const frame =
    sequence.frames[Math.min(frameIndex, sequence.frames.length - 1)]
  if (!frame) return null

  if (!sequence.animated && !anchored) {
    return (
      <img
        draggable={false}
        alt=""
        aria-hidden="true"
        src={frame.src}
        style={style}
      />
    )
  }

  if (anchored) {
    return (
      <span
        aria-hidden="true"
        data-wz-animated={sequence.animated ? 'true' : undefined}
        style={{
          ...style,
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none'
        }}
      >
        <img
          draggable={false}
          alt=""
          src={frame.src}
          style={{
            position: 'absolute',
            left: -frame.origin.x,
            top: -frame.origin.y,
            width: frame.width || undefined,
            height: frame.height || undefined,
            maxWidth: 'none'
          }}
        />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      data-wz-animated="true"
      style={{
        ...style,
        display: 'inline-block',
        position: 'relative',
        flex: '0 0 auto',
        width: bounds.width,
        height: bounds.height
      }}
    >
      <img
        draggable={false}
        alt=""
        src={frame.src}
        style={{
          position: 'absolute',
          left: -frame.origin.x - bounds.left,
          top: -frame.origin.y - bounds.top,
          width: frame.width || undefined,
          height: frame.height || undefined,
          maxWidth: 'none'
        }}
      />
    </span>
  )
}

export default WzImage
