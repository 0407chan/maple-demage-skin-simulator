import { useGetWzVersion } from 'api/damage-skin'
import { useI18n } from 'i18n'
import {
  getLocalizedContentRegion,
  getLocalizedContentVersion
} from 'i18n/gameContent'

export const useLocalizedGameContent = () => {
  const { locale, localeTag } = useI18n()
  const { data: versions, isLoading } = useGetWzVersion()

  return {
    locale,
    localeTag,
    region: getLocalizedContentRegion(locale),
    version: getLocalizedContentVersion(versions, locale),
    isLoading
  }
}
