const MAP_SCENE_CACHE_DATABASE = 'maple-damage-skin-map-scenes'
const MAP_SCENE_CACHE_STORE = 'backgrounds'
const MAP_SCENE_CACHE_VERSION = 1
const MAX_PERSISTED_MAP_SCENES = 6

type MapSceneCacheRecord<T> = {
  accessedAt: number
  cacheKey: string
  schemaVersion: number
  value: T
}

let databasePromise: Promise<IDBDatabase | undefined> | undefined

const openDatabase = () => {
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(undefined)
      return
    }

    const request = indexedDB.open(
      MAP_SCENE_CACHE_DATABASE,
      MAP_SCENE_CACHE_VERSION
    )
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(MAP_SCENE_CACHE_STORE)) {
        request.result.createObjectStore(MAP_SCENE_CACHE_STORE, {
          keyPath: 'cacheKey'
        })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(undefined)
    request.onblocked = () => resolve(undefined)
  })

  return databasePromise
}

const putRecord = async <T>(record: MapSceneCacheRecord<T>) => {
  const database = await openDatabase()
  if (!database) return

  await new Promise<void>((resolve) => {
    const transaction = database.transaction(MAP_SCENE_CACHE_STORE, 'readwrite')
    const store = transaction.objectStore(MAP_SCENE_CACHE_STORE)
    store.put(record)

    const recordsRequest = store.getAll()
    recordsRequest.onsuccess = () => {
      const records = (recordsRequest.result as MapSceneCacheRecord<unknown>[])
        .sort((left, right) => right.accessedAt - left.accessedAt)
        .slice(MAX_PERSISTED_MAP_SCENES)

      records.forEach((cachedRecord) => store.delete(cachedRecord.cacheKey))
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => resolve()
    transaction.onabort = () => resolve()
  })
}

export const readMapSceneCache = async <T>(cacheKey: string) => {
  const database = await openDatabase()
  if (!database) return undefined

  const record = await new Promise<MapSceneCacheRecord<T> | undefined>(
    (resolve) => {
      const transaction = database.transaction(
        MAP_SCENE_CACHE_STORE,
        'readonly'
      )
      const request = transaction
        .objectStore(MAP_SCENE_CACHE_STORE)
        .get(cacheKey)

      request.onsuccess = () =>
        resolve(request.result as MapSceneCacheRecord<T> | undefined)
      request.onerror = () => resolve(undefined)
    }
  )

  if (!record || record.schemaVersion !== MAP_SCENE_CACHE_VERSION) {
    return undefined
  }

  void putRecord({ ...record, accessedAt: Date.now() })
  return record.value
}

export const writeMapSceneCache = <T>(cacheKey: string, value: T) =>
  putRecord({
    accessedAt: Date.now(),
    cacheKey,
    schemaVersion: MAP_SCENE_CACHE_VERSION,
    value
  })
