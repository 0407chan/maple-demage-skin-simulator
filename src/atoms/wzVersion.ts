import { atom } from 'recoil'
import { RegionType } from 'type/damage-skin'

export const wzVersionState = atom<{
  version?: number
  region?: RegionType
}>({
  key: 'wzVersionState',
  default: {}
})
