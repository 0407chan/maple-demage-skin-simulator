import { atom } from 'recoil'
import { RegionType } from 'type/damage-skin'

export const wzVersionState = atom({
  key: 'wzVersionState',
  default: {
    version: 356,
    region: 'KMST' as RegionType
  }
})
