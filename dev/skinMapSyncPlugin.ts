import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import {
  SkinMapConflictError,
  SkinMapSyncEntry,
  updateSkinMapSource
} from './skinMapSync'

const ENDPOINT = '/__mapping-tool/skin-map'
const MAX_BODY_SIZE = 32 * 1024

const sendJson = (
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>
) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

const isSameOrigin = (request: IncomingMessage) => {
  const origin = request.headers.origin
  const host = request.headers.host
  if (!origin || !host) return true

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

const readJsonBody = (request: IncomingMessage) =>
  new Promise<unknown>((resolve, reject) => {
    let body = ''

    request.setEncoding('utf8')
    request.on('data', (chunk: string) => {
      body += chunk
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('요청 본문이 너무 큽니다.'))
        request.destroy()
      }
    })
    request.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('올바른 JSON 요청이 아닙니다.'))
      }
    })
    request.on('error', reject)
  })

const isSyncEntry = (value: unknown): value is SkinMapSyncEntry => {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<SkinMapSyncEntry>
  return (
    typeof entry.itemId === 'number' &&
    Array.isArray(entry.skinIndices) &&
    entry.skinIndices.every((skinIndex) => typeof skinIndex === 'number')
  )
}

export const skinMapSyncPlugin = (): Plugin => ({
  name: 'skin-map-sync',
  apply: 'serve',
  configureServer(server) {
    const skinMapPath = path.resolve(
      server.config.root,
      'src/constants/damageSkinMapper.ts'
    )

    server.middlewares.use(async (request, response, next) => {
      if (request.url !== ENDPOINT) {
        next()
        return
      }
      if (request.method !== 'POST') {
        sendJson(response, 405, { message: 'POST 요청만 지원합니다.' })
        return
      }
      if (!isSameOrigin(request)) {
        sendJson(response, 403, { message: '동일 출처 요청만 허용합니다.' })
        return
      }
      if (!request.headers['content-type']?.startsWith('application/json')) {
        sendJson(response, 415, { message: 'JSON 요청만 지원합니다.' })
        return
      }

      try {
        const payload = await readJsonBody(request)
        const mappings =
          payload && typeof payload === 'object'
            ? (payload as { mappings?: unknown }).mappings
            : undefined
        if (!Array.isArray(mappings) || !mappings.every(isSyncEntry)) {
          sendJson(response, 400, {
            message: '매핑 요청 형식이 올바르지 않습니다.'
          })
          return
        }

        const source = await fs.readFile(skinMapPath, 'utf8')
        const result = updateSkinMapSource(source, mappings)
        if (
          result.addedItemIds.length > 0 ||
          result.updatedItemIds.length > 0
        ) {
          await fs.writeFile(skinMapPath, result.source, 'utf8')
        }

        sendJson(response, 200, {
          path: 'src/constants/damageSkinMapper.ts',
          addedItemIds: result.addedItemIds,
          updatedItemIds: result.updatedItemIds,
          unchangedItemIds: result.unchangedItemIds
        })
      } catch (error) {
        const statusCode = error instanceof SkinMapConflictError ? 409 : 500
        sendJson(response, statusCode, {
          message:
            error instanceof Error
              ? error.message
              : 'SkinMap을 갱신하지 못했습니다.'
        })
      }
    })
  }
})
