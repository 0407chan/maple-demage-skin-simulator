import { RegionType } from './wz'

export type MapleMap = {
  id: number
  name: string
  streetName: string
}

export type MapleMapBounds = {
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
  x: number
  y: number
}

export type MapleMapMiniMap = {
  centerX: number
  centerY: number
  height: number
  width: number
}

export type MapleMapDetail = MapleMap & {
  miniMap?: MapleMapMiniMap
  vrBounds?: MapleMapBounds
}

export type GetMapListQuery = {
  region?: RegionType
  version?: number
  startPosition?: number
  count?: number
  searchFor?: string
}
