export type RegionType =
  | 'EMS'
  | 'KMST'
  | 'GMS'
  | 'THMS'
  | 'TWMS'
  | 'CMS'
  | 'KMS'
  | 'TMS'
  | 'CMST'
  | 'SEA'
  | 'JMS'
export type WzType = {
  hasImages: boolean
  isReady: boolean
  mapleVersionId: string
  region: RegionType
}
