import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { EMPTY_SOURCE_CACHE, type CachedSource, type SourceCacheInfo } from '../shared/source-cache'
import { getEnginePath, resolvePythonPath } from './pipeline-runner'

export { EMPTY_SOURCE_CACHE }
export type { CachedSource, SourceCacheInfo }

const execFileAsync = promisify(execFile)

const LIST_TIMEOUT_MS: number = 20_000
const MAX_OUTPUT_BYTES = 1_000_000
/** A cache key becomes a filename, so only this shape is ever passed through. */
const SAFE_KEY = /^[A-Za-z0-9_-]{1,96}$/

/**
 * Run the cache module directly rather than through the job runner.
 *
 * The runner only starts clipping jobs; this is a read of a directory, so it
 * needs no job, no provider keys and no work directory.
 *
 * The module is invoked by path rather than with `-m`. The services package
 * imports every service, so `-m` would load the module twice and make runpy
 * print a warning. It depends on the standard library only, which is what makes
 * running it as a script safe.
 *
 * Both paths come from the same resolvers the pipeline uses. `pythonPath` is a
 * command name like `python3` on a default install, not a directory, so the
 * interpreter has to be resolved the way a job resolves it.
 */
async function runCache(
  userPythonPath: string,
  args: string[],
  cacheDir: string
): Promise<Record<string, unknown>> {
  const enginePath = getEnginePath()
  const python = resolvePythonPath(enginePath, userPythonPath)
  const script = join(enginePath, 'clip_engine', 'services', 'source_cache.py')
  if (!existsSync(python) || !existsSync(script)) throw new Error('missing engine')
  const { stdout } = await execFileAsync(python, [script, ...args], {
    timeout: LIST_TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true,
    env: {
      ...process.env,
      PYTHONPATH: enginePath,
      BRIDGECLIP_SOURCE_CACHE: cacheDir,
      LOCAL_MODE: 'true'
    }
  })
  return JSON.parse(stdout) as Record<string, unknown>
}

/** Only descriptive fields are accepted; a path in a record stays unused. */
function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  // Titles come from a video host, so they are untrusted: strip control
  // characters that a label or a log line should never carry.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

function count(value: unknown, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return Math.min(parsed, max)
}

function parseEntry(value: unknown): CachedSource | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const key = text(raw.key, 96)
  if (!SAFE_KEY.test(key)) return null
  return {
    key,
    title: text(raw.title, 200) || key,
    url: text(raw.url, 2048),
    sourceType: text(raw.sourceType, 20),
    width: Math.round(count(raw.width, 100_000)),
    height: Math.round(count(raw.height, 100_000)),
    durationSeconds: count(raw.durationSeconds, 1_000_000),
    bytes: Math.round(count(raw.bytes, Number.MAX_SAFE_INTEGER)),
    storedAt: Math.round(count(raw.storedAt, Number.MAX_SAFE_INTEGER)),
    lastUsedAt: Math.round(count(raw.lastUsedAt, Number.MAX_SAFE_INTEGER))
  }
}

/** What sources are already on disk, so a re-run can skip the download. */
export async function readSourceCache(
  pythonPath: string,
  cacheDir: string
): Promise<SourceCacheInfo> {
  try {
    const report = await runCache(pythonPath, ['--list'], cacheDir)
    const entries = Array.isArray(report.entries)
      ? report.entries.map(parseEntry).filter((entry): entry is CachedSource => entry !== null)
      : []
    return {
      enabled: report.enabled === true,
      totalBytes: Math.round(count(report.totalBytes, Number.MAX_SAFE_INTEGER)),
      entries,
      error: null
    }
  } catch {
    // A cache that cannot be read is not an error worth interrupting anyone
    // over: the list simply comes back empty and runs download as before.
    return { ...EMPTY_SOURCE_CACHE }
  }
}

/**
 * Delete one cached source.
 *
 * The key is checked here as well as in the engine, so a malformed value never
 * reaches an argument list at all.
 */
export async function deleteCachedSource(
  pythonPath: string,
  cacheDir: string,
  key: string
): Promise<{ ok: boolean }> {
  if (!SAFE_KEY.test(key)) return { ok: false }
  try {
    const report = await runCache(pythonPath, ['--delete', key], cacheDir)
    return { ok: report.ok === true }
  } catch {
    return { ok: false }
  }
}
