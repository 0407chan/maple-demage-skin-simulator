import manifestJson from 'generated/actionDamageSkinManifest.json'

export type PrebuiltActionSkinAsset = {
  path: string
  width: number
  height: number
  origin: {
    x: number
    y: number
  }
  animated: boolean
  frameCount: number
  duration?: number
}

type ActionDamageSkinManifest = {
  schemaVersion: number
  region: string
  wzVersion: number
  assets: Record<string, PrebuiltActionSkinAsset>
}

const manifest = manifestJson as ActionDamageSkinManifest
const WZ_DAMAGE_SKIN_URL =
  /\/api\/wz\/([^/]+)\/([^/]+)\/Effect\/DamageSkin\.img\/(\d+)\/(.+)$/

export const getPrebuiltActionSkinAsset = (apiUrl: string) => {
  const match = apiUrl.match(WZ_DAMAGE_SKIN_URL)
  if (!match) return undefined

  // 같은 지역의 기존 스킨은 API 버전이 올라가도 배포한 원본 버전을 사용한다.
  const [, region, , skinIndex, nodePath] = match
  return manifest.assets[
    `${region}/${manifest.wzVersion}/${skinIndex}/${nodePath}`
  ]
}

export const getPrebuiltActionSkinManifest = () => manifest

// 묶음에 실제로 존재하는 노드만 준비한다. 일반형 액션 스킨에는 유닛 문자가 없다.
export const getPrebuiltActionSkinUrls = (baseUrl: string) => {
  const skinMatch = `${baseUrl}/NoCri0/0`.match(WZ_DAMAGE_SKIN_URL)
  if (!skinMatch) return undefined
  const [, region, , skinIndex] = skinMatch
  const prefix = `${region}/${manifest.wzVersion}/${skinIndex}/`
  const keys = Object.keys(manifest.assets).filter((key) =>
    key.startsWith(prefix)
  )
  return keys.length > 0
    ? keys.map((key) => `${baseUrl}/${key.slice(prefix.length)}`)
    : undefined
}
