import React, { useState, useEffect } from 'react'
import { useGetDamageSkinAll } from 'api/damage-skin'
import { useSkinList } from 'components/modals/SkinSelectModal/useSkinList'
import { SkinMap } from 'constants/damageSkinMapper'
import { ItemDto } from 'type/damage-skin'
import { useRecoilValue } from 'recoil'
import { wzVersionState } from 'atoms/wzVersion'
import { Flex, Typography, Button, List, Card, Segmented, Tag, Space, ConfigProvider, theme, Switch } from 'antd'
import { ArrowRightOutlined, CopyOutlined, CloseOutlined, EyeInvisibleOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

type MappingItem = {
  itemId: number
  skinIndex: string
}

const ImageWithBase64: React.FC<{
  url: string
  alt: string
  className?: string
  onSuccess?: () => void
  onError?: () => void
}> = ({ url, alt, className, onSuccess, onError }) => {
  const [imageSrc, setImageSrc] = useState<string>('')

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(url)
        const data = await response.json()
        if (data.value) {
          setImageSrc(`data:image/png;base64,${data.value}`)
          onSuccess?.()
        } else {
          onError?.()
        }
      } catch (error) {
        console.error('Failed to fetch image:', error)
        onError?.()
      }
    }
    fetchImage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  if (!imageSrc) return null

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

