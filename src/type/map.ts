import { RegionType } from './wz'

export type MapleMap = {
  id: number
  name: string
  streetName: string
}

export type GetMapListQuery = {
  region?: RegionType
  version?: number
  startPosition?: number
  count?: number
  searchFor?: string
}
