export type SkinType = 'NoCri0' | 'NoCri1' | 'NoRed0' | 'NoRed1'
export type GetDamageSkinQuery = {
  skinNumber?: number
  skinType: SkinType
  damageNumber: string
}
export type GetDamageSkinResponse = {
  children: string[]
  type: number
  value: string
}

export type DamageType = {
  id: string
  skinNumber: number
  isCritical?: boolean
  damage: number
}
