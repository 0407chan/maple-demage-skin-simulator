import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDamageSkinAll,
  getDamageSkinMetadata,
  getItemList,
  useGetDamageSkinAll,
  useGetItemList,
  useGetWzVersion
} from 'api/damage-skin'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  ConfigProvider,
  Empty,
  List,
  Radio,
  Segmented,
  Select,
  Skeleton,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
  theme
} from 'antd'
import { SkinMap } from 'constants/damageSkinMapper'
import React, { useEffect, useMemo, useState } from 'react'
import { ItemDto, RegionType } from 'type/damage-skin'
import { loadBase64Image } from 'utils/base64ImageCache'
import { getReadyWzVersions } from 'utils/wzVersion'
import {
  buildMappingCandidates,
  buildMappingVersionSet,
  getMappedSkinIndicesByName,
  getSelectableSkinIndices,
  getUnmappedVersionEntries,
  getVersionDelta,
  isDirectDamageSkinItem,
  MappingCandidate
} from './mappingCandidates'
import styles from './style.module.scss'

const { Title, Text, Paragraph } = Typography
const REVIEW_STORAGE_PREFIX = 'damage-skin-mapping-review-v1'
const MAPPING_REGION: RegionType = 'KMST'
const MAPPING_SCAN_START_VERSION = 1134
const VERSION_SCAN_CONCURRENCY = 3

const mapWithConcurrency = async <T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<R>
) => {
  const results = new Array<R>(values.length)
  let nextIndex = 0

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (nextIndex < values.length) {
        const index = nextIndex
        nextIndex += 1
        results[index] = await worker(values[index])
      }
    })
  )

  return results
}

type MappingItem = {
  itemId: number
  skinIndices: string[]
  source: 'review' | 'manual'
}

type ReviewDecision = 'pending' | 'approved' | 'rejected'

type SavedReview = {
  decisions: Record<string, ReviewDecision>
  selections: Record<string, string>
}

type SkinMapSyncResponse = {
  path: string
  addedItemIds: number[]
  updatedItemIds: number[]
  unchangedItemIds: number[]
  message?: string
}

const isSameSkinIndices = (left: number[] | undefined, right: number[]) =>
  left !== undefined &&
  left.length === right.length &&
  left.every((value, index) => value === right[index])

const getCandidateSkinIndices = (
  candidate: MappingCandidate,
  selectedSkin: string | undefined
) => {
  if (!selectedSkin) return []
  if (
    candidate.inheritedSkinIndices?.length &&
    selectedSkin === candidate.recommendedSkinIndex
  ) {
    return candidate.inheritedSkinIndices
  }
  return [selectedSkin]
}

const syncMappingsToSkinMap = async (mappings: MappingItem[]) => {
  const response = await fetch('/__mapping-tool/skin-map', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mappings: mappings.map(({ itemId, skinIndices }) => ({
        itemId,
        skinIndices: skinIndices.map(Number)
      }))
    })
  })
  const result = (await response
    .json()
    .catch(() => ({}))) as Partial<SkinMapSyncResponse>

  if (!response.ok) {
    throw new Error(result.message ?? 'SkinMap을 갱신하지 못했습니다.')
  }

  return {
    path: result.path ?? 'src/constants/damageSkinMapper.ts',
    addedItemIds: result.addedItemIds ?? [],
    updatedItemIds: result.updatedItemIds ?? [],
    unchangedItemIds: result.unchangedItemIds ?? []
  }
}

const ImageWithBase64: React.FC<{
  url: string
  fallbackUrl?: string
  alt?: string
  className?: string
}> = ({ url, fallbackUrl, alt = '', className }) => {
  const [imageSrc, setImageSrc] = useState('')

  useEffect(() => {
    let active = true
    setImageSrc('')

    const imageRequest = loadBase64Image(url).catch((error) => {
      if (!fallbackUrl) throw error
      return loadBase64Image(fallbackUrl)
    })

    void imageRequest
      .then((image) => {
        if (active) setImageSrc(image)
      })
      .catch(() => {
        if (active) setImageSrc('')
      })

    return () => {
      active = false
    }
  }, [fallbackUrl, url])

  if (!imageSrc) return null

  return <img src={imageSrc} alt={alt} className={className} />
}

const SkinPreview: React.FC<{
  index: string
  version: number
  region: string
  isUnit?: boolean
  compact?: boolean
}> = ({ index, version, region, isUnit, compact = false }) => {
  const baseUrl = `https://maplestory.io/api/wz/${region}/${version}/Effect/DamageSkin.img/${index}`
  const normalUrls = ['NoRed0/7', 'NoRed1/7', 'NoCri0/7', 'NoCri1/7']
  const unitUrls = ['NoCustom/NoCri0/3', 'NoCustom/NoCri0/4']

  return (
    <div
      className={`${styles.skinPreview} ${compact ? styles.compactSkinPreview : ''}`}
      aria-label={`스킨 인덱스 ${index} 미리보기`}
    >
      {normalUrls.map((path) => (
        <ImageWithBase64
          key={path}
          url={`${baseUrl}/${path}/0`}
          fallbackUrl={`${baseUrl}/${path}`}
        />
      ))}
      {isUnit &&
        unitUrls.map((path) => (
          <ImageWithBase64
            key={path}
            url={`${baseUrl}/${path}/0`}
            fallbackUrl={`${baseUrl}/${path}`}
          />
        ))}
    </div>
  )
}

const getConfidenceMeta = (candidate: MappingCandidate) => {
  if (candidate.confidence === 'high') {
    return { color: 'green', label: '높은 신뢰도' }
  }
  if (candidate.confidence === 'medium') {
    return { color: 'gold', label: '순서 기반 추천' }
  }
  return { color: 'default', label: '직접 선택 필요' }
}

