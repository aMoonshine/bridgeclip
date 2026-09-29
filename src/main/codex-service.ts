import { app, shell } from 'electron'
import { spawn, execFile, type ChildProcess } from 'child_process'
import { createInterface } from 'readline'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'fs'
import { randomUUID } from 'crypto'
import { loadSettings } from './settings-store'
import { getEnginePath, resolvePythonPath } from './pipeline-runner'
import type { CodexStatus } from '../shared/codex'

let inFlight: Promise<CodexStatus> | null = null
let active: ChildProcess | null = null
export function stopCodexConnection(): void {
  if (!active?.pid) return
  if (process.platform === 'win32') execFile('taskkill', ['/PID', String(active.pid), '/T', '/F'], { windowsHide: true }, () => {})
  else { try { process.kill(-active.pid, 'SIGTERM') } catch { active.kill() } }
}

export function checkCodex(login = false): Promise<CodexStatus> {
  if (inFlight) return inFlight
  inFlight = run(login).finally(() => { inFlight = null })
  return inFlight
}

export function hasSavedCodexAuth(): boolean {
  return existsSync(join(app.getPath('userData'), 'codex', 'auth.json'))
}

// Local import only: never start Codex or return credential contents over IPC.
export function refreshCodexAuth(): void {
  if (inFlight) throw new Error('Wait for the current Codex connection check or sign-in to finish.')
  const source = join(process.env.CODEX_HOME || join(app.getPath('home'), '.codex'), 'auth.json')
  let contents: string
  try { contents = readFileSync(source, 'utf8') }
  catch { throw new Error('No readable Codex sign-in file. Sign in with ChatGPT here, or sign in to Codex first.') }
  let auth: { tokens?: { access_token?: unknown; refresh_token?: unknown; id_token?: unknown } }
  try { auth = JSON.parse(contents) }
  catch { throw new Error('Codex sign-in file is invalid. Sign in to Codex again, then retry.') }
  if (!auth?.tokens || !['access_token', 'refresh_token', 'id_token'].every(key => {
    const value = auth.tokens![key as keyof typeof auth.tokens]
    return typeof value === 'string' && value.trim().length > 0
  })) throw new Error('Codex sign-in file is invalid or does not contain a ChatGPT login. Use Sign in with ChatGPT.')
  const directory = join(app.getPath('userData'), 'codex')
  const temporary = join(directory, 'auth-' + randomUUID() + '.tmp')
  try {
    mkdirSync(directory, { recursive: true, mode: 0o700 })
    writeFileSync(temporary, contents, { flag: 'wx', mode: 0o600 })
    renameSync(temporary, join(directory, 'auth.json'))
  } catch { throw new Error('Could not save BridgeClip sign-in data. Close active Codex tasks in BridgeClip and retry.') }
  finally { rmSync(temporary, { force: true }) }
}

function run(login: boolean): Promise<CodexStatus> {
  return new Promise((resolve, reject) => {
    const engine = getEnginePath()
    const child = spawn(resolvePythonPath(engine, loadSettings().pythonPath),
      ['-m', 'clip_engine.services.codex_provider', login ? '--login' : '--status'], {
        cwd: engine, windowsHide: true, detached: process.platform !== 'win32',
        env: { ...process.env, PYTHONPATH: engine, PYTHONUTF8: '1',
          BRIDGECLIP_CODEX_HOME: join(app.getPath('userData'), 'codex') },
        stdio: ['ignore', 'pipe', 'ignore']
      })
    active = child
    let result: CodexStatus | undefined
    let error = 'Codex connection failed. Check that Codex is installed and try connecting again.'
    const timer = setTimeout(() => { stopCodexConnection(); reject(new Error('Codex connection timed out. Retry in Settings.')) }, login ? 200000 : 60000)
    const lines = createInterface({ input: child.stdout! })
    lines.on('line', (line) => {
      try {
        const data = JSON.parse(line)
        if (typeof data.authUrl === 'string' && login) {
          const url = new URL(data.authUrl)
          if (url.protocol === 'https:' && ['auth.openai.com', 'chatgpt.com', 'auth0.openai.com'].includes(url.hostname)) {
            void shell.openExternal(url.toString()).catch(() => { error = 'Could not open the sign-in browser.' })
          }
        }
        if (typeof data.connected === 'boolean' && Array.isArray(data.models)) result = data
        if (typeof data.error === 'string') error = data.error
      } catch { /* Ignore malformed protocol lines. */ }
    })
    child.on('error', () => { clearTimeout(timer); lines.close(); reject(new Error(error)) })
    child.on('close', (code) => { if (active === child) active = null; clearTimeout(timer); lines.close(); if (code === 0 && result) resolve(result); else reject(new Error(error)) })
  })
}
