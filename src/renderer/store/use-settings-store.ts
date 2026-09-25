import { create } from 'zustand'
import { errorMessage } from '../lib/utils'
import { getApi } from '../lib/ipc'
import type { ClipSettings, ToolStatus } from '../../preload/index'
import type { NemoRuntimeInfo } from '../../shared/nemo-runtime'
import { EMPTY_NEMO_RUNTIME } from '../../shared/nemo-runtime'

interface SettingsState extends ClipSettings {
  loaded: boolean
  saving: boolean
  toolStatus: ToolStatus | null
  checkingTools: boolean
  toolError: string | null
  /** What the local NeMo-Speech runtime can run, read on demand. */
  nemoRuntime: NemoRuntimeInfo
  checkingNemo: boolean
  load: () => Promise<void>
  save: (settings: Partial<ClipSettings>) => Promise<void>
  replaceApiKey: (key: 'openrouterApiKey' | 'zernioApiKey', value: string) => Promise<void>
  checkTools: () => Promise<void>
  refreshNemoRuntime: () => Promise<void>
}

// Queue writes so each partial update merges with the last successful save.
let saveQueue: Promise<void> = Promise.resolve()
let pendingSaves = 0
let latestToolCheck = 0

export const useSettingsStore = create<SettingsState>((set, get) => ({
  openrouterConfigured: false,
  zernioConfigured: false,
  outputDirectory: '',
  pythonPath: 'python3',
  customVocabulary: '',
  transcriptionBackend: 'openrouter',
  transcriptionDevice: 'auto',
  loaded: false,
  saving: false,
  toolStatus: null,
  checkingTools: false,
  toolError: null,
  nemoRuntime: EMPTY_NEMO_RUNTIME,
  checkingNemo: false,

  load: async () => {
    const settings = await getApi().settings.load()
    set({ ...pickSettings(settings), loaded: true })
  },

  save: (updates) => {
    const patch = { ...updates }
    pendingSaves += 1
    set({ saving: true })
    const task = saveQueue.then(async () => {
      const merged: ClipSettings = { ...pickSettings(get()), ...patch }
      const saved = await getApi().settings.save(merged)
      set({ ...pickSettings(saved), loaded: true })
    })
    saveQueue = task.catch(() => {})
    return task.finally(() => {
      pendingSaves -= 1
      set({ saving: pendingSaves > 0 })
    })
  },

  replaceApiKey: (key, value) => {
    pendingSaves += 1
    set({ saving: true })
    const task = saveQueue.then(async () => {
      const saved = await getApi().settings.replaceApiKey(key, value)
      set({ ...pickSettings(saved), loaded: true })
    })
    saveQueue = task.catch(() => {})
    return task.finally(() => {
      pendingSaves -= 1
      set({ saving: pendingSaves > 0 })
    })
  },

  checkTools: async () => {
    const request = ++latestToolCheck
    set({ checkingTools: true, toolError: null })
    try {
      const status = await getApi().system.checkTools()
      if (request === latestToolCheck) set({ toolStatus: status })
    } catch (err) {
      if (request === latestToolCheck) {
        set({ toolStatus: null, toolError: errorMessage(err, 'Could not check required tools. Try again in Settings.') })
      }
    } finally {
      if (request === latestToolCheck) set({ checkingTools: false })
    }
  },

  refreshNemoRuntime: async () => {
    set({ checkingNemo: true })
    try {
      const info = await getApi().system.nemoRuntime()
      set({ nemoRuntime: info })
    } catch {
      set({ nemoRuntime: { ...EMPTY_NEMO_RUNTIME, error: 'Could not read the local NeMo-Speech runtime.' } })
    } finally {
      set({ checkingNemo: false })
    }
  }
}))

function pickSettings(s: ClipSettings): ClipSettings {
  return {
    openrouterConfigured: s.openrouterConfigured,
    zernioConfigured: s.zernioConfigured,
    outputDirectory: s.outputDirectory,
    pythonPath: s.pythonPath,
    customVocabulary: s.customVocabulary,
    transcriptionBackend: s.transcriptionBackend,
    transcriptionDevice: s.transcriptionDevice
  }
}

export type SetupState = { ready: boolean; missingKeys: string[]; toolsOk: boolean | null }

/** Whether a clip job can start: the OpenRouter key is present and, once the
 *  system check has run, every required tool found. */
export function useSetupState(): SetupState {
  const openrouter = useSettingsStore((s) => s.openrouterConfigured)
  const tools = useSettingsStore((s) => s.toolStatus)
  const toolError = useSettingsStore((s) => s.toolError)
  const checkingTools = useSettingsStore((s) => s.checkingTools)
  const missingKeys = [!openrouter && 'OpenRouter'].filter(Boolean) as string[]
  const toolsOk = toolError ? false : tools
    ? tools.python && tools.pythonDeps && tools.ffmpeg && tools.ffprobe && tools.ytdlp && tools.engine && tools.bridgeRunner
    : null
  return { ready: missingKeys.length === 0 && toolsOk === true && !checkingTools, missingKeys, toolsOk }
}
