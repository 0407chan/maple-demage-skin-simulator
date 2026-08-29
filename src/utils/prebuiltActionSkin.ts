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

  const [, region, version, skinIndex, nodePath] = match
  return manifest.assets[`${region}/${version}/${skinIndex}/${nodePath}`]
}

export const getPrebuiltActionSkinManifest = () => manifest
