/** Local NeMo-Speech.cpp runtime inventory, shared by the main process and the renderer. */

/** Device names NeMo-Speech.cpp accepts for `--device`, plus an indexed form for multi-GPU hosts. */
export const TRANSCRIPTION_DEVICES = ['auto', 'cpu', 'cuda', 'vulkan', 'metal', 'gpu'] as const

const INDEXED_DEVICE = /^(cuda|vulkan|metal|gpu):\d{1,2}$/

/**
 * Normalise a requested device, or return null when it is not one of the
 * documented values. The result reaches a subprocess argv, so anything
 * unrecognised is refused rather than forwarded.
 */
export function normalizeDevice(value: string | undefined | null): string | null {
  const device = (value ?? '').trim().toLowerCase()
  if (!device) return 'auto'
  if ((TRANSCRIPTION_DEVICES as readonly string[]).includes(device)) return device
  return INDEXED_DEVICE.test(device) ? device : null
}

/** True when the device can be forwarded to the runtime. */
export function isSelectableDevice(value: string | undefined | null): boolean {
  return normalizeDevice(value) !== null
}

/** One device reported by `nemo-speech doctor --json`. */
export interface NemoDevice {
  index: number
  name: string
  type: 'gpu' | 'cpu'
  description: string
  memoryTotal: number | null
}

/** A device the user may choose, plus what the runtime can actually run. */
export interface NemoRuntimeInfo {
  available: boolean
  version: string | null
  /** True when a GPU backend is compiled in and a GPU was detected. */
  acceleratorAvailable: boolean
  backendVulkan: boolean
  backendCuda: boolean
  backendMetal: boolean
  devices: NemoDevice[]
  /** The model BridgeClip will use for local transcription. */
  modelName: string | null
  /** Present when the runtime could not be inspected. */
  error: string | null
}

export const EMPTY_NEMO_RUNTIME: NemoRuntimeInfo = {
  available: false,
  version: null,
  acceleratorAvailable: false,
  backendVulkan: false,
  backendCuda: false,
  backendMetal: false,
  devices: [],
  modelName: null,
  error: null
}

/**
 * Human label for a device, e.g. "Vulkan0 (NVIDIA GeForce RTX 3090)".
 *
 * The text originates from the GPU driver, so it is sanitised here as well as
 * in the parser. This function runs in the renderer, and a device label has no
 * reason to contain a path separator.
 */
export function deviceLabel(device: NemoDevice): string {
  if (device.type === 'cpu') return 'CPU'
  const name = safeLabel(device.name) || 'GPU'
  const detail = safeLabel(device.description)
  return detail ? `${name} (${detail})` : name
}

function safeLabel(value: string | undefined): string {
  if (!value) return ''
  // eslint-disable-next-line no-control-regex -- strip control characters from driver text
  return value.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/[\\/]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}
