import { describe, expect, test } from 'bun:test'
import { WzType } from '../src/type/wz'
import {
  getLatestReadyWzVersion,
  getReadyWzVersions
} from '../src/utils/wzVersion'

const versions: WzType[] = [
  { region: 'KMS', mapleVersionId: '389', isReady: true, hasImages: true },
  { region: 'KMS', mapleVersionId: '390', isReady: false, hasImages: true },
  { region: 'KMS', mapleVersionId: '388', isReady: true, hasImages: true },
  {
    region: 'KMS',
    mapleVersionId: '390Preview',
    isReady: true,
    hasImages: true
  },
  { region: 'KMST', mapleVersionId: '1169', isReady: true, hasImages: true },
  { region: 'KMST', mapleVersionId: '1170', isReady: true, hasImages: true },
  { region: 'GMS', mapleVersionId: '400', isReady: true, hasImages: true }
]

describe('wz version selection', () => {
  test('사용 가능한 숫자 버전만 오름차순으로 반환한다', () => {
    expect(
      getReadyWzVersions(versions, 'KMS').map(
        (version) => version.numericVersion
      )
    ).toEqual([388, 389])
  })

  test('응답 순서가 아니라 숫자 최댓값을 최신 버전으로 선택한다', () => {
    expect(getLatestReadyWzVersion(versions, 'KMS')?.numericVersion).toBe(389)
  })

  test('테스트 서버 버전은 KMS와 분리해 선택한다', () => {
    expect(
      getReadyWzVersions(versions, 'KMST').map(
        (version) => version.numericVersion
      )
    ).toEqual([1169, 1170])
  })
})
