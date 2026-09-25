import { useMemo } from 'react'
import { Gauge, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'
import { deviceLabel, type NemoRuntimeInfo } from '../../shared/nemo-runtime'
import type { ClipSettings } from '../../preload/index'
import { Button } from './ui/Button'
import { Callout } from './ui/Callout'
import { Field } from './ui/Field'
import { IconTile } from './ui/IconTile'
import { Panel, PanelHeader } from './ui/Panel'
import { Select, type SelectOption } from './ui/Select'

/**
 * Choose where speech is transcribed and on which device.
 *
 * The runtime inventory comes from the main process, which runs
 * `nemo-speech doctor --json`. Only device names, backend flags and the model
 * file name reach the renderer, so this panel can show what will actually run
 * without exposing a path or a credential.
 */
export function TranscriptionSettings({
  backend,
  device,
  runtime,
  checking,
  error,
  onCommit,
  onRefresh
}: {
  backend: ClipSettings['transcriptionBackend']
  device: string
  runtime: NemoRuntimeInfo
  checking: boolean
  error: string | null
  onCommit: (patch: Partial<ClipSettings>) => void
  onRefresh: () => void
}): React.JSX.Element {
  const options = useMemo(() => deviceOptions(runtime), [runtime])
  const local = backend === 'nemotron'
  const gpu = runtime.devices.find((entry) => entry.type === 'gpu')
  const usingGpu = local && device !== 'cpu' && Boolean(gpu)

  return <Panel>
    <PanelHeader
      icon={<IconTile tone={runtime.acceleratorAvailable ? 'success' : 'neutral'}><Gauge /></IconTile>}
      title="Transcription"
      description="Turn speech into text with timestamps. Local keeps the audio on this computer and costs nothing."
      action={
        <Button
          size="sm"
          onClick={onRefresh}
          disabled={checking}
          icon={<RefreshCw className={cn('h-3.5 w-3.5', checking && 'animate-spin')} />}
        >
          Detect
        </Button>
      }
    />

    <div className="mt-4 grid gap-4">
      <Field label="Runs on" htmlFor="transcription-backend">
        <Select
          id="transcription-backend"
          value={backend}
          onChange={(value) => onCommit({ transcriptionBackend: value === 'openrouter' ? 'openrouter' : 'nemotron' })}
          options={[
            { value: 'nemotron', label: 'This computer', detail: 'Nemotron via NeMo-Speech, no API cost' },
            { value: 'openrouter', label: 'OpenRouter', detail: 'Sends the audio, billed per minute' }
          ]}
        />
      </Field>

      {local && <Field
        label="Device"
        htmlFor="transcription-device"
        hint="Automatic uses the graphics card when one is available, and the processor otherwise."
      >
        <Select
          id="transcription-device"
          value={device}
          onChange={(value) => onCommit({ transcriptionDevice: value })}
          options={options}
          disabled={checking}
        />
      </Field>}

      {local && error && <Callout tone="danger">{error}</Callout>}

      {local && !error && !runtime.available && (
        <Callout tone="warning">The local NeMo-Speech runtime is not installed. Transcription will fail until it is present.</Callout>
      )}

      {local && runtime.available && (
        <Callout tone={runtime.acceleratorAvailable ? 'success' : 'warning'}>
          <div className="space-y-1">
            <p className="font-medium">
              {usingGpu ? 'Using the graphics card' : 'Using the processor'}
            </p>
            <p className="text-2xs opacity-80">
              {runtime.modelName ?? 'No local model file is installed.'}
              {gpu ? ` · ${deviceLabel(gpu)}` : ''}
              {runtime.version ? ` · NeMo-Speech ${runtime.version}` : ''}
            </p>
            {!runtime.acceleratorAvailable && (
              <p className="text-2xs opacity-80">
                No accelerated backend is compiled into this runtime. Install the Vulkan or CUDA build of
                NeMo-Speech to use the graphics card.
              </p>
            )}
          </div>
        </Callout>
      )}
    </div>
  </Panel>
}

function deviceOptions(runtime: NemoRuntimeInfo): SelectOption[] {
  const options: SelectOption[] = [
    { value: 'auto', label: 'Automatic', detail: 'Graphics card when available' },
    { value: 'cpu', label: 'Processor', detail: 'Always available' }
  ]
  for (const entry of runtime.devices) {
    if (entry.type !== 'gpu') continue
    // Only offer a device the runtime can actually drive.
    const isVulkan = runtime.backendVulkan && entry.name.toLowerCase().includes('vulkan')
    const backend = isVulkan ? 'vulkan' : runtime.backendCuda ? 'cuda' : null
    if (!backend) continue
    options.push({
      value: `${backend}:${entry.index}`,
      label: `Graphics card ${entry.index}`,
      detail: entry.description || entry.name
    })
  }
  return options
}
