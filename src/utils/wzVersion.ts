import { RegionType, WzType } from 'type/wz'

const toNumericVersion = (version: string) => {
  if (!/^\d+$/.test(version)) return undefined

  const numericVersion = Number(version)
  return Number.isSafeInteger(numericVersion) ? numericVersion : undefined
}

export const getReadyWzVersions = (versions: WzType[], region: RegionType) =>
  versions
    .flatMap((version) => {
      const numericVersion = toNumericVersion(version.mapleVersionId)

      if (
        version.region !== region ||
        !version.isReady ||
        !version.hasImages ||
        numericVersion === undefined
      ) {
        return []
      }

      return [{ ...version, numericVersion }]
    })
    .sort((a, b) => a.numericVersion - b.numericVersion)

export const getLatestReadyWzVersion = (
  versions: WzType[],
  region: RegionType
) => getReadyWzVersions(versions, region).at(-1)
