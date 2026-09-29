export interface ImportedCookie {
  domain: string; name: string; value: string; path: string; secure: boolean;
  httpOnly: boolean; session: boolean; expirationDate?: number
}

export function parseYouTubeCookies(text: string, now = Date.now() / 1000): ImportedCookie[] {
  if (Buffer.byteLength(text, 'utf8') > 1024 * 1024) throw new Error('Cookie file is too large (maximum 1 MB). Export only YouTube cookies.')
  const input = text.replace(/^\uFEFF/, '').trim()
  const rows: Record<string, unknown>[] = []
  if (input.startsWith('[') || input.startsWith('{')) {
    let data: unknown
    try { data = JSON.parse(input) } catch { throw new Error('Invalid cookies JSON. Export cookies again.') }
    const items = Array.isArray(data) ? data : (data as { cookies?: unknown })?.cookies
    if (!Array.isArray(items)) throw new Error('Expected a cookies JSON array or an object with a cookies array.')
    for (const item of items) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Invalid cookie entry.')
      rows.push(item)
    }
  } else {
    if (!/^# (?:Netscape HTTP Cookie File|HTTP Cookie File)/.test(input)) throw new Error('Choose a Netscape cookies.txt file or a cookies JSON export.')
    for (const line of input.split(/\r?\n/)) {
      if (!line.trim() || (line.startsWith('#') && !line.startsWith('#HttpOnly_'))) continue
      const fields = line.replace(/^#HttpOnly_/, '').split('\t')
      if (fields.length !== 7 || !['TRUE','FALSE'].includes(fields[1]) || !['TRUE','FALSE'].includes(fields[3])) throw new Error('Invalid Netscape cookie row. Export cookies again.')
      rows.push({ domain: fields[0], path: fields[2], secure: fields[3] === 'TRUE', expirationDate: Number(fields[4]), name: fields[5], value: fields[6], httpOnly: line.startsWith('#HttpOnly_') })
    }
  }
  const cookies: ImportedCookie[] = []
  for (const row of rows) {
    if (typeof row.domain !== 'string') throw new Error('Cookie domain is missing.')
    const domain = row.domain.toLowerCase()
    if (domain !== 'youtube.com' && !domain.endsWith('.youtube.com')) continue
    // eslint-disable-next-line no-control-regex
    if (!/^\.?[a-z0-9.-]+$/.test(domain) || typeof row.name !== 'string' || !row.name || typeof row.value !== 'string' || /[\x00-\x20\x7f;=]/.test(row.name) || /[\x00-\x1f\x7f]/.test(row.value)) throw new Error('Invalid YouTube cookie fields.')
    const path = typeof row.path === 'string' ? row.path : '/'
    // eslint-disable-next-line no-control-regex
    if (!path.startsWith('/') || /[\x00-\x1f\x7f]/.test(path)) throw new Error('Invalid cookie path.')
    const expiry = row.expirationDate ?? row.expires ?? 0
    if (typeof expiry !== 'number' || !Number.isFinite(expiry) || expiry < 0) throw new Error('Invalid cookie expiration date.')
    const session = row.session === true || expiry === 0
    if (!session && expiry <= now) continue
    cookies.push({domain, name: row.name, value: row.value, path, secure: row.secure !== false, httpOnly: row.httpOnly === true, session, ...(!session ? {expirationDate: expiry} : {})})
  }
  if (!cookies.length) throw new Error('No unexpired YouTube cookies found. Export a fresh YouTube session.')
  if (Buffer.byteLength(JSON.stringify({cookies})) > 24000) throw new Error('Too many cookies. Export only the YouTube session.')
  return cookies
}
