import { create } from 'zustand'
import { isModelId } from '../../shared/openrouter-models'

/** The Create wizard's steps, in order. */
export type WizardStep = 'video' | 'format' | 'clips' | 'captions' | 'review'

/** The run the wizard just queued, shown as a confirmation until the next video. */
export interface StartedJob {
  jobId: string
  source: string
  /** True when every slot was busy and the job is waiting its turn. */
  queued: boolean
}

/**
 * The Create form, kept outside the component so the chosen video and options
 * survive navigating away (e.g. to Settings to add a key) and a failed run.
 */
export interface ClipDraft {
  source: string
  clippingMode: 'quality' | 'economy' | 'advanced'
  plannerModel: string
  transcriptionModel: string
  aspectRatio: '9:16' | '16:9'
  /** 9:16 framing: smart per-shot layouts, always full frame, or letterbox. */
  layoutStyle: 'auto' | 'fill' | 'fit'
  /** Paid vision verification for ambiguous shots in Smart framing. */
  layoutVision: boolean
  /** tight: cut dead air and filler words; natural: original timing. */
  pacing: 'tight' | 'natural'
  videoSpeed: number
  durations: string[]
  autoClipCount: boolean
  maxClips: number
  includeCaptions: boolean
  captionPreset: string
  trimOpen: boolean
  trimStart: string
  trimEnd: string
}

interface DraftState extends ClipDraft {
  step: WizardStep
  started: StartedJob | null
  update: (patch: Partial<ClipDraft>) => void
  setStep: (step: WizardStep) => void
  clearSource: () => void
  /** The job was queued: show the confirmation. */
  markStarted: (started: StartedJob) => void
  /** Back to the first step for the next video, keeping every other choice. */
  startAnother: () => void
}

/**
 * Stays on disk between launches so the same models and framing do not have to
 * be picked again every time the app is opened.
 *
 * The source video and the trim are deliberately excluded: those belong to one
 * video, and restoring a stale path would offer a file the user has moved.
 */
const PERSISTED_KEY = 'bridgeclip.create-preferences'
const PERSISTED_FIELDS = [
  'clippingMode', 'plannerModel', 'transcriptionModel', 'aspectRatio', 'layoutStyle',
  'layoutVision', 'pacing', 'videoSpeed', 'durations', 'autoClipCount', 'maxClips',
  'includeCaptions', 'captionPreset'
] as const satisfies readonly (keyof ClipDraft)[]

function validPreference(field: (typeof PERSISTED_FIELDS)[number], value: unknown): boolean {
  switch (field) {
    case 'clippingMode': return value === 'quality' || value === 'economy' || value === 'advanced'
    case 'plannerModel': return value === '' || isModelId(value)
    case 'transcriptionModel': return value === '' || isModelId(value)
    case 'aspectRatio': return value === '9:16' || value === '16:9'
    case 'layoutStyle': return value === 'auto' || value === 'fill' || value === 'fit'
    case 'layoutVision':
    case 'autoClipCount':
    case 'includeCaptions': return typeof value === 'boolean'
    case 'pacing': return value === 'tight' || value === 'natural'
    case 'videoSpeed': return typeof value === 'number' && Number.isFinite(value) && value >= 0.5 && value <= 2
    case 'durations': return Array.isArray(value) && value.length <= 7 && value.every((item) => typeof item === 'string' && item.length <= 20)
    case 'maxClips': return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 50
    case 'captionPreset': return typeof value === 'string' && value.length <= 40
  }
}

function readPersistedPreferences(): Partial<ClipDraft> {
  try {
    const raw = localStorage.getItem(PERSISTED_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, unknown> = {}
    for (const field of PERSISTED_FIELDS) {
      const value = (parsed as Record<string, unknown>)[field]
      if (validPreference(field, value)) out[field] = value
    }
    return out as Partial<ClipDraft>
  } catch {
    // A corrupt or unreadable store must not stop the form from opening.
    return {}
  }
}

export const useDraftStore = create<DraftState>((set) => ({
  source: '',
  clippingMode: 'quality',
  plannerModel: '',
  transcriptionModel: '',
  aspectRatio: '9:16',
  layoutStyle: 'auto',
  layoutVision: true,
  pacing: 'tight',
  videoSpeed: 1,
  durations: ['short'],
  autoClipCount: true,
  maxClips: 5,
  includeCaptions: true,
  captionPreset: 'pop',
  ...readPersistedPreferences(),
  trimOpen: false,
  trimStart: '',
  trimEnd: '',
  step: 'video',
  started: null,
  update: (patch) => set((state) => {
    const modeChanged = patch.clippingMode !== undefined && patch.clippingMode !== state.clippingMode
    const applied = modeChanged
      ? { ...patch, plannerModel: '', transcriptionModel: '' }
      : patch
    const next = { ...state, ...applied }
    try {
      const keep: Record<string, unknown> = {}
      for (const field of PERSISTED_FIELDS) {
        keep[field] = next[field]
      }
      localStorage.setItem(PERSISTED_KEY, JSON.stringify(keep))
    } catch {
      // Persistence is a convenience; a full or blocked store must not break
      // editing the form.
    }
    return applied
  }),
  setStep: (step) => set({ step }),
  clearSource: () => set({ source: '', trimStart: '', trimEnd: '' }),
  markStarted: (started) => set({ started }),
  startAnother: () => set({ source: '', trimOpen: false, trimStart: '', trimEnd: '', step: 'video', started: null })
}))
