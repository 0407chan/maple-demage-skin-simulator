import { useEffect, useState } from 'react'

type WindowSize = {
  width?: number
  height?: number
}

const useWindowSize = (): {
  windowSize: WindowSize
  isMobile: () => boolean
} => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = () => {
    if (windowSize.width === undefined) return false
    return windowSize.width <= 500
  }

  return {
    windowSize,
    isMobile
  }
}

export default useWindowSize
