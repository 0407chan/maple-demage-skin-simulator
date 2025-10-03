import { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { wzVersionState } from 'atoms/wzVersion'

interface ImageDimensions {
  criticalHeight: number
  normalHeight: number
}

// API로부터 base64 이미지를 가져오는 함수
const fetchBase64Image = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return `data:image/png;base64,${data.value}`
  } catch (error) {
    console.error('Failed to fetch image:', error)
    return ''
  }
}

export const useImageLoader = (skinNumber: number): ImageDimensions => {
  const wzVersion = useRecoilValue(wzVersionState)
  const [dimensions, setDimensions] = useState<ImageDimensions>({
    criticalHeight: 60, // 기본값 설정
    normalHeight: 50
  })

  useEffect(() => {
    // wzVersion이 없으면 실행 안 함
    if (!wzVersion.version || !wzVersion.region) {
      return
    }

    const criImg: HTMLImageElement = new Image()
    const normalImg: HTMLImageElement = new Image()

    const criUrl = `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${skinNumber}/NoCri1/1`
    const normalUrl = `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${skinNumber}/NoRed1/1`

    let criLoaded = false
    let normalLoaded = false

    fetchBase64Image(criUrl).then((base64) => {
      if (base64) {
        criImg.src = base64
        criImg.onload = () => {
          criLoaded = true
          if (normalLoaded) {
            setDimensions({
              criticalHeight: criImg.height - 10,
              normalHeight: normalImg.height - 5
            })
          }
        }
      }
    })

    fetchBase64Image(normalUrl).then((base64) => {
      if (base64) {
        normalImg.src = base64
        normalImg.onload = () => {
          normalLoaded = true
          if (criLoaded) {
            setDimensions({
              criticalHeight: criImg.height - 10,
              normalHeight: normalImg.height - 5
            })
          }
        }
      }
    })

    return () => {
      criImg.onload = null
      normalImg.onload = null
    }
  }, [skinNumber, wzVersion])

  return dimensions
}
