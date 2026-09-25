import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import {
  EMPTY_NEMO_RUNTIME,
  type NemoDevice,
  type NemoRuntimeInfo
} from '../shared/nemo-runtime'

const execFileAsync = promisify(execFile)

const DOCTOR_TIMEOUT_MS = 20_000
const MAX_DOCTOR_BYTES = 1_000_000
const MODEL_FILE = 'nemotron-3.5-asr-streaming-0.6b.q8_0.gguf'

/**
 * Locate the NeMo-Speech.cpp CLI inside an `engine-bin` directory.
 *
 * `engine-bin` holds the runtime, the model and the media tools, and sits
 * beside the Python `engine` directory rather than inside it, so the caller
 * passes that root explicitly rather than the engine package path.
 */
export function resolveNemoSpeech(engineBinPath: string): string | null {
  const executable = process.platform === 'win32' ? 'nemo-speech.exe' : 'nemo-speech'
  const direct = join(engineBinPath, 'nemo-speech', 'bin', executable)
  return existsSync(direct) ? direct : null
}

/**
 * Accept driver-supplied text only when it cannot carry a path or a control
 * character. The device name and description come from the GPU driver, so they
 * are untrusted input that would otherwise be shown in the UI and logged.
 */
function text(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null
  // eslint-disable-next-line no-control-regex -- strip control characters from driver-supplied text
  const cleaned = value.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/[\\/]/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned ? cleaned.slice(0, max) : null
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function parseDevices(value: unknown): NemoDevice[] {
  if (!Array.isArray(value)) return []
  const devices: NemoDevice[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const raw = entry as Record<string, unknown>
    const type = raw.type === 'gpu' ? 'gpu' : raw.type === 'cpu' ? 'cpu' : null
    if (!type) continue
    devices.push({
      index: numberOrNull(raw.index) ?? devices.length,
      name: text(raw.name, 40) ?? (type === 'gpu' ? 'GPU' : 'CPU'),
      type,
      description: text(raw.description, 80) ?? '',
      memoryTotal: numberOrNull(raw.memory_total)
    })
    if (devices.length >= 8) break
  }
  return devices
}

/**
 * Read what the local runtime can actually do.
 *
 * Only the device inventory, backend flags, version and model file name are
 * returned. No path, environment value or credential is exposed to the
 * renderer, and a failure is reported as a message rather than a raw error.
 */
export async function readNemoRuntime(engineBinPath: string): Promise<NemoRuntimeInfo> {
  const executable = resolveNemoSpeech(engineBinPath)
  if (!executable) {
    return { ...EMPTY_NEMO_RUNTIME, error: 'The local NeMo-Speech runtime is not installed.' }
  }
  try {
    const { stdout } = await execFileAsync(executable, ['doctor', '--json'], {
      timeout: DOCTOR_TIMEOUT_MS,
      maxBuffer: MAX_DOCTOR_BYTES,
      windowsHide: true
    })
    const report = JSON.parse(stdout) as Record<string, unknown>
    const features = (report.features ?? {}) as Record<string, unknown>
    const devices = parseDevices(report.devices)
    const modelPath = join(engineBinPath, 'models', MODEL_FILE)
    return {
      available: true,
      version: text(report.version, 20),
      acceleratorAvailable: report.accelerator_available === true,
      backendVulkan: features.backend_vulkan === true,
      backendCuda: features.backend_cuda === true,
      backendMetal: features.backend_metal === true,
      devices,
      modelName: existsSync(modelPath) ? MODEL_FILE : null,
      error: null
    }
  } catch (error) {
    const reason = error instanceof Error && error.message ? 'The local NeMo-Speech runtime could not be inspected.' : null
    return { ...EMPTY_NEMO_RUNTIME, error: reason ?? 'The local NeMo-Speech runtime could not be inspected.' }
  }
}
