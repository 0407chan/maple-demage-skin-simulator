export type SkinType = 'NoCri0' | 'NoCri1' | 'NoRed0' | 'NoRed1'
export type GetDemageSkinQuery = {
  skinId?: number
  skinType: SkinType
  skinNumber: string
}
export type GetDemageSkinResponse = {
  children: string[]
  type: number
  value: string
}
