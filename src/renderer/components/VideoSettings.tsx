import { Zap } from 'lucide-react'
import type { ClipSettings } from '../../preload/index'
import { Field } from './ui/Field'
import { IconTile } from './ui/IconTile'
import { Panel, PanelHeader } from './ui/Panel'
import { Select, type SelectOption } from './ui/Select'

const RESOLUTION_OPTIONS: SelectOption[] = [
  { value: 'source', label: 'Same as the source', detail: 'Keeps every pixel, so a tight crop into a face stays sharp' },
  { value: '2160', label: 'Up to 2160p (4K)', detail: 'Sharpest zoom, the largest download' },
  { value: '1440', label: 'Up to 1440p (2K)', detail: 'Good detail, noticeably smaller download' },
  { value: '1080', label: 'Up to 1080p', detail: 'Fastest download; matches the 1080×1920 output' },
  { value: '720', label: 'Up to 720p', detail: 'Smallest download, soft on a tight crop' }
]

const ENCODER_OPTIONS: SelectOption[] = [
  { value: 'cpu', label: 'Processor', detail: 'Software encoding. Highest quality per bit, no GPU needed' },
  { value: 'nvenc', label: 'Graphics card (NVENC)', detail: 'NVIDIA hardware encoder. Needs an NVIDIA GPU with a working driver' },
  { value: 'auto', label: 'Automatic', detail: 'Use the graphics card when it works, otherwise the processor' }
]

const CONCURRENCY_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Automatic', detail: 'Sized from the number of processor cores' },
  { value: '1', label: '1 clip at a time', detail: 'Slowest, gentlest on the provider rate limit' },
  { value: '2', label: '2 clips at a time', detail: 'Conservative' },
  { value: '4', label: '4 clips at a time', detail: 'Balanced' },
  { value: '6', label: '6 clips at a time', detail: 'Faster, more likely to be rate-limited' },
  { value: '8', label: '8 clips at a time', detail: 'Fastest, highest chance of provider rate-limiting' }
]

/**
 * Choose how the source is downloaded, how clips are encoded, and how many run
 * at once.
 *
 * These three trade against each other on purpose. A lower source ceiling makes
 * the download faster but softens a crop into a face. Encoding on the graphics
 * card frees the processor, which only pays off once several clips run at once.
 * A higher clip count shortens the run but sends more vision requests at the
 * provider at the same time.
 */
export function VideoSettings({
  downloadResolution,
  videoEncoder,
  renderConcurrency,
  onCommit
}: {
  downloadResolution: ClipSettings['downloadResolution']
  videoEncoder: ClipSettings['videoEncoder']
  renderConcurrency: number
  onCommit: (patch: Partial<ClipSettings>) => void
}): React.JSX.Element {
  const encoder = videoEncoder
  const concurrency = String(renderConcurrency)

  return <Panel>
    <PanelHeader
      icon={<IconTile tone="neutral"><Zap /></IconTile>}
      title="Video and performance"
      description="Control download size, which device encodes the clips, and how many run at once."
    />

    <div className="mt-4 grid gap-4">
      <Field
        label="Source quality"
        htmlFor="download-resolution"
        hint="A lower ceiling downloads less. Smart framing can crop hard into a face, where extra source pixels are visible."
      >
        <Select
          id="download-resolution"
          value={downloadResolution}
          onChange={(value) => onCommit({ downloadResolution: value as ClipSettings['downloadResolution'] })}
          options={RESOLUTION_OPTIONS}
        />
      </Field>

      <Field
        label="Encode clips with"
        htmlFor="video-encoder"
        hint="The graphics card is faster for long clips. On short clips its setup costs about what it saves, and it needs an NVIDIA GPU."
      >
        <Select
          id="video-encoder"
          value={encoder}
          onChange={(value) => onCommit({ videoEncoder: value as ClipSettings['videoEncoder'] })}
          options={ENCODER_OPTIONS}
        />
      </Field>

      <Field
        label="Clips at a time"
        htmlFor="render-concurrency"
        hint="Each clip also sends a layout request, so a higher number means more requests to the AI provider at once."
      >
        <Select
          id="render-concurrency"
          value={CONCURRENCY_OPTIONS.some((option) => option.value === concurrency) ? concurrency : '0'}
          onChange={(value) => onCommit({ renderConcurrency: Number(value) })}
          options={CONCURRENCY_OPTIONS}
        />
      </Field>
    </div>
  </Panel>
}
