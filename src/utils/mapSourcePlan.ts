import type { MapleMapDetail } from 'type/map'
import { findWzImgNode, normalizeImgPath } from './wzImgMetadata'
import type { ImgNode, ImgTree } from './wzImgMetadata'

export type SourceSprite = {
  key: string
  imagePaths: string[]
  origin: { x: number; y: number }
  z: number
}
export type SourcePlacement = {
  sprite: SourceSprite
  x: number
  y: number
  flip: boolean
  layer: number
  z: number
  order: number
  index: number
}
export type SourceBackground = {
  sprite: SourceSprite
  index: number
  x: number
  y: number
  flip: boolean
  front: boolean
  alpha: number
  type: number
  rx: number
  ry: number
  cx: number
  cy: number
}
export type MapSourcePlan = {
  detail: MapleMapDetail
  width: number
  height: number
  placements: SourcePlacement[]
  backgrounds: SourceBackground[]
  tileCount: number
  objectCount: number
}
type LoadMetadata = (path: string) => Promise<ImgTree>
const number = (tree: ImgTree, key: string, fallback = 0) => {
  const value = tree[key]?.value
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
const text = (tree: ImgTree, key: string) => String(tree[key]?.value ?? '')
const bool = (tree: ImgTree, key: string) => !!tree[key]?.value

export const createSourceSpriteResolver = (load: LoadMetadata) => {
  const pending = new Map<string, Promise<SourceSprite>>()
  return (imgPath: string, path: string): Promise<SourceSprite> => {
    const key = `${imgPath}/${path}`
    const previous = pending.get(key)
    if (previous) return previous
    const resolve = async () => {
      const tree = await load(imgPath)
      const visit = (
        nodePath: string,
        visited = new Set<string>()
      ): { node: ImgNode; path: string } => {
        nodePath = normalizeImgPath(nodePath)
        if (visited.has(nodePath) || visited.size >= 32)
          throw new Error(`Cyclic map sprite: ${key}`)
        visited.add(nodePath)
        const node = findWzImgNode(tree, nodePath)
        if (node.type === 'UOL')
          return visit(
            `${nodePath.split('/').slice(0, -1).join('/')}/${node.value}`,
            visited
          )
        if (node.type !== 'Canvas') {
          const first = Object.keys(node.children)
            .filter((part) => /^\d+$/.test(part))
            .sort((a, b) => +a - +b)[0]
          if (first === undefined)
            throw new Error(`Unsupported map sprite: ${key}`)
          return visit(`${nodePath}/${first}`, visited)
        }
        return { node, path: nodePath }
      }
      const original = visit(path)
      let linked = original
      const links = new Set<string>()
      while (linked.node.children._inlink?.value) {
        if (links.has(linked.path))
          throw new Error(`Cyclic map image link: ${key}`)
        links.add(linked.path)
        linked = visit(String(linked.node.children._inlink.value))
      }
      const origin =
        original.node.children.origin?.value ??
        linked.node.children.origin?.value
      if (
        !origin ||
        typeof origin !== 'object' ||
        !('x' in origin) ||
        !('y' in origin) ||
        typeof origin.x !== 'number' ||
        typeof origin.y !== 'number'
      )
        throw new Error(`Missing sprite origin: ${key}`)
      const outlink = text(linked.node.children, '_outlink')
      return {
        key,
        imagePaths: [
          ...new Set(
            [
              outlink,
              `${imgPath}/${linked.path}`,
              `${imgPath}/${original.path}`
            ].filter(Boolean)
          )
        ],
        origin: { x: origin.x, y: origin.y },
        z: number(
          original.node.children,
          'z',
          number(linked.node.children, 'z')
        )
      }
    }
    const promise = resolve()
    pending.set(key, promise)
    return promise
  }
}

export const buildMapSourcePlan = async (
  mapId: number,
  load: LoadMetadata
): Promise<MapSourcePlan> => {
  const id = String(mapId).padStart(9, '0')
  const root = await load(`Map/Map/Map${id[0]}/${id}.img`)
  const mini = root.miniMap?.children ?? {}
  const width = number(mini, 'width')
  const height = number(mini, 'height')
  if (
    width <= 0 ||
    height <= 0 ||
    width * height > 32000000 ||
    Math.max(width, height) > 32768
  )
    throw new Error(`Unsupported map image dimensions: ${width}x${height}`)
  const resolveSprite = createSourceSpriteResolver(load)
  const placements: Promise<SourcePlacement>[] = []
  let tileCount = 0
  let objectCount = 0
  for (let layer = 0; layer < 8; layer++) {
    const data = root[String(layer)]?.children
    if (!data) continue
    const tileSet = text(data.info?.children ?? {}, 'tS')
    for (const kind of ['obj', 'tile'] as const) {
      for (const [index, entry] of Object.entries(data[kind]?.children ?? {})) {
        const p = entry.children
        const tile = kind === 'tile'
        if (tile) tileCount++
        else objectCount++
        if (number(p, 'r')) {
          placements.push(
            Promise.reject(
              new Error(
                `Rotating map object needs a motion renderer: ${mapId}/${layer}/${index}`
              )
            )
          )
          continue
        }
        const img = tile
          ? `Map/Tile/${tileSet}.img`
          : `Map/Obj/${text(p, 'oS')}.img`
        const path = tile
          ? `${text(p, 'u')}/${text(p, 'no')}`
          : `${text(p, 'l0')}/${text(p, 'l1')}/${text(p, 'l2')}`
        placements.push(
          resolveSprite(img, path).then((sprite) => ({
            sprite,
            layer,
            index: Number(index),
            order: number(p, 'zM'),
            x: number(p, 'x'),
            y: number(p, 'y'),
            flip: bool(p, 'f'),
            z: number(p, 'z', sprite.z)
          }))
        )
      }
    }
  }
  const backgrounds = Object.entries(root.back?.children ?? {})
    .filter(([, entry]) => text(entry.children, 'bS'))
    .map(async ([index, entry]): Promise<SourceBackground> => {
      const p = entry.children
      const ani = number(p, 'ani')
      if (ani > 1)
        throw new Error(`Unsupported background animation: ${mapId}/${index}`)
      const sprite = await resolveSprite(
        `Map/Back/${text(p, 'bS')}.img`,
        `${ani ? 'ani' : 'back'}/${text(p, 'no')}`
      )
      return {
        sprite,
        index: Number(index),
        x: number(p, 'x'),
        y: number(p, 'y'),
        flip: bool(p, 'f'),
        front: bool(p, 'front'),
        alpha: Math.max(0, Math.min(1, number(p, 'a', 255) / 255)),
        type: number(p, 'type'),
        rx: number(p, 'rx'),
        ry: number(p, 'ry'),
        cx: number(p, 'cx'),
        cy: number(p, 'cy')
      }
    })
  const [readyPlacements, readyBackgrounds] = await Promise.all([
    Promise.all(placements),
    Promise.all(backgrounds)
  ])
  return {
    detail: {
      id: mapId,
      name: String(mapId),
      streetName: '',
      miniMap: {
        width,
        height,
        centerX: number(mini, 'centerX'),
        centerY: number(mini, 'centerY')
      }
    },
    width,
    height,
    tileCount,
    objectCount,
    placements: readyPlacements.sort(
      (a, b) =>
        a.layer - b.layer || a.z - b.z || a.order - b.order || a.index - b.index
    ),
    backgrounds: readyBackgrounds.sort((a, b) => a.index - b.index)
  }
}
