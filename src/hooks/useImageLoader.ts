import { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { wzVersionState } from 'atoms/wzVersion'
import {
  getWzSequenceBounds,
  loadWzImageSequence
} from 'utils/wzImageAnimation'

interface ImageDimensions {
  criticalHeight: number
  normalHeight: number
}

const DEFAULT_DIMENSIONS: ImageDimensions = {
  criticalHeight: 60,
  normalHeight: 50
}

export const useImageLoader = (skinNumber: number): ImageDimensions => {
  const wzVersion = useRecoilValue(wzVersionState)
  const [dimensions, setDimensions] =
    useState<ImageDimensions>(DEFAULT_DIMENSIONS)

  useEffect(() => {
    // wzVersion이 없으면 실행 안 함
    if (!wzVersion.version || !wzVersion.region) {
      return
    }

    const criUrl = `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${skinNumber}/NoCri1/1`
    const normalUrl = `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${skinNumber}/NoRed1/1`

    let cancelled = false
    setDimensions(DEFAULT_DIMENSIONS)

    Promise.all([loadWzImageSequence(criUrl), loadWzImageSequence(normalUrl)])
      .then(([criticalSequence, normalSequence]) => {
        if (cancelled) return
        const criticalHeight = getWzSequenceBounds(criticalSequence).height
        const normalHeight = getWzSequenceBounds(normalSequence).height
        setDimensions({
          criticalHeight: Math.max(1, criticalHeight - 10),
          normalHeight: Math.max(1, normalHeight - 5)
        })
      })
      .catch(() => {
        if (!cancelled) setDimensions(DEFAULT_DIMENSIONS)
      })

    return () => {
      cancelled = true
    }
  }, [skinNumber, wzVersion.region, wzVersion.version])

  return dimensions
}
