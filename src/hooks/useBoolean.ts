import { useCallback, useState } from 'react'

type UseBooleanReturn = [
  boolean,
  {
    setTrue: () => void
    setFalse: () => void
    toggle: () => void
  }
]

const useBoolean = (initialState: boolean = false): UseBooleanReturn => {
  const [value, setValue] = useState<boolean>(initialState)

  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  const toggle = useCallback(() => setValue((prev) => !prev), [])

  return [value, { setTrue, setFalse, toggle }]
}

export default useBoolean
