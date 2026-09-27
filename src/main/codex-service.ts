import { app, shell } from 'electron'
import { spawn, execFile, type ChildProcess } from 'child_process'
import { createInterface } from 'readline'
import { join } from 'path'
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
