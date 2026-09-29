import { useState } from 'react'
import { getApi } from '../lib/ipc'
import { useSettingsStore } from '../store/use-settings-store'
import { Panel } from './ui/Panel'
import { Button } from './ui/Button'
import type { CodexStatus } from '../../shared/codex'

export function CodexSettings({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const { codexModel, codexReasoning, saving, save } = useSettingsStore()
  const [status, setStatus] = useState<CodexStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function check(login: boolean): Promise<void> {
    setBusy(true); setError(''); setNotice('')
    try { setStatus(await (login ? getApi().codex.login() : getApi().codex.status())) }
    catch (e) { setStatus(null); setError(e instanceof Error ? e.message : 'Could not connect to Codex.') }
    finally { setBusy(false) }
  }
  async function updateSignIn(): Promise<void> {
    setBusy(true); setError(''); setNotice('')
    try {
      await getApi().codex.refreshAuth()
      setStatus(null)
      setNotice('Sign-in data updated locally. Click Check connection when ready.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update sign-in data.') }
    finally { setBusy(false) }
  }
  const selected = status?.models.find(m => m.id === codexModel)
  const efforts = selected?.reasoningEfforts ?? []
  const Wrapper = compact ? 'div' : Panel
  return <Wrapper>
    {!compact && <h2 className="text-sm font-semibold text-ink">Codex connection</h2>}
    <p className="mt-2 text-xs text-ink-muted">Quality: planning, local face tracking and image checks for uncertain shots. Economy: planning and local framing. Uses your ChatGPT subscription limits. Whisper transcription still uses OpenRouter.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button disabled={busy} onClick={() => void updateSignIn()}>Update sign-in from Codex</Button>
      <Button disabled={busy} onClick={() => void check(true)}>Sign in with ChatGPT</Button>
      <Button disabled={busy} onClick={() => void check(false)}>{busy ? 'Connecting...' : 'Check connection'}</Button>
    </div>
    {!status && !notice && <p className="mt-2 text-xs text-ink-muted">Connection not checked. Checks run only when you click Check connection.</p>}
    {notice && <p className="mt-2 text-xs" role="status">{notice}</p>}
    {status && <p className="mt-2 text-xs" role="status">{status.connected ? 'Connected with ChatGPT' : 'Not signed in. Use Sign in with ChatGPT.'}</p>}
    {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
    <label className="mt-4 block text-xs text-ink-muted" htmlFor="codex-model">Planning and Vision model</label>
    <select id="codex-model" value={codexModel} disabled={busy || saving || !status?.connected}
      className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-ink"
      onChange={(event) => { const model = status?.models.find(m => m.id === event.target.value); void save({ codexModel: event.target.value, codexReasoning: model?.reasoningEfforts?.includes(codexReasoning) ? codexReasoning : model?.reasoningEfforts?.includes('low') ? 'low' : model?.defaultReasoningEffort ?? 'low' }).catch(() => setError('Could not save model.')) }}>
      {!status?.models.some(m => m.id === codexModel && m.vision) && <option value={codexModel}>{codexModel}{status?.connected ? ' - unavailable; choose another' : ''}</option>}
      {status?.models.filter(m => m.vision).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
    <label className="mt-3 block text-xs text-ink-muted" htmlFor="codex-reasoning">Reasoning level</label>
    <select id="codex-reasoning" value={codexReasoning} disabled={busy || saving || !status?.connected || !efforts.length}
      className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-ink"
      onChange={event => { void save({ codexReasoning: event.target.value }).catch(() => setError('Could not save reasoning level.')) }}>
      {!efforts.includes(codexReasoning) && <option value={codexReasoning}>{codexReasoning}</option>}
      {efforts.map(effort => <option key={effort} value={effort}>{effort}</option>)}
    </select>
    <p className="mt-2 text-xs text-ink-muted">Selected: {codexModel} / {codexReasoning}. Applies to planning and image checks. Higher reasoning can take longer; it does not guarantee better framing.</p>
    <p className="mt-2 text-2xs text-ink-subtle">Update sign-in from Codex copies saved credentials on this computer without connecting. Check connection contacts Codex and refreshes available models. Starting a clipping run also connects to Codex.</p>
  </Wrapper>
}
