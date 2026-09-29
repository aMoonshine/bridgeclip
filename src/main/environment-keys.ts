import { app } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseEnv } from 'util'

export function environmentKeys(): { openrouterApiKey: string; zernioApiKey: string } {
  let file: Record<string, string | undefined> = {}
  const root = app.isPackaged || process.env.BRIDGECLIP_E2E === '1' ? app.getPath('userData') : app.getAppPath()
  try { file = parseEnv(readFileSync(join(root, '.env'), 'utf8')) } catch { /* Optional local fallback. */ }
  return {
    openrouterApiKey: (process.env.OPENROUTER_API_KEY || file.OPENROUTER_API_KEY || '').trim(),
    zernioApiKey: (process.env.ZERNIO_API_KEY || file.ZERNIO_API_KEY || '').trim()
  }
}
