export type SkinType = 'NoCri0' | 'NoCri1' | 'NoRed0' | 'NoRed1'
export type GetDamageSkinQuery = {
  skinId?: number
  skinType: SkinType
  skinNumber: string
}
export type GetDamageSkinResponse = {
  children: string[]
  type: number
  value: string
}
