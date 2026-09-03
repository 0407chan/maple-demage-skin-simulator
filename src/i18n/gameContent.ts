import { Locale } from 'i18n'
import { RegionType, WzType } from 'type/wz'
import { getLatestReadyWzVersion } from 'utils/wzVersion'

const contentRegions: Record<Locale, RegionType> = {
  ko: 'KMS',
  en: 'GMS',
  ja: 'JMS',
  'zh-CN': 'CMS',
  'zh-TW': 'TWMS'
}

export const getLocalizedContentRegion = (locale: Locale) =>
  contentRegions[locale]

export const getLocalizedContentVersion = (
  versions: WzType[] | undefined,
  locale: Locale
) => {
  if (!versions) return undefined

  return getLatestReadyWzVersion(versions, getLocalizedContentRegion(locale))
    ?.numericVersion
}
