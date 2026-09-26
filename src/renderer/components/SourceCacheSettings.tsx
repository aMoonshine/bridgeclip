import { useEffect, useState } from 'react'
import { FolderOpen, HardDrive, RefreshCw, Trash2 } from 'lucide-react'
import { getApi } from '../lib/ipc'
import { cn, errorMessage } from '../lib/utils'
import type { CachedSource, SourceCacheInfo } from '../../shared/source-cache'
import { Button } from './ui/Button'
import { Callout } from './ui/Callout'
import { TextInput } from './ui/Field'
import { IconTile } from './ui/IconTile'
import { Panel, PanelHeader } from './ui/Panel'

function gigabytes(bytes: number): string {
  if (bytes >= 1000 ** 3) return `${(bytes / 1000 ** 3).toFixed(1)} GB`
  if (bytes >= 1000 ** 2) return `${(bytes / 1000 ** 2).toFixed(0)} MB`
  return `${Math.max(1, Math.round(bytes / 1000))} KB`
}

function length(seconds: number): string {
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.round((total % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function when(epochSeconds: number): string {
  if (!epochSeconds) return ''
  return new Date(epochSeconds * 1000).toLocaleDateString()
}

function Row({
  entry,
  busy,
  onDelete
}: {
  entry: CachedSource
  busy: boolean
  onDelete: () => void
}): React.JSX.Element {
  return <li className="flex items-start justify-between gap-3 border-b border-default/60 py-2.5 last:border-b-0">
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-default" title={entry.title}>{entry.title}</p>
      <p className="mt-0.5 text-2xs text-muted">
        {entry.height > 0 && `${entry.height}p`}
        {entry.width > 0 && ` · ${entry.width}×${entry.height}`}
        {' · '}{length(entry.durationSeconds)}
        {' · '}{gigabytes(entry.bytes)}
        {when(entry.lastUsedAt) && ` · used ${when(entry.lastUsedAt)}`}
      </p>
    </div>
    <Button
      size="sm"
      variant="ghost"
      onClick={onDelete}
      disabled={busy}
      aria-label={`Delete the cached source ${entry.title}`}
      icon={<Trash2 className={cn('h-3.5 w-3.5', busy && 'opacity-50')} />}
    >
      Delete
    </Button>
  </li>
}

/**
 * Sources already downloaded, so a re-run can skip the download.
 *
 * Deleting frees the disk immediately; the next run of that video downloads it
 * again, so this is a disk decision, not an undo.
 */
export function SourceCacheSettings({
  cache,
  directory,
  deleting,
  onRefresh,
  onDelete,
  onDirectory
}: {
  cache: SourceCacheInfo
  directory: string
  deleting: string | null
  onRefresh: () => void
  onDelete: (key: string) => void
  onDirectory: (dir: string) => void
}): React.JSX.Element {
  useEffect(() => { onRefresh() }, [onRefresh])
  const [error, setError] = useState<string | null>(null)

  const choose = async (): Promise<void> => {
    try {
      const dir = await getApi().settings.selectSourceCacheDir()
      if (dir) {
        setError(null)
        onDirectory(dir)
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not choose a sources folder'))
    }
  }

  const open = async (): Promise<void> => {
    try {
      if (!(await getApi().shell.openPath(directory))) setError('Could not open the sources folder')
      else setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not open the sources folder'))
    }
  }

  return <Panel>
    <PanelHeader
      icon={<IconTile tone={cache.entries.length > 0 ? 'success' : 'neutral'}><HardDrive /></IconTile>}
      title="Downloaded sources"
      description="Videos kept on disk after a run, so cutting the same one again does not download it twice."
      action={
        <Button
          size="sm"
          onClick={onRefresh}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh
        </Button>
      }
    />

    <div className="mt-4">
      <div className="flex items-center gap-2">
        <TextInput
          className="flex-1"
          mono
          value={directory}
          readOnly
          title="Use Change to choose a folder"
          leading={<FolderOpen className="h-3.5 w-3.5" />}
          aria-label="Folder for downloaded sources"
        />
        <Button onClick={() => void choose()}>Change</Button>
        <Button variant="ghost" onClick={() => void open()} disabled={!directory}>
          Open
        </Button>
      </div>
      <p className="mt-1.5 text-2xs text-muted">
        Point this at a drive with room to spare. Sources here are never deleted by a
        run; use Delete below, or clear the folder yourself.
      </p>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}

      {!cache.enabled && (
        <Callout tone="warning">
          The source cache is not available, so every run downloads its video again.
        </Callout>
      )}

      {cache.enabled && cache.entries.length === 0 && (
        <Callout tone="info">
          Nothing cached yet. The source of the next run you finish will be kept here.
        </Callout>
      )}

      {cache.entries.length > 0 && (
        <>
          <p className="mb-1 text-2xs text-muted">
            {cache.entries.length} source{cache.entries.length === 1 ? '' : 's'} · {gigabytes(cache.totalBytes)} on disk
          </p>
          <ul className="flex flex-col">
            {cache.entries.map((entry) => <Row
              key={entry.key}
              entry={entry}
              busy={deleting === entry.key}
              onDelete={() => onDelete(entry.key)}
            />)}
          </ul>
        </>
      )}
    </div>
  </Panel>
}