export const MappingTool: React.FC = () => {
  const [messageApi, messageContext] = message.useMessage()
  const queryClient = useQueryClient()
  const { data: wzVersions = [] } = useGetWzVersion()
  const region = MAPPING_REGION
  const readyVersions = useMemo(
    () => getReadyWzVersions(wzVersions, MAPPING_REGION),
    [wzVersions]
  )
  const latestVersion = readyVersions.at(-1)?.numericVersion
  const [reviewVersion, setReviewVersion] = useState<number>()
  const [baselineVersion, setBaselineVersion] = useState<number>()

  const scanVersions = useMemo(
    () =>
      readyVersions
        .filter(
          (version) => version.numericVersion >= MAPPING_SCAN_START_VERSION
        )
        .map((version) => version.numericVersion),
    [readyVersions]
  )
  const versionScanQuery = useQuery({
    queryKey: ['mappingVersionScan', region, scanVersions],
    queryFn: () =>
      mapWithConcurrency(
        scanVersions,
        VERSION_SCAN_CONCURRENCY,
        async (version) => {
          const itemQuery = { searchFor: '데미지 스킨', version, region }

          try {
            const [items, skinData] = await Promise.all([
              queryClient.fetchQuery({
                queryKey: ['getItemList', itemQuery],
                queryFn: () => getItemList(itemQuery),
                staleTime: Infinity,
                retry: 2,
                retryDelay: 500
              }),
              queryClient.fetchQuery({
                queryKey: ['getDamageSkinAll', version, region],
                queryFn: () => getDamageSkinAll(version, region),
                staleTime: Infinity,
                retry: 2,
                retryDelay: 500
              })
            ])

            return { version, items, skinIndices: skinData.children }
          } catch {
            return { version, items: undefined, skinIndices: undefined }
          }
        }
      ),
    enabled: scanVersions.length > 1,
    staleTime: Infinity
  })
  const versionScanSnapshots = versionScanQuery.data ?? []
  const pendingVersionSets = versionScanSnapshots
    .slice(1)
    .flatMap((reviewSnapshot, index) => {
      const baselineSnapshot = versionScanSnapshots[index]
      if (
        !baselineSnapshot.items ||
        !reviewSnapshot.items ||
        !baselineSnapshot.skinIndices ||
        !reviewSnapshot.skinIndices
      ) {
        return []
      }

      const versionSet = buildMappingVersionSet(
        {
          version: baselineSnapshot.version,
          items: baselineSnapshot.items,
          skinIndices: baselineSnapshot.skinIndices
        },
        {
          version: reviewSnapshot.version,
          items: reviewSnapshot.items,
          skinIndices: reviewSnapshot.skinIndices
        },
        SkinMap
      )
      return versionSet.candidateCount > 0 ? [versionSet] : []
    })
    .reverse()
  const isVersionScanLoading = versionScanQuery.isPending
  const hasVersionScanError =
    versionScanQuery.isError ||
    versionScanSnapshots.some(
      (snapshot) => !snapshot.items || !snapshot.skinIndices
    )
  const failedScanVersions = versionScanSnapshots
    .filter((snapshot) => !snapshot.items || !snapshot.skinIndices)
    .map((snapshot) => snapshot.version)

  useEffect(() => {
    if (readyVersions.length < 2) return

    const defaultReviewVersion = readyVersions.some(
      (version) => version.numericVersion === latestVersion
    )
      ? latestVersion
      : readyVersions.at(-1)?.numericVersion

    setReviewVersion((previous) =>
      previous && readyVersions.some((item) => item.numericVersion === previous)
        ? previous
        : defaultReviewVersion
    )
  }, [latestVersion, readyVersions])

  useEffect(() => {
    if (!reviewVersion) return

    const reviewIndex = readyVersions.findIndex(
      (version) => version.numericVersion === reviewVersion
    )
    const defaultBaseline = readyVersions[reviewIndex - 1]?.numericVersion

    setBaselineVersion((previous) =>
      previous &&
      readyVersions.some(
        (item) => item.numericVersion === previous && previous < reviewVersion
      )
        ? previous
        : defaultBaseline
    )
  }, [readyVersions, reviewVersion])

  const baselineVersionIndex = readyVersions.findIndex(
    (version) => version.numericVersion === baselineVersion
  )
  const reviewVersionIndex = readyVersions.findIndex(
    (version) => version.numericVersion === reviewVersion
  )
  const canShiftToPast = baselineVersionIndex > 0 && reviewVersionIndex > 0
  const canShiftToFuture =
    baselineVersionIndex >= 0 &&
    reviewVersionIndex >= 0 &&
    reviewVersionIndex < readyVersions.length - 1

  const shiftVersionRange = (direction: -1 | 1) => {
    if (!baselineVersion || !reviewVersion) return

    const nextBaseline =
      readyVersions[baselineVersionIndex + direction]?.numericVersion
    const nextReview =
      readyVersions[reviewVersionIndex + direction]?.numericVersion
    if (!nextBaseline || !nextReview) return

    setBaselineVersion(nextBaseline)
    setReviewVersion(nextReview)
  }

  const currentItemQuery = useGetItemList({
    searchFor: '데미지 스킨',
    version: reviewVersion,
    region
  })
  const baselineItemQuery = useGetItemList({
    searchFor: '데미지 스킨',
    version: baselineVersion,
    region
  })
  const currentSkinQuery = useGetDamageSkinAll(reviewVersion, region)
  const baselineSkinQuery = useGetDamageSkinAll(baselineVersion, region)

  const allItems = useMemo(
    () => [...(currentItemQuery.data ?? [])].sort((a, b) => a.id - b.id),
    [currentItemQuery.data]
  )
  const mappedSkinIndicesByName = useMemo(
    () => getMappedSkinIndicesByName(allItems, SkinMap),
    [allItems]
  )
  const baselineItems = baselineItemQuery.data ?? []
  const versionNewItems = useMemo(
    () => getVersionDelta(allItems, baselineItems, (item) => item.id),
    [allItems, baselineItems]
  )
  const versionNewSkinIndices = useMemo(
    () =>
      getVersionDelta(
        currentSkinQuery.data?.children ?? [],
        baselineSkinQuery.data?.children ?? [],
        (index) => index
      ).sort((a, b) => Number(a) - Number(b)),
    [baselineSkinQuery.data?.children, currentSkinQuery.data?.children]
  )
  const unmappedVersionEntries = useMemo(
    () =>
      getUnmappedVersionEntries(
        versionNewItems,
        versionNewSkinIndices,
        SkinMap
      ),
    [versionNewItems, versionNewSkinIndices, SkinMap]
  )
  const newItems = unmappedVersionEntries.items
  const newSkinIndices = unmappedVersionEntries.skinIndices
  const selectableSkinIndices = useMemo(
    () =>
      getSelectableSkinIndices(
        newSkinIndices,
        currentSkinQuery.data?.children ?? [],
        SkinMap
      ),
    [currentSkinQuery.data?.children, newSkinIndices]
  )
  const isUsingExistingSkinIndices = newSkinIndices.length === 0

  const metadataQueries = useQueries({
    queries: newSkinIndices.map((skinIndex) => ({
      queryKey: ['getDamageSkinMetadata', reviewVersion, region, skinIndex],
      queryFn: () => getDamageSkinMetadata(skinIndex, reviewVersion, region),
      enabled: reviewVersion !== undefined
    }))
  })
  const unitStatus = useMemo(
    () =>
      Object.fromEntries(
        newSkinIndices.map((skinIndex, index) => [
          skinIndex,
          metadataQueries[index]?.data
            ? metadataQueries[index].data.children.includes('NoCustom')
            : undefined
        ])
      ) as Record<string, boolean | undefined>,
    [metadataQueries, newSkinIndices]
  )
  const candidates = useMemo(
    () =>
      buildMappingCandidates(
        newItems,
        newSkinIndices,
        unitStatus,
        mappedSkinIndicesByName
      ),
    [mappedSkinIndicesByName, newItems, newSkinIndices, unitStatus]
  )
  const nonDirectNewItems = useMemo(
    () => newItems.filter((item) => !isDirectDamageSkinItem(item)),
    [newItems]
  )

  const reviewKey =
    reviewVersion && baselineVersion
      ? `${REVIEW_STORAGE_PREFIX}:${region}:${baselineVersion}:${reviewVersion}`
      : undefined
  const candidateFingerprint = candidates
    .map(
      (candidate) => `${candidate.id}:${candidate.recommendedSkinIndex ?? ''}`
    )
    .join('|')
  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>({})
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [syncingCandidateIds, setSyncingCandidateIds] = useState<Set<string>>(
    new Set()
  )

  const getSourceApprovedDecisions = (
    candidateSelections: Record<string, string>
  ) =>
    Object.fromEntries(
      candidates.flatMap((candidate) => {
        const skinIndex =
          candidateSelections[candidate.id] ?? candidate.recommendedSkinIndex
        if (!skinIndex) return []

        const requestedIndices = getCandidateSkinIndices(
          candidate,
          skinIndex
        ).map(Number)
        const isSynced = candidate.itemIds.every((itemId) =>
          isSameSkinIndices(SkinMap[itemId], requestedIndices)
        )
        return isSynced ? [[candidate.id, 'approved' as const]] : []
      })
    )

  useEffect(() => {
    if (!reviewKey) return

    const defaultSelections = Object.fromEntries(
      candidates.flatMap((candidate) =>
        candidate.recommendedSkinIndex
          ? [[candidate.id, candidate.recommendedSkinIndex]]
          : []
      )
    )

    try {
      const saved = localStorage.getItem(reviewKey)
      if (!saved) {
        setDecisions(getSourceApprovedDecisions(defaultSelections))
        setSelections(defaultSelections)
        return
      }

      const parsed = JSON.parse(saved) as Partial<SavedReview>
      const nextSelections = {
        ...defaultSelections,
        ...(parsed.selections ?? {})
      }
      const savedDecisions = Object.fromEntries(
        Object.entries(parsed.decisions ?? {}).map(
          ([candidateId, decision]) => [
            candidateId,
            decision === 'approved' ? 'pending' : decision
          ]
        )
      )
      setDecisions({
        ...savedDecisions,
        ...getSourceApprovedDecisions(nextSelections)
      })
      setSelections(nextSelections)
    } catch {
      setDecisions(getSourceApprovedDecisions(defaultSelections))
      setSelections(defaultSelections)
    }
  }, [candidateFingerprint, reviewKey])

  const persistReview = (
    nextDecisions: Record<string, ReviewDecision>,
    nextSelections: Record<string, string>
  ) => {
    if (!reviewKey) return
    localStorage.setItem(
      reviewKey,
      JSON.stringify({ decisions: nextDecisions, selections: nextSelections })
    )
  }

  const updateDecision = async (
    candidate: MappingCandidate,
    decision: ReviewDecision
  ) => {
    const selectedSkin =
      selections[candidate.id] ?? candidate.recommendedSkinIndex
    if (decision === 'approved' && !selectedSkin) {
      messageApi.warning('연결할 스킨 인덱스를 먼저 선택해주세요.')
      return
    }

    if (decision !== 'approved' && decisions[candidate.id] === 'approved') {
      messageApi.info(
        '이미 SkinMap에 반영된 매핑입니다. 취소하려면 Git diff에서 해당 줄을 제거해주세요.'
      )
      return
    }

    const nextDecisions = { ...decisions, [candidate.id]: decision }
    const nextSelections = selectedSkin
      ? { ...selections, [candidate.id]: selectedSkin }
      : selections
    if (decision !== 'approved' || !selectedSkin) {
      setDecisions(nextDecisions)
      setSelections(nextSelections)
      persistReview(nextDecisions, nextSelections)
      return
    }

    const candidateSkinIndices = getCandidateSkinIndices(
      candidate,
      selectedSkin
    )
    const candidateMappings = candidate.itemIds.map((itemId) => ({
      itemId,
      skinIndices: candidateSkinIndices,
      source: 'review' as const
    }))
    setDecisions(nextDecisions)
    setSelections(nextSelections)
    persistReview(nextDecisions, nextSelections)
    setSyncingCandidateIds((previous) => new Set(previous).add(candidate.id))

    try {
      const result = await syncMappingsToSkinMap(candidateMappings)
      const changedCount =
        result.addedItemIds.length + result.updatedItemIds.length
      messageApi.success(
        changedCount > 0
          ? `SkinMap에 아이템 ${result.addedItemIds.length}개를 추가하고 ${result.updatedItemIds.length}개를 병합했습니다.`
          : '이미 같은 매핑이 SkinMap에 반영되어 있습니다.'
      )
    } catch (error) {
      setDecisions(decisions)
      setSelections(selections)
      persistReview(decisions, selections)
      messageApi.error(
        error instanceof Error
          ? error.message
          : 'SkinMap을 갱신하지 못했습니다.'
      )
    } finally {
      setSyncingCandidateIds((previous) => {
        const next = new Set(previous)
        next.delete(candidate.id)
        return next
      })
    }
  }

  const updateSelection = (candidateId: string, skinIndex: string) => {
    const nextSelections = { ...selections, [candidateId]: skinIndex }
    setSelections(nextSelections)
    persistReview(decisions, nextSelections)
  }

  const approveHighConfidence = async () => {
    const nextDecisions = { ...decisions }
    const nextSelections = { ...selections }
    const candidatesToApprove = candidates.filter(
      (candidate) =>
        candidate.confidence === 'high' &&
        candidate.recommendedSkinIndex &&
        decisions[candidate.id] !== 'approved'
    )

    candidatesToApprove.forEach((candidate) => {
      nextDecisions[candidate.id] = 'approved'
      nextSelections[candidate.id] = candidate.recommendedSkinIndex!
    })

    setDecisions(nextDecisions)
    setSelections(nextSelections)
    persistReview(nextDecisions, nextSelections)
    setSyncingCandidateIds(
      new Set(candidatesToApprove.map((candidate) => candidate.id))
    )

    try {
      const result = await syncMappingsToSkinMap(
        candidatesToApprove.flatMap((candidate) =>
          candidate.itemIds.map((itemId) => ({
            itemId,
            skinIndices: getCandidateSkinIndices(
              candidate,
              candidate.recommendedSkinIndex
            ),
            source: 'review' as const
          }))
        )
      )
      messageApi.success(
        `높은 신뢰도 후보 ${candidatesToApprove.length}건을 승인하고 SkinMap에 ${result.addedItemIds.length}개를 추가하고 ${result.updatedItemIds.length}개를 병합했습니다.`
      )
    } catch (error) {
      setDecisions(decisions)
      setSelections(selections)
      persistReview(decisions, selections)
      messageApi.error(
        error instanceof Error
          ? error.message
          : 'SkinMap을 갱신하지 못했습니다.'
      )
    } finally {
      setSyncingCandidateIds(new Set())
    }
  }

  const resetReview = () => {
    if (reviewKey) localStorage.removeItem(reviewKey)
    const defaultSelections = Object.fromEntries(
      candidates.flatMap((candidate) =>
        candidate.recommendedSkinIndex
          ? [[candidate.id, candidate.recommendedSkinIndex]]
          : []
      )
    )
    setDecisions(getSourceApprovedDecisions(defaultSelections))
    setSelections(defaultSelections)
    messageApi.success(
      '검수 표시를 초기화했습니다. SkinMap에 반영된 항목은 유지됩니다.'
    )
  }

  const approvedMappings = useMemo<MappingItem[]>(
    () =>
      candidates.flatMap((candidate) => {
        const skinIndex =
          selections[candidate.id] ?? candidate.recommendedSkinIndex
        if (decisions[candidate.id] !== 'approved' || !skinIndex) return []

        return candidate.itemIds.map((itemId) => ({
          itemId,
          skinIndices: getCandidateSkinIndices(candidate, skinIndex),
          source: 'review' as const
        }))
      }),
    [candidates, decisions, selections]
  )
  const [manualMappings, setManualMappings] = useState<MappingItem[]>([])
  const [isSyncingManualMapping, setIsSyncingManualMapping] = useState(false)
  const mappings = useMemo(() => {
    const merged = new Map<number, MappingItem>()
    approvedMappings.forEach((mapping) => merged.set(mapping.itemId, mapping))
    manualMappings.forEach((mapping) => merged.set(mapping.itemId, mapping))
    return [...merged.values()].sort((a, b) => a.itemId - b.itemId)
  }, [approvedMappings, manualMappings])

  const [selectedItem, setSelectedItem] = useState<ItemDto | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unmapped' | 'new'>('unmapped')
  const [indexFilter, setIndexFilter] = useState<'all' | 'unmapped'>('unmapped')
  const [hideMappedItems, setHideMappedItems] = useState(false)
  const [hideMappedIndices, setHideMappedIndices] = useState(false)

  const manualItemList = useMemo(
    () =>
      allItems.filter(
        (item) => SkinMap[item.id] !== undefined || isDirectDamageSkinItem(item)
      ),
    [allItems]
  )
  const deltaItemIds = useMemo(
    () => new Set(versionNewItems.map((item) => item.id)),
    [versionNewItems]
  )
  const getMappedIndex = (itemId: number): number[] | undefined => {
    const mapped = mappings.find((mapping) => mapping.itemId === itemId)
    return mapped ? mapped.skinIndices.map(Number) : SkinMap[itemId]
  }
  const mappedIndexSet = useMemo(() => {
    const mapped = new Set<number>()
    Object.values(SkinMap).forEach((indices) =>
      indices.forEach((index) => mapped.add(index))
    )
    mappings.forEach((mapping) =>
      mapping.skinIndices.forEach((index) => mapped.add(Number(index)))
    )
    return mapped
  }, [mappings])
  const filteredItems = manualItemList.filter((item) => {
    const isMapped = getMappedIndex(item.id) !== undefined
    if (hideMappedItems && isMapped) return false
    if (filter === 'unmapped') return !isMapped
    if (filter === 'new') return deltaItemIds.has(item.id)
    return true
  })
  const filteredIndices = (currentSkinQuery.data?.children ?? [])
    .filter((index) => {
      const isMapped = mappedIndexSet.has(Number(index))
      if (hideMappedIndices && isMapped) return false
      return indexFilter === 'all' || !isMapped
    })
    .sort((a, b) => Number(a) - Number(b))

  const addManualMapping = async () => {
    if (!selectedItem || !selectedIndex) return

    const existingSkinIndices = (getMappedIndex(selectedItem.id) ?? []).map(
      String
    )
    const skinIndices = [...new Set([...existingSkinIndices, selectedIndex])]
    const mapping: MappingItem = {
      itemId: selectedItem.id,
      skinIndices,
      source: 'manual'
    }

    setIsSyncingManualMapping(true)
    try {
      const result = await syncMappingsToSkinMap([mapping])
      setManualMappings((previous) => [
        ...previous.filter((item) => item.itemId !== mapping.itemId),
        mapping
      ])
      setSelectedItem(null)
      setSelectedIndex(null)
      messageApi.success(
        result.updatedItemIds.length > 0
          ? `기존 매핑에 INDEX ${skinIndices.slice(existingSkinIndices.length).join(', ')}를 추가했습니다.`
          : 'SkinMap에 수동 매핑을 추가했습니다.'
      )
    } catch (error) {
      messageApi.error(
        error instanceof Error
          ? error.message
          : '수동 매핑을 SkinMap에 반영하지 못했습니다.'
      )
    } finally {
      setIsSyncingManualMapping(false)
    }
  }

  const removeMapping = (itemId: number) => {
    if (manualMappings.some((mapping) => mapping.itemId === itemId)) {
      setManualMappings((previous) =>
        previous.filter((mapping) => mapping.itemId !== itemId)
      )
      return
    }

    const candidate = candidates.find((item) => item.itemIds.includes(itemId))
    if (candidate) void updateDecision(candidate, 'pending')
  }

  const generatedCode = mappings
    .map(
      (mapping) => `  ${mapping.itemId}: [${mapping.skinIndices.join(', ')}],`
    )
    .join('\n')

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      messageApi.success('SkinMap 코드를 복사했습니다.')
    } catch {
      messageApi.error('코드를 복사하지 못했습니다.')
    }
  }

  const isDeltaLoading =
    currentItemQuery.isLoading ||
    baselineItemQuery.isLoading ||
    currentSkinQuery.isLoading ||
    baselineSkinQuery.isLoading
  const hasDeltaError =
    currentItemQuery.isError ||
    baselineItemQuery.isError ||
    currentSkinQuery.isError ||
    baselineSkinQuery.isError
  if (!reviewVersion || !baselineVersion) {
    return (
      <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
        <div className={styles.loadingPage}>
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      </ConfigProvider>
    )
  }

  const reviewTab = (
    <div className={styles.reviewLayout}>
      <Card className={styles.versionCard}>
        <div
          className={styles.versionRangeBar}
          title={`${MAPPING_REGION} ${MAPPING_SCAN_START_VERSION} 이후 준비된 버전을 모두 비교합니다.`}
        >
          <span className={styles.versionRangeLabel}>미매핑 구간</span>
          <div className={styles.versionRangeButtons}>
            {pendingVersionSets.map((versionSet) => {
              const isSelected =
                baselineVersion === versionSet.baselineVersion &&
                reviewVersion === versionSet.reviewVersion

              return (
                <Button
                  key={`${versionSet.baselineVersion}-${versionSet.reviewVersion}`}
                  size="small"
                  type={isSelected ? 'primary' : 'default'}
                  title={`미매핑 아이템 ${versionSet.itemCount}개 · 인덱스 ${versionSet.skinIndexCount}개`}
                  onClick={() => {
                    setBaselineVersion(versionSet.baselineVersion)
                    setReviewVersion(versionSet.reviewVersion)
                  }}
                >
                  {versionSet.baselineVersion} → {versionSet.reviewVersion}
                  <strong>{versionSet.candidateCount}건</strong>
                </Button>
              )
            })}
            {isVersionScanLoading && <span>구간 조회 중…</span>}
            {!isVersionScanLoading && hasVersionScanError && (
              <span className={styles.versionScanError}>
                {failedScanVersions.length > 0
                  ? `${failedScanVersions.join(', ')} 데이터 없음`
                  : '구간 조회 실패'}
                <Button
                  type="link"
                  size="small"
                  onClick={() => void versionScanQuery.refetch()}
                >
                  재시도
                </Button>
              </span>
            )}
            {!isVersionScanLoading &&
              !hasVersionScanError &&
              pendingVersionSets.length === 0 && (
                <span>미매핑 구간이 없습니다.</span>
              )}
          </div>
        </div>
        <div className={styles.versionCardControls}>
          <div className={styles.versionNavigator}>
            <Button
              className={`${styles.shiftVersionButton} ${styles.previousVersionButton}`}
              icon={<LeftOutlined />}
              aria-label="한 구간 과거로 이동"
              title="한 구간 과거로 이동"
              disabled={!canShiftToPast}
              onClick={() => shiftVersionRange(-1)}
            />
            <div className={styles.versionSelection}>
              <div className={styles.versionSummary} aria-label="미매핑 요약">
                <span>
                  미매핑 신규 아이템 <strong>{newItems.length}개</strong>
                </span>
                <span>
                  미매핑 스킨 인덱스 <strong>{newSkinIndices.length}개</strong>
                </span>
                <span>
                  후보 <strong>{candidates.length}건</strong>
                </span>
              </div>
              <div className={styles.versionFlow}>
                <div>
                  <Text className={styles.fieldLabel}>비교 기준 버전</Text>
                  <Select
                    aria-label="비교 기준 버전"
                    value={baselineVersion}
                    onChange={setBaselineVersion}
                    options={readyVersions
                      .filter(
                        (version) => version.numericVersion < reviewVersion
                      )
                      .reverse()
                      .map((version) => ({
                        label: `${MAPPING_REGION} ${version.numericVersion}`,
                        value: version.numericVersion
                      }))}
                    className={styles.versionSelect}
                  />
                </div>
                <ArrowRightOutlined className={styles.versionArrow} />
                <div>
                  <Text className={styles.fieldLabel}>검수 버전</Text>
                  <Select
                    aria-label="검수 버전"
                    value={reviewVersion}
                    onChange={setReviewVersion}
                    options={readyVersions
                      .filter(
                        (version) => version.numericVersion > baselineVersion
                      )
                      .reverse()
                      .map((version) => ({
                        label: `${MAPPING_REGION} ${version.numericVersion}`,
                        value: version.numericVersion
                      }))}
                    className={styles.versionSelect}
                  />
                </div>
              </div>
            </div>
            <Button
              className={`${styles.shiftVersionButton} ${styles.nextVersionButton}`}
              icon={<RightOutlined />}
              aria-label="한 구간 미래로 이동"
              title="한 구간 미래로 이동"
              disabled={!canShiftToFuture}
              onClick={() => shiftVersionRange(1)}
            />
          </div>
          <div className={styles.versionActions}>
            <Button icon={<ReloadOutlined />} onClick={resetReview}>
              검수 초기화
            </Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => void approveHighConfidence()}
              loading={syncingCandidateIds.size > 0}
              disabled={
                syncingCandidateIds.size > 0 ||
                !candidates.some(
                  (candidate) =>
                    candidate.confidence === 'high' &&
                    candidate.recommendedSkinIndex &&
                    decisions[candidate.id] !== 'approved'
                )
              }
            >
              높은 신뢰도 모두 승인
            </Button>
          </div>
        </div>
      </Card>

      {hasDeltaError && (
        <Alert
          type="error"
          showIcon
          message="버전 차이를 불러오지 못했습니다."
          description="maplestory.io에서 두 버전의 아이템과 Effect 데이터를 모두 제공하는지 확인해주세요."
        />
      )}

      {isDeltaLoading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 7 }} />
        </Card>
      ) : candidates.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Empty
            description={
              versionNewItems.length === 0 && versionNewSkinIndices.length === 0
                ? '두 버전 사이에 새 데미지 스킨 데이터가 없습니다.'
                : newItems.length === 0 && newSkinIndices.length === 0
                  ? '이 구간의 신규 데이터는 모두 SkinMap에 반영되어 있습니다.'
                  : '자동 추천할 직접 사용형 아이템이 없습니다. 수동 매핑 탭에서 확인해주세요.'
            }
          />
        </Card>
      ) : (
        <div className={styles.candidateList}>
          {candidates.map((candidate) => {
            const confidence = getConfidenceMeta(candidate)
            const decision = decisions[candidate.id] ?? 'pending'
            const selectedSkin =
              selections[candidate.id] ?? candidate.recommendedSkinIndex
            const candidateSelectableSkinIndices = [
              ...new Set([
                ...(candidate.inheritedSkinIndices?.length &&
                candidate.recommendedSkinIndex
                  ? [candidate.recommendedSkinIndex]
                  : []),
                ...selectableSkinIndices
              ])
            ].sort((left, right) => Number(left) - Number(right))
            const selectedIsUnit = selectedSkin
              ? unitStatus[selectedSkin]
              : undefined

            return (
              <Card
                key={candidate.id}
                className={`${styles.candidateCard} ${styles[decision]}`}
              >
                <div className={styles.candidateHeader}>
                  <Space wrap>
                    <Tag color={confidence.color}>{confidence.label}</Tag>
                    {candidate.isUnitItem && <Tag color="blue">UNIT</Tag>}
                    {candidate.itemIds.length > 1 && (
                      <Tag>동일 이름 {candidate.itemIds.length}개</Tag>
                    )}
                  </Space>
                  <Tag
                    color={
                      decision === 'approved'
                        ? 'green'
                        : decision === 'rejected'
                          ? 'red'
                          : 'default'
                    }
                  >
                    {decision === 'approved'
                      ? '승인됨'
                      : decision === 'rejected'
                        ? '제외됨'
                        : '승인 대기'}
                  </Tag>
                </div>

                <div className={styles.candidateBody}>
                  <div className={styles.itemCandidate}>
                    <div className={styles.itemCandidateMain}>
                      <div className={styles.itemIcons}>
                        {candidate.itemIds.map((itemId) => (
                          <img
                            key={itemId}
                            src={`https://maplestory.io/api/${region}/${reviewVersion}/item/${itemId}/icon`}
                            alt=""
                          />
                        ))}
                      </div>
                      <div>
                        <Text className={styles.candidateLabel}>
                          신규 아이템
                        </Text>
                        <Title level={4}>{candidate.itemName}</Title>
                        <Text type="secondary">
                          ID {candidate.itemIds.join(', ')}
                        </Text>
                      </div>
                    </div>
                    {selectedSkin && (
                      <div className={styles.stickySelectedSkin}>
                        <div className={styles.stickySelectedSkinHeader}>
                          <Text type="secondary">선택 인덱스</Text>
                          <strong>INDEX {selectedSkin}</strong>
                        </div>
                        <SkinPreview
                          index={selectedSkin}
                          version={reviewVersion}
                          region={region}
                          isUnit={selectedIsUnit ?? candidate.isUnitItem}
                          compact
                        />
                      </div>
                    )}
                  </div>

                  <div className={styles.mappingArrow} aria-hidden="true">
                    <ArrowRightOutlined />
                  </div>

                  <div className={styles.skinCandidate}>
                    <div className={styles.skinCandidateTop}>
                      <div className={styles.skinIndexPicker}>
                        <Text className={styles.candidateLabel}>
                          DamageSkin 인덱스
                        </Text>
                        {candidate.inheritedSkinIndices?.length ? (
                          <Text
                            type="secondary"
                            className={styles.skinIndexHint}
                          >
                            동일 이름 기존 매핑 자동 추천 · INDEX{' '}
                            {candidate.inheritedSkinIndices.join(', ')}
                          </Text>
                        ) : isUsingExistingSkinIndices ? (
                          <Text
                            type="secondary"
                            className={styles.skinIndexHint}
                          >
                            신규 인덱스 없음 · 기존 미매핑 인덱스만 표시
                          </Text>
                        ) : null}
                        {candidateSelectableSkinIndices.length === 0 ? (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="선택 가능한 미매핑 인덱스가 없습니다."
                          />
                        ) : (
                          <Radio.Group
                            aria-label={`${candidate.itemName}에 연결할 스킨 인덱스`}
                            value={selectedSkin}
                            disabled={decision === 'approved'}
                            onChange={(event) =>
                              updateSelection(candidate.id, event.target.value)
                            }
                            className={styles.skinIndexOptions}
                          >
                            {candidateSelectableSkinIndices.map((skinIndex) => (
                              <Radio
                                key={skinIndex}
                                value={skinIndex}
                                className={styles.skinIndexRow}
                              >
                                <span className={styles.skinIndexLabel}>
                                  <strong>INDEX {skinIndex}</strong>
                                  {unitStatus[skinIndex] && (
                                    <Tag color="blue">UNIT</Tag>
                                  )}
                                </span>
                                <SkinPreview
                                  index={skinIndex}
                                  version={reviewVersion}
                                  region={region}
                                  isUnit={
                                    unitStatus[skinIndex] ??
                                    candidate.isUnitItem
                                  }
                                  compact
                                />
                              </Radio>
                            ))}
                          </Radio.Group>
                        )}
                      </div>
                      {selectedSkin && (
                        <Tag color="geekblue">
                          INDEX{' '}
                          {getCandidateSkinIndices(
                            candidate,
                            selectedSkin
                          ).join(', ')}
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.candidateFooter}>
                  <ul className={styles.reasonList}>
                    {candidate.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <Space wrap>
                    <Button
                      onClick={() => void updateDecision(candidate, 'pending')}
                      disabled={
                        decision === 'pending' || decision === 'approved'
                      }
                    >
                      보류
                    </Button>
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => void updateDecision(candidate, 'rejected')}
                      disabled={decision === 'approved'}
                    >
                      후보 제외
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => void updateDecision(candidate, 'approved')}
                      loading={syncingCandidateIds.has(candidate.id)}
                      disabled={
                        decision === 'approved' ||
                        (syncingCandidateIds.size > 0 &&
                          !syncingCandidateIds.has(candidate.id))
                      }
                    >
                      {decision === 'approved'
                        ? 'SkinMap 반영됨'
                        : '이 매핑 승인'}
                    </Button>
                  </Space>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {nonDirectNewItems.length > 0 && (
        <details className={styles.excludedDetails}>
          <summary>
            자동 추천에서 제외한 신규 검색 결과 {nonDirectNewItems.length}개
          </summary>
          <p>상자·선택권처럼 직접 스킨을 적용하지 않는 아이템입니다.</p>
          <div className={styles.excludedTags}>
            {nonDirectNewItems.map((item) => (
              <Tag key={item.id}>{item.name || `이름 없음 · ${item.id}`}</Tag>
            ))}
          </div>
        </details>
      )}
    </div>
  )

  const manualTab = (
    <div className={styles.manualLayout}>
      <Alert
        type="info"
        showIcon
        message="자동 추천으로 해결되지 않는 경우에만 사용하세요."
        description="왼쪽의 아이템과 오른쪽의 스킨 인덱스를 선택해 직접 연결할 수 있습니다."
      />
      <div className={styles.manualGrid}>
        <section className={styles.manualColumn}>
          <div className={styles.columnHeader}>
            <Title level={3}>아이템 {filteredItems.length}</Title>
            <Space wrap>
              <Switch
                checkedChildren="매핑 숨김"
                unCheckedChildren="매핑 표시"
                checked={hideMappedItems}
                onChange={setHideMappedItems}
              />
              <Segmented
                options={[
                  { label: '전체', value: 'all' },
                  { label: '미매핑', value: 'unmapped' },
                  { label: '이번 버전', value: 'new' }
                ]}
                value={filter}
                onChange={(value) =>
                  setFilter(value as 'all' | 'unmapped' | 'new')
                }
              />
            </Space>
          </div>
          <List
            className={styles.manualList}
            dataSource={filteredItems}
            renderItem={(item) => {
              const mappedIndex = getMappedIndex(item.id)
              const isMapped = mappedIndex !== undefined
              const isSelected = selectedItem?.id === item.id

              return (
                <List.Item>
                  <button
                    type="button"
                    className={`${styles.manualItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <img
                      src={`https://maplestory.io/api/${region}/${reviewVersion}/item/${item.id}/icon`}
                      alt=""
                    />
                    <span>
                      <strong>{item.name}</strong>
                      <small>ID {item.id}</small>
                    </span>
                    {deltaItemIds.has(item.id) && <Tag color="green">NEW</Tag>}
                    {mappedIndex && <Tag>INDEX {mappedIndex.join(', ')}</Tag>}
                  </button>
                </List.Item>
              )
            }}
          />
        </section>

        <div className={styles.manualBridge}>
          <div>
            <Text type="secondary">아이템</Text>
            <strong>{selectedItem?.name ?? '선택 안 됨'}</strong>
          </div>
          <ArrowRightOutlined />
          <div>
            <Text type="secondary">인덱스</Text>
            <strong>{selectedIndex ?? '선택 안 됨'}</strong>
          </div>
          <Button
            type="primary"
            size="large"
            onClick={() => void addManualMapping()}
            loading={isSyncingManualMapping}
            disabled={!selectedItem || !selectedIndex || isSyncingManualMapping}
          >
            {selectedItem && getMappedIndex(selectedItem.id)
              ? '중복 인덱스 병합'
              : '직접 매핑 추가'}
          </Button>
        </div>

        <section className={styles.manualColumn}>
          <div className={styles.columnHeader}>
            <Title level={3}>스킨 인덱스 {filteredIndices.length}</Title>
            <Space wrap>
              <Switch
                checkedChildren="매핑 숨김"
                unCheckedChildren="매핑 표시"
                checked={hideMappedIndices}
                onChange={setHideMappedIndices}
              />
              <Segmented
                options={[
                  { label: '전체', value: 'all' },
                  { label: '미매핑', value: 'unmapped' }
                ]}
                value={indexFilter}
                onChange={(value) =>
                  setIndexFilter(value as 'all' | 'unmapped')
                }
              />
            </Space>
          </div>
          <List
            className={styles.manualList}
            dataSource={filteredIndices}
            renderItem={(index) => {
              const isMapped = mappedIndexSet.has(Number(index))
              const isSelected = selectedIndex === index

              return (
                <List.Item>
                  <button
                    type="button"
                    className={`${styles.manualSkin} ${isSelected ? styles.selected : ''}`}
                    disabled={isMapped}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <SkinPreview
                      index={index}
                      version={reviewVersion}
                      region={region}
                      isUnit={unitStatus[index]}
                    />
                    <strong>INDEX {index}</strong>
                    {unitStatus[index] && <Tag color="blue">UNIT</Tag>}
                    {isMapped && <Tag>매핑됨</Tag>}
                  </button>
                </List.Item>
              )
            }}
          />
        </section>
      </div>
    </div>
  )

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      {messageContext}
      <main className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>MAPPING WORKBENCH</span>
            <Title>데미지 스킨 업데이트 검수</Title>
            <Paragraph>
              버전 사이에 새로 생긴 데이터만 비교하고, 추천 결과를 승인해 로컬
              SkinMap 파일에 바로 반영합니다.
            </Paragraph>
          </div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            href="./"
            className={styles.backButton}
          >
            시뮬레이터로
          </Button>
        </header>

        <Tabs
          defaultActiveKey="review"
          className={styles.tabs}
          items={[
            {
              key: 'review',
              label: (
                <span>
                  <SafetyCertificateOutlined /> 후보 승인
                </span>
              ),
              children: reviewTab
            },
            {
              key: 'manual',
              label: '전체 수동 매핑',
              children: manualTab
            }
          ]}
        />

        <section className={styles.resultSection}>
          <div className={styles.resultHeader}>
            <div>
              <Text className={styles.eyebrow}>APPROVED OUTPUT</Text>
              <Title level={2}>추가할 매핑 {mappings.length}개</Title>
            </div>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={copyCode}
              disabled={mappings.length === 0}
            >
              코드 복사
            </Button>
          </div>

          {mappings.length === 0 ? (
            <Empty description="후보를 승인하거나 수동 매핑을 추가해주세요." />
          ) : (
            <div className={styles.outputGrid}>
              <List
                dataSource={mappings}
                renderItem={(mapping) => {
                  const item = allItems.find(
                    (entry) => entry.id === mapping.itemId
                  )
                  return (
                    <List.Item>
                      <div className={styles.outputRow}>
                        <span>
                          <Text code>{mapping.itemId}</Text>
                          <ArrowRightOutlined />
                          <Text code>[{mapping.skinIndices.join(', ')}]</Text>
                        </span>
                        <Text type="secondary">{item?.name}</Text>
                        <Tag
                          color={mapping.source === 'review' ? 'green' : 'blue'}
                        >
                          {mapping.source === 'review' ? '승인' : '수동'}
                        </Tag>
                        <Button
                          type="text"
                          danger
                          icon={<CloseOutlined />}
                          aria-label={`${mapping.itemId} 매핑 제거`}
                          onClick={() => removeMapping(mapping.itemId)}
                          disabled
                        />
                      </div>
                    </List.Item>
                  )
                }}
              />
              <Card className={styles.codeCard}>
                <pre>{generatedCode}</pre>
              </Card>
            </div>
          )}
        </section>
      </main>
    </ConfigProvider>
  )
}
