import type { YouTubeSessionStatus } from '../shared/youtube'
import { app, BrowserWindow, dialog, safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync, renameSync, statSync, rmSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { parseYouTubeCookies } from './youtube-cookies'

const snapshotPath = (): string => join(app.getPath('userData'), 'youtube-session.enc')
export function savedYouTubeSession(): string | undefined {
  if (!existsSync(snapshotPath())) return undefined
  try { return safeStorage.decryptString(readFileSync(snapshotPath())) }
  catch { throw new Error('Could not read the saved YouTube session. Import your YouTube cookies again.') }
}

export function youtubeSessionStatus(): YouTubeSessionStatus {
  const raw = savedYouTubeSession()
  if (!raw) return { saved: false, count: 0, savedAt: null }
  const data = JSON.parse(raw)
  return { saved: true, count: data.cookies.length, savedAt: new Date(statSync(snapshotPath()).mtimeMs).toISOString() }
}

export async function importYouTubeCookies(parent: BrowserWindow | null): Promise<boolean> {
  const options = { title: 'Import YouTube cookies', properties: ['openFile'] as ['openFile'], filters: [{ name: 'Cookie exports', extensions: ['txt', 'json'] }] }
  const chosen = await (parent ? dialog.showOpenDialog(parent, options) : dialog.showOpenDialog(options))
  if (chosen.canceled || !chosen.filePaths[0]) return false
  if (!safeStorage.isEncryptionAvailable() || (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text')) throw new Error('Unlock your system keychain before importing cookies.')
  let text: string
  try {
    if (statSync(chosen.filePaths[0]).size > 1024 * 1024) throw new Error('too large')
    text = readFileSync(chosen.filePaths[0], 'utf8')
  } catch { throw new Error('Could not read the cookie export. Choose a file smaller than 1 MB.') }
  savePastedYouTubeCookies(text)
  return true
}

export function savePastedYouTubeCookies(text: unknown): YouTubeSessionStatus {
  if (typeof text !== 'string') throw new Error('Paste a cookie JSON export.')
  if (!safeStorage.isEncryptionAvailable() || (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text')) throw new Error('Unlock your system keychain before importing cookies.')
  const cookies = parseYouTubeCookies(text)
  const temporary = snapshotPath() + '.' + randomUUID() + '.tmp'
  try {
    const contents = safeStorage.encryptString(JSON.stringify({cookies}))
    writeFileSync(temporary, contents, {mode: 0o600, flag: 'wx'})
    renameSync(temporary, snapshotPath())
    if (savedYouTubeSession() !== JSON.stringify({cookies})) throw new Error('Read-back failed')
  } catch { throw new Error('Could not encrypt and save the imported YouTube cookies.') }
  finally { rmSync(temporary, {force: true}) }
  return youtubeSessionStatus()
}
