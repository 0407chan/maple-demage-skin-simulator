export type SkinType = 'NoCri0' | 'NoCri1' | 'NoRed0' | 'NoRed1'
export type GetDamageSkinQuery = {
  skinNumber?: number
  skinType: SkinType
  damageNumber: string
  version: number
}
export type GetDamageSkinResponse = {
  children: string[]
  type: number
  value: string
}

export type DamageWrapperType = {
  id: string
  damageList: DamageType[]
}
export type DamageType = {
  id: string
  skinNumber: number
  level: number
  marginBottom: number
  isCritical?: boolean
  damage: number
}

export type GetItemListQuery = {
  version: number
  startPosition?: number
  count?: number
  overallCategoryFilter?: string
  categoryFilter?: string
  subCategoryFilter?: SubCategory
  jobFilter?: number
  cashFilter?: boolean
  minLevelFilter?: number
  maxLevelFilter?: number
  genderFilter?: number
  searchFor?: string
}

export type ItemDto = {
  desc: string
  id: number
  isCash: boolean
  name: string
  requiredGender: number
  requiredJobs: string[]
  requiredLevel: number
  typeInfo: TypeInfo
}

export type TypeInfo = {
  category: string
  highItemId: number
  lowItemId: number
  overallCategory: string
  subCategory: string
}

export type SubCategory =
  | 'One-Handed Sword'
  | 'Two-Handed Sword'
  | 'Two-Handed Axe'
  | 'Spear'
  | 'Top'
  | 'Bottom'
  | 'Cape'
  | 'Glove'
  | 'Hat'
  | 'Overall'
  | 'Shield'
  | 'Shoes'
  | 'Belt'
  | 'Earrings'
  | 'Emblem'
  | 'Eye Decoration'
  | 'Face Accessory'
  | 'Pendant'
  | 'Ring'
  | 'Shoulder Accessory'
  | 'Staff'
  | 'Pocket Item'
  | 'Katara'
  | 'Other'
