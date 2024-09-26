import { useEffect, useState } from 'react'

interface ImageDimensions {
  criticalHeight: number
  normalHeight: number
}

export const useImageLoader = (skinNumber: number): ImageDimensions => {
  const [dimensions, setDimensions] = useState<ImageDimensions>({
    criticalHeight: 0,
    normalHeight: 0
  })

  useEffect(() => {
    const criImg: HTMLImageElement = new Image()
    const normalImg: HTMLImageElement = new Image()

    criImg.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoCri1-1.png`
    normalImg.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoRed1-1.png`

    const loadHandler = () => {
      setDimensions({
        criticalHeight: criImg.height - 10,
        normalHeight: normalImg.height - 5
      })
    }

    criImg.onload = loadHandler
    normalImg.onload = loadHandler

    return () => {
      criImg.onload = null
      normalImg.onload = null
    }
  }, [skinNumber])

  return dimensions
}
