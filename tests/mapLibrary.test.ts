import { afterEach, describe, expect, test } from 'bun:test'
import axios from 'axios'
import { getMapList, getNextMapPage, MAP_PAGE_SIZE } from '../src/api/map'
import { mergeMapLists, restoreMapSelection } from '../src/utils/mapSelection'

const originalAdapter = axios.defaults.adapter
afterEach(() => {
  axios.defaults.adapter = originalAdapter
})

describe('full map library', () => {
  test('pages through remote results and keeps maps with identical names', async () => {
    const calls: number[] = []
    const controller = new AbortController()
    axios.defaults.adapter = async (config) => {
      expect(config.url).toBe('https://maplestory.io/api/KMS/389/map')
      expect(config.params.searchFor).toBe('리스항구')
      expect(config.params.count).toBe(MAP_PAGE_SIZE)
      expect(config.signal).toBe(controller.signal)
      const start = config.params.startPosition
      calls.push(start)
      return {
        config,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: Array.from(
          { length: start === 0 ? MAP_PAGE_SIZE : 2 },
          (_, offset) => ({
            id: 104000000 + start + offset,
            name: '리스항구',
            streetName: '빅토리아 아일랜드'
          })
        )
      }
    }
    const query = {
      region: 'KMS' as const,
      version: 389,
      searchFor: '리스항구',
      count: MAP_PAGE_SIZE
    }
    const first = await getMapList(
      { ...query, startPosition: 0 },
      controller.signal
    )
    const nextPosition = getNextMapPage(first, 0)!
    const next = await getMapList(
      { ...query, startPosition: nextPosition },
      controller.signal
    )
    const maps = mergeMapLists([first[0]], first, next)
    expect(calls).toEqual([0, 60])
    expect(maps).toHaveLength(62)
    expect(getNextMapPage(next, nextPosition)).toBeUndefined()
    expect(getNextMapPage([], 120)).toBeUndefined()
  })

  test('restores remote selections while keeping canonical local map labels', () => {
    const remote = { id: 104000000, name: '리스항구', streetName: '리스항구' }
    expect(restoreMapSelection(JSON.parse(JSON.stringify(remote)))).toEqual(
      remote
    )
    expect(
      restoreMapSelection({ id: 100000000, name: 'old', streetName: '' })?.name
    ).toBe('헤네시스')
    for (const invalid of [
      null,
      {},
      { ...remote, id: -1 },
      { ...remote, id: 1.5 },
      { ...remote, id: '104000000' },
      { id: 104000000 }
    ]) {
      expect(restoreMapSelection(invalid)).toBeUndefined()
    }
  })
})
