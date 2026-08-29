import { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { wzVersionState } from 'atoms/wzVersion'
import { loadBase64Image } from 'utils/base64ImageCache'

interface ImageDimensions {
  criticalHeight: number
  normalHeight: number
}

const DEFAULT_DIMENSIONS: ImageDimensions = {
  criticalHeight: 60,
  normalHeight: 50
}

const getImageHeight = (src: string) =>
  new Promise<number>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image.height)
    image.onerror = () => reject(new Error('이미지 크기를 읽지 못했습니다.'))
    image.src = src
  })

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

    Promise.all([loadBase64Image(criUrl), loadBase64Image(normalUrl)])
      .then(([criticalImage, normalImage]) =>
        Promise.all([
          getImageHeight(criticalImage),
          getImageHeight(normalImage)
        ])
      )
      .then(([criticalHeight, normalHeight]) => {
        if (cancelled) return
        setDimensions({
          criticalHeight: criticalHeight - 10,
          normalHeight: normalHeight - 5
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
