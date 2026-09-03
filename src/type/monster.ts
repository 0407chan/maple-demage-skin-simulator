import { RegionType } from 'type/wz'

export type Monster = {
  id: number
  name: string
  mobType: string
  level: number
  isBoss: boolean
}

export type MonsterDetail = {
  id: number
  name: string
  description?: string
  framebooks: Record<string, number>
  meta?: {
    level?: number
    isBoss?: boolean
  }
}

export type GetMonsterListQuery = {
  version?: number
  region?: RegionType
  startPosition?: number
  count?: number
  minLevelFilter?: number
  maxLevelFilter?: number
  searchFor?: string
}
