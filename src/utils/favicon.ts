import { RegionType } from 'type/wz'

const API_BASE_URL = 'https://maplestory.io/api'
const FAVICON_SELECTOR = '#favicon'

export const getDamageSkinFaviconUrl = (
  itemId: number,
  version: number,
  region: RegionType
) => `${API_BASE_URL}/${region}/${version}/item/${itemId}/icon`

export const updateFavicon = (href: string) => {
  let favicon = document.querySelector<HTMLLinkElement>(FAVICON_SELECTOR)

  if (!favicon) {
    favicon = document.createElement('link')
    favicon.id = FAVICON_SELECTOR.slice(1)
    favicon.rel = 'icon'
    document.head.appendChild(favicon)
  }

  favicon.href = href
}
