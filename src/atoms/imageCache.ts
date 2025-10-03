import { atom } from 'recoil'

export const imageCacheState = atom<Record<string, string>>({
  key: 'imageCacheState',
  default: {}
})
