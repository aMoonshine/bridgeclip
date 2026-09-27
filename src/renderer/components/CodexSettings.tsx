import { useState } from 'react'
import { getApi } from '../lib/ipc'
import { useSettingsStore } from '../store/use-settings-store'
import { Panel } from './ui/Panel'
import { Button } from './ui/Button'
import type { CodexStatus } from '../../shared/codex'

export function CodexSettings(): React.JSX.Element {
  const { codexModel, save } = useSettingsStore()
  const [status, setStatus] = useState<CodexStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function check(login: boolean): Promise<void> {
    setBusy(true); setError('')
    try { setStatus(await (login ? getApi().codex.login() : getApi().codex.status())) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not connect to Codex.') }
    finally { setBusy(false) }
  }
  return <Panel>
    <h2 className="text-sm font-semibold text-ink">Codex connection</h2>
    <p className="mt-2 text-xs text-ink-muted">Quality: planning and image checks. Economy: planning only. Uses your ChatGPT subscription limits. Whisper transcription still uses OpenRouter.</p>
    <div className="mt-3 flex gap-2">
      <Button disabled={busy} onClick={() => void check(true)}>Sign in with ChatGPT</Button>
      <Button disabled={busy} onClick={() => void check(false)}>{busy ? 'Connecting?' : 'Check connection'}</Button>
    </div>
    {status && <p className="mt-2 text-xs" role="status">{status.connected ? 'Connected with ChatGPT' : 'Not signed in. Use Sign in with ChatGPT.'}</p>}
    {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
    <label className="mt-4 block text-xs text-ink-muted" htmlFor="codex-model">Planning and Vision model</label>
    <select id="codex-model" value={codexModel} disabled={busy || !status?.connected}
      className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-ink"
      onChange={(event) => { void save({ codexModel: event.target.value }).catch(() => setError('Could not save model.')) }}>
      {!status?.models.some(m => m.id === codexModel && m.vision) && <option value={codexModel}>{codexModel}{status?.connected ? ' ? unavailable; choose another' : ''}</option>}
      {status?.models.filter(m => m.vision).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
    <p className="mt-2 text-2xs text-ink-subtle">Check connection to refresh available models. No automatic switch to a paid API when Codex fails.</p>
  </Panel>
}
