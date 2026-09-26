/**
 * What the main process reports about sources already downloaded.
 *
 * These types live in `shared/` because the renderer and preload both need
 * them, and a renderer file may not import from `main/`. No filesystem path
 * crosses this boundary: a record describes a file, it never names one.
 */

export interface CachedSource {
  /** Stable identity of the video; safe to pass back to delete. */
  key: string
  title: string
  url: string
  sourceType: string
  width: number
  height: number
  durationSeconds: number
  bytes: number
  storedAt: number
  lastUsedAt: number
}

export interface SourceCacheInfo {
  /** False when the cache could not be opened; runs then download as before. */
  enabled: boolean
  totalBytes: number
  entries: CachedSource[]
  error: string | null
}

export const EMPTY_SOURCE_CACHE: SourceCacheInfo = {
  enabled: false,
  totalBytes: 0,
  entries: [],
  error: null
}
