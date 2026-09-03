import { atom } from 'recoil'
import { RegionType } from 'type/wz'

export const wzVersionState = atom<{
  version?: number
  region?: RegionType
}>({
  key: 'wzVersionState',
  default: {}
})
