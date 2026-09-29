import type { YouTubeSessionStatus } from '../../shared/youtube'
import { useEffect, useState } from 'react'
import { getApi } from '../lib/ipc'
import { TextArea } from './ui/Field'
import { Button } from './ui/Button'
import { youtubeId } from '../lib/utils'
export function YouTubeVerification({ source }: { source?: string }): React.JSX.Element | null {
  const [pasting, setPasting] = useState(false)
  const [cookieText, setCookieText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<YouTubeSessionStatus | null>(null)
  const visible = source === undefined || !!youtubeId(source)
  useEffect(() => {
    if (!visible) return
    let active = true
    void getApi().youtube.sessionStatus().then(value => { if (active) setStatus(value) })
      .catch(() => { if (active) setMessage('Could not read saved cookies. Import them again.') })
    return () => { active = false }
  }, [visible])
  if (!visible) return null
  return <div className="mt-2 space-y-2">
    {status && <p className="text-xs text-ink-muted">{status.saved
      ? `${status.count} cookies saved on ${new Date(status.savedAt!).toLocaleString()}. Shared by all jobs.`
      : 'No YouTube cookies saved.'}</p>}
    <Button disabled={busy} onClick={() => { setPasting(!pasting); setCookieText(''); setMessage('') }}>Paste cookies</Button>
    {pasting && <div className="space-y-2">
      <TextArea aria-label="Cookies JSON from EditThisCookie" value={cookieText} onChange={event => setCookieText(event.target.value)} rows={5} spellCheck={false} autoComplete="off" placeholder="Paste the JSON array copied from EditThisCookie" />
      <Button disabled={busy || !cookieText.trim()} onClick={() => {
        setBusy(true); setMessage('')
        void getApi().youtube.pasteCookies(cookieText)
          .then(saved => { setStatus(saved); setCookieText(''); setPasting(false); setMessage('Cookies saved, encrypted and read back successfully. Used by the next download or retry.') })
          .catch(error => setMessage(error instanceof Error ? error.message : 'Could not save cookies.'))
          .finally(() => setBusy(false))
      }}>Save cookies</Button>
      <Button disabled={busy} onClick={() => { setCookieText(''); setPasting(false) }}>Cancel</Button>
    </div>}
    <Button disabled={busy} onClick={() => {
      setBusy(true); setMessage('')
      void getApi().youtube.importCookies()
        .then(async imported => { if (imported) { setStatus(await getApi().youtube.sessionStatus()); setMessage('Cookies imported and encrypted. Used by the next download or retry.') } })
        .catch(error => setMessage(error instanceof Error ? error.message : 'Could not import cookies.'))
        .finally(() => setBusy(false))
    }}>Import YouTube cookies</Button>
    <p className="text-xs text-ink-muted" role="status">{message || 'Paste EditThisCookie JSON or import a cookies file. Cookies are encrypted on this computer and reused after restarting. YouTube may require a fresh export even while your browser is signed in.'}</p>
  </div>
}
