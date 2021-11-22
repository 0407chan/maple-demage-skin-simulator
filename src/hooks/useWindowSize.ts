import { useEffect, useState } from 'react'

type WindowSize = {
  width?: number
  height?: number
}

const useWindowSize = () => {
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
    return windowSize.width && windowSize.width <= 1000
  }

  return {
    windowSize,
    isMobile
  }
}

export default useWindowSize
