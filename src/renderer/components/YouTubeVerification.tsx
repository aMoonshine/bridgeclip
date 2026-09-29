import { useState } from 'react'
import { getApi } from '../lib/ipc'
import { TextArea } from './ui/Field'
import { Button } from './ui/Button'
import { youtubeId } from '../lib/utils'
export function YouTubeVerification({ source }: { source: string }): React.JSX.Element | null {
  const [pasting, setPasting] = useState(false)
  const [cookieText, setCookieText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const id = youtubeId(source)
  if (!id) return null
  return <div className="mt-2 space-y-2">
    <Button disabled={busy} onClick={() => { setPasting(!pasting); setCookieText(''); setMessage('') }}>Paste cookies</Button>
    {pasting && <div className="space-y-2">
      <TextArea aria-label="Cookies JSON from EditThisCookie" value={cookieText} onChange={event => setCookieText(event.target.value)} rows={5} spellCheck={false} autoComplete="off" placeholder="Paste the JSON array copied from EditThisCookie" />
      <Button disabled={busy || !cookieText.trim()} onClick={() => {
        setBusy(true); setMessage('')
        void getApi().youtube.pasteCookies(cookieText)
          .then(() => { setCookieText(''); setPasting(false); setMessage('Cookies saved and encrypted. Retry the download.') })
          .catch(error => setMessage(error instanceof Error ? error.message : 'Could not save cookies.'))
          .finally(() => setBusy(false))
      }}>Save cookies</Button>
      <Button disabled={busy} onClick={() => { setCookieText(''); setPasting(false) }}>Cancel</Button>
    </div>}
    <Button disabled={busy} onClick={() => {
      setBusy(true); setMessage('')
      void getApi().youtube.importCookies()
        .then(imported => { if (imported) setMessage('YouTube cookies imported and encrypted. Retry the download. The original export file is unchanged.') })
        .catch(error => setMessage(error instanceof Error ? error.message : 'Could not import cookies.'))
        .finally(() => setBusy(false))
    }}>Import YouTube cookies</Button>
    <p className="text-xs text-ink-muted" role="status">{message || 'Paste EditThisCookie JSON or import a cookies file. Cookies are encrypted on this computer and reused after restarting. Replace them only when the session expires.'}</p>
  </div>
}
