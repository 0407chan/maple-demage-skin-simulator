export type ImgNode = {
  type: string | number
  value?: unknown
  children: ImgTree
}
export type ImgTree = Record<string, ImgNode>

// MapleStory.io raw IMG exports use unencrypted PKG1 property strings.
// Canvas pixels and collision/audio payloads are skipped; pixels come from /wz/img.
export const readWzImgMetadata = (buffer: ArrayBuffer): ImgTree => {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  let cursor = 0
  let nodeCount = 0
  const take = (size: number) => {
    if (!Number.isSafeInteger(size) || size < 0 || cursor + size > bytes.length)
      throw new Error('Invalid IMG property bounds')
    const start = cursor
    cursor += size
    return start
  }
  const u8 = () => view.getUint8(take(1))
  const i8 = () => view.getInt8(take(1))
  const i32 = () => view.getInt32(take(4), true)
  const integer = () => {
    const n = i8()
    return n === -128 ? i32() : n
  }
  const string = () => {
    const marker = i8()
    const unicode = marker > 0
    const length = marker === -128 || marker === 127 ? i32() : Math.abs(marker)
    const start = take(length * (unicode ? 2 : 1))
    let result = ''
    for (let i = 0; i < length; i++)
      result += String.fromCharCode(
        unicode
          ? view.getUint16(start + i * 2, true) ^ ((0xaaaa + i) & 0xffff)
          : bytes[start + i] ^ ((0xaa + i) & 0xff)
      )
    return result
  }
  const stringBlock = () => {
    const marker = u8()
    if (marker === 0 || marker === 0x73) return string()
    if (marker !== 1 && marker !== 0x1b)
      throw new Error(`Unsupported IMG string: ${marker}`)
    const offset = i32()
    if (offset < 0 || offset >= bytes.length)
      throw new Error('Invalid IMG string offset')
    const saved = cursor
    cursor = offset
    const result = string()
    cursor = saved
    return result
  }
  const properties = (depth = 0): ImgTree => {
    if (depth > 64) throw new Error('IMG property nesting limit exceeded')
    take(2)
    const count = integer()
    if (count < 0 || (nodeCount += count) > 500000)
      throw new Error('Invalid IMG property count')
    const result: ImgTree = Object.create(null)
    for (let i = 0; i < count; i++) {
      const name = stringBlock()
      let type: string | number = u8()
      let value: unknown
      let children: ImgTree = Object.create(null)
      switch (type) {
        case 0:
          break
        case 2:
        case 11:
          value = view.getInt16(take(2), true)
          break
        case 18:
          value = view.getUint16(take(2), true)
          break
        case 3:
        case 19:
          value = integer()
          break
        case 20: {
          const n = i8()
          value = n === -128 ? Number(view.getBigInt64(take(8), true)) : n
          break
        }
        case 4:
          value = u8() === 128 ? view.getFloat32(take(4), true) : 0
          break
        case 5:
          value = view.getFloat64(take(8), true)
          break
        case 8:
          value = stringBlock()
          break
        case 9: {
          const size = view.getUint32(take(4), true)
          const end = cursor + size
          if (end > bytes.length)
            throw new Error('Invalid IMG extended property bounds')
          type = stringBlock()
          if (type === 'Property') children = properties(depth + 1)
          else if (type === 'Canvas') {
            take(1)
            if (u8()) children = properties(depth + 1)
          } else if (type === 'Shape2D#Vector2D')
            value = { x: integer(), y: integer() }
          else if (type === 'UOL') {
            take(1)
            value = stringBlock()
          } else if (
            !['Shape2D#Convex2D', 'Sound_DX8', 'RawData', 'Video'].includes(
              type
            )
          )
            throw new Error(`Unsupported IMG property: ${type}`)
          if (cursor > end) throw new Error('IMG property length mismatch')
          cursor = end
          break
        }
        default:
          throw new Error(`Unsupported IMG type: ${type}`)
      }
      result[name] = { type, value, children }
    }
    return result
  }
  if (stringBlock() !== 'Property')
    throw new Error('Unsupported/encrypted IMG export')
  const root = properties()
  if (bytes.subarray(cursor).some((byte) => byte !== 0))
    throw new Error('Unexpected IMG trailing data')
  return root
}

export const normalizeImgPath = (path: string) => {
  const parts: string[] = []
  for (const part of path.split('/')) {
    if (part === '..') {
      if (!parts.length) throw new Error('IMG link leaves its root')
      parts.pop()
    } else if (part && part !== '.') parts.push(part)
  }
  return parts.join('/')
}

export const findWzImgNode = (tree: ImgTree, path: string): ImgNode => {
  let node: ImgNode = { type: 'Property', children: tree }
  for (const part of normalizeImgPath(path).split('/').filter(Boolean)) {
    const next = node.children[part]
    if (!next) throw new Error(`Missing IMG node: ${path}`)
    node = next
  }
  return node
}