export const MappingTool: React.FC = () => {
  const { currentItemList, newSkinItemList, isLoading } = useSkinList()
  const wzVersion = useRecoilValue(wzVersionState)
  const { data: damageSkinData } = useGetDamageSkinAll(
    wzVersion?.version,
    wzVersion?.region
  )

  const [selectedItem, setSelectedItem] = useState<ItemDto | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null)
  const [mappings, setMappings] = useState<MappingItem[]>([])
  const [filter, setFilter] = useState<'all' | 'unmapped' | 'new'>('unmapped')
  const [indexFilter, setIndexFilter] = useState<'all' | 'unmapped'>('unmapped')
  const [unitStatus, setUnitStatus] = useState<Record<string, boolean>>({})
  const [hideMappedItems, setHideMappedItems] = useState<boolean>(false)
  const [hideMappedIndices, setHideMappedIndices] = useState<boolean>(false)

  const allItems = [...currentItemList, ...newSkinItemList]

  const getMappedIndex = (itemId: number): number[] | undefined => {
    // 먼저 현재 세션의 매핑 확인
    const sessionMapping = mappings.find(m => m.itemId === itemId)
    if (sessionMapping) {
      return [Number(sessionMapping.skinIndex)]
    }
    // 없으면 기존 SkinMap 확인
    return SkinMap[itemId]
  }

  const getMappedIndexSet = () => {
    // 기존 SkinMap의 값들 (배열이므로 flat 처리)
    const mapped = new Set<number>()
    Object.values(SkinMap).forEach(indices => {
      indices.forEach(index => mapped.add(index))
    })
    // 현재 세션의 매핑도 추가
    mappings.forEach(m => mapped.add(Number(m.skinIndex)))
    return mapped
  }

  const filteredItems = allItems.filter((item) => {
    const isMapped = getMappedIndex(item.id) !== undefined

    // hideMappedItems가 true면 매핑된 아이템 제거
    if (hideMappedItems && isMapped) {
      return false
    }

    if (filter === 'unmapped') {
      return !isMapped
    }
    if (filter === 'new') {
      return newSkinItemList.some((newItem) => newItem.id === item.id)
    }
    return true
  })

  const filteredIndices =
    (damageSkinData?.children.filter((index) => {
      const mappedSet = getMappedIndexSet()
      const isMapped = mappedSet.has(Number(index))

      // hideMappedIndices가 true면 매핑된 인덱스 제거
      if (hideMappedIndices && isMapped) {
        return false
      }

      if (indexFilter === 'unmapped') {
        return !isMapped
      }
      return true
    }) || []).sort((a, b) => Number(a) - Number(b))

  const handleAddMapping = () => {
    if (!selectedItem || !selectedIndex) return

    const newMapping: MappingItem = {
      itemId: selectedItem.id,
      skinIndex: selectedIndex
    }

    setMappings((prev) => {
      // 같은 itemId가 있으면 덮어쓰기
      const filtered = prev.filter((m) => m.itemId !== newMapping.itemId)
      return [...filtered, newMapping]
    })

    setSelectedItem(null)
    setSelectedIndex(null)
  }

  const handleRemoveMapping = (itemId: number) => {
    setMappings((prev) => prev.filter((m) => m.itemId !== itemId))
  }

  const generateCode = () => {
    if (mappings.length === 0) return ''

    const sortedMappings = [...mappings].sort((a, b) => a.itemId - b.itemId)

    return sortedMappings
      .map((m) => `  ${m.itemId}: ${m.skinIndex},`)
      .join('\n')
  }

  const handleCopyCode = () => {
    const code = generateCode()
    navigator.clipboard.writeText(code)
    alert('복사됨!')
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
        <Text>로딩 중...</Text>
      </Flex>
    )
  }

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <Flex vertical gap={24} style={{ padding: 16, height: '100vh', overflowY: "scroll", backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Title level={1} style={{ margin: 0 }}>
            데미지 스킨 매핑 도구
          </Title>
          <Button type="link" href="/">
            ← 메인으로 돌아가기
          </Button>
        </Flex>

        <Flex gap={16} align="flex-start">
          {/* MARK: Item List */}
          <Flex vertical gap={16} style={{ flex: 1 }}>
            <Flex justify="space-between" align="center">
              <Title level={3} style={{ margin: 0 }}>
                아이템 리스트 ({filteredItems.length})
              </Title>
              <Flex gap={12} align="center">
                <Switch
                  checkedChildren="매핑 가리기"
                  unCheckedChildren="매핑 표시"
                  checked={hideMappedItems}
                  onChange={setHideMappedItems}
                />
                <Segmented
                  options={[
                    { label: '전체', value: 'all' },
                    { label: '미매핑', value: 'unmapped' },
                    { label: '신규', value: 'new' }
                  ]}
                  value={filter}
                  onChange={(value) => setFilter(value as 'all' | 'unmapped' | 'new')}
                />
              </Flex>
            </Flex>

            <List
              dataSource={filteredItems}
              style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}
              grid={{ gutter: 8, column: 1 }}
              renderItem={(item) => {
                const mappedIndex = getMappedIndex(item.id)
                const isSelected = selectedItem?.id === item.id
                const isNew = newSkinItemList.some(
                  (newItem) => newItem.id === item.id
                )
                const isMapped = mappedIndex !== undefined

                return (
                  <List.Item>
                    <Card
                      hoverable={!isMapped}
                      onClick={() => !isMapped && setSelectedItem(item)}
                      style={{
                        border: isSelected ? '2px solid #1890ff' : undefined,
                        backgroundColor: isSelected ? '#e6f7ff' : isMapped ? '#f5f5f5' : undefined,
                        opacity: isMapped ? 0.6 : 1,
                        cursor: isMapped ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Flex gap={12} align="center">
                        <img
                          src={`https://maplestory.io/api/${wzVersion?.region || 'KMS'}/${wzVersion?.version || 353}/item/${item.id}/icon`}
                          alt={item.name}
                          style={{ width: 32, height: 32 }}
                        />
                        <Flex vertical gap={4} style={{ flex: 1 }}>
                          <Flex gap={8} align="center">
                            <Text strong>{item.name}</Text>
                            {isNew && <Tag color="green">NEW</Tag>}
                            {isMapped && <Tag color="default">매핑됨</Tag>}
                          </Flex>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            ID: {item.id}
                          </Text>
                          {mappedIndex && (
                            <Text type="success" style={{ fontSize: 12 }}>
                              매핑됨: {mappedIndex.join(', ')}
                            </Text>
                          )}
                        </Flex>
                      </Flex>
                    </Card>
                  </List.Item>
                )
              }}
            />
          </Flex>

          {/* MARK: Mapping Control */}
          <Flex
            vertical
            justify="center"
            align="center"
            gap={16}
            style={{ width: 200 }}
          >
            {selectedItem && (
              <Card size="small" style={{ width: '100%' }}>
                <Flex vertical gap={8}>
                  <Text type="secondary">선택된 아이템:</Text>
                  <Text strong>{selectedItem.name}</Text>
                </Flex>
              </Card>
            )}

            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={handleAddMapping}
              disabled={!selectedItem || !selectedIndex}
              block
            >
              매핑 추가
            </Button>

            {selectedIndex && (
              <Card size="small" style={{ width: '100%' }}>
                <Flex vertical gap={8}>
                  <Text type="secondary">선택된 인덱스:</Text>
                  <Text strong>{selectedIndex}</Text>
                </Flex>
              </Card>
            )}
          </Flex>

          {/* MARK: Index List */}
          <Flex vertical gap={16} style={{ flex: 1 }}>
            <Flex justify="space-between" align="center">
              <Title level={3} style={{ margin: 0 }}>
                데미지 스킨 인덱스 ({filteredIndices.length})
              </Title>
              <Flex gap={12} align="center">
                <Switch
                  checkedChildren="매핑 가리기"
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
              </Flex>
            </Flex>

            <List
              dataSource={filteredIndices}
              style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}
              grid={{ gutter: 8, column: 1 }}
              renderItem={(index) => {
                const isSelected = selectedIndex === index
                const mappedSet = getMappedIndexSet()
                const isMapped = mappedSet.has(Number(index))

                return (
                  <List.Item>
                    <Card
                      hoverable={!isMapped}
                      styles={{
                        body: {
                          padding: 0
                        }
                      }}
                      onClick={() => !isMapped && setSelectedIndex(index)}
                      style={{
                        border: isSelected ? '2px solid #1890ff' : undefined,
                        backgroundColor: isSelected ? '#e6f7ff' : isMapped ? '#f5f5f5' : undefined,
                        opacity: isMapped ? 0.6 : 1,
                        cursor: isMapped ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Flex vertical gap={8} align="center">
                        <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
                          <ImageWithBase64
                            url={`https://maplestory.io/api/wz/${wzVersion?.region || 'KMS'}/${wzVersion?.version || 353}/Effect/DamageSkin.img/${index}/NoRed0/7`}
                            alt={`Skin ${index}`}
                          />
                          <ImageWithBase64
                            url={`https://maplestory.io/api/wz/${wzVersion?.region || 'KMS'}/${wzVersion?.version || 353}/Effect/DamageSkin.img/${index}/NoRed1/7`}
                            alt={`Skin ${index}`}
                          />
                          <ImageWithBase64
                            url={`https://maplestory.io/api/wz/${wzVersion?.region || 'KMS'}/${wzVersion?.version || 353}/Effect/DamageSkin.img/${index}/NoCri0/7`}
                            alt={`Skin ${index}`}
                          />
                          <ImageWithBase64
                            url={`https://maplestory.io/api/wz/${wzVersion?.region || 'KMS'}/${wzVersion?.version || 353}/Effect/DamageSkin.img/${index}/NoCri1/7`}
                            alt={`Skin ${index}`}
                          />
                          {/* Unit 체크용 이미지 (숨김) */}
                          <div style={{ display: 'none' }}>
                            <ImageWithBase64
                              url={`https://maplestory.io/api/wz/${wzVersion?.region || 'KMS'}/${wzVersion?.version || 353}/Effect/DamageSkin.img/${index}/NoCustom/NoCri0/3`}
                              alt={`Unit check ${index}`}
                              onSuccess={() => {
                                setUnitStatus(prev => ({ ...prev, [index]: true }))
                              }}
                              onError={() => {
                                setUnitStatus(prev => ({ ...prev, [index]: false }))
                              }}
                            />
                          </div>

                          {unitStatus[index] && <>
                            <ImageWithBase64
                              url={`https://maplestory.io/api/wz/${wzVersion?.region || 'KMS'}/${wzVersion?.version || 353}/Effect/DamageSkin.img/${index}/NoCustom/NoCri0/3`}
                              alt={`Unit check ${index}`}
                            />
                            <ImageWithBase64
                              url={`https://maplestory.io/api/wz/${wzVersion?.region || 'KMS'}/${wzVersion?.version || 353}/Effect/DamageSkin.img/${index}/NoCustom/NoCri0/4`}
                              alt={`Unit check ${index}`}
                            />
                          </>}
                        </div>
                        <Flex gap={8} align="center">
                          <Text>Index: {index}</Text>
                          {unitStatus[index] && <Tag color="blue">UNIT</Tag>}
                          {isMapped && <Tag color="default">매핑됨</Tag>}
                        </Flex>
                      </Flex>
                    </Card>
                  </List.Item>
                )
              }}
            />
          </Flex>
        </Flex>

        {/* 하단: 매핑 결과 */}
        <Flex vertical gap={16}>
          <Flex justify="space-between" align="center">
            <Title level={3} style={{ margin: 0 }}>
              매핑 결과 ({mappings.length})
            </Title>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={handleCopyCode}
              disabled={mappings.length === 0}
            >
              코드 복사
            </Button>
          </Flex>

          <List
            dataSource={mappings}
            grid={{ gutter: 8, column: 1 }}
            renderItem={(mapping) => {
              const item = allItems.find((i) => i.id === mapping.itemId)
              return (
                <List.Item>
                  <Card size="small">
                    <Flex justify="space-between" align="center">
                      <Space size="middle">
                        <Text code>{mapping.itemId}</Text>
                        <ArrowRightOutlined />
                        <Text code>{mapping.skinIndex}</Text>
                        <Text type="secondary">{item?.name}</Text>
                      </Space>
                      <Button
                        type="text"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleRemoveMapping(mapping.itemId)}
                      />
                    </Flex>
                  </Card>
                </List.Item>
              )
            }}
          />

          {mappings.length > 0 && (
            <Card>
              <Paragraph>
                <pre style={{ margin: 0 }}>{generateCode()}</pre>
              </Paragraph>
            </Card>
          )}
        </Flex>
      </Flex>
    </ConfigProvider>
  )
}
