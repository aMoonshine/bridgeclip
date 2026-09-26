import { create } from 'zustand'

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

/** The local model, chosen without an API key and free of provider cost. */
export const LOCAL_TRANSCRIPTION_MODEL = 'local'

function readPersistedPreferences(): Partial<ClipDraft> {
  try {
    const raw = localStorage.getItem(PERSISTED_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, unknown> = {}
    for (const field of PERSISTED_FIELDS) {
      if (field in parsed) out[field] = (parsed as Record<string, unknown>)[field]
    }
    return out as Partial<ClipDraft>
  } catch {
    // A corrupt or unreadable store must not stop the form from opening.
    return {}
  }
}

export const useDraftStore = create<DraftState>((set) => ({
  ...readPersistedPreferences(),
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
  trimOpen: false,
  trimStart: '',
  trimEnd: '',
  step: 'video',
  started: null,
  update: (patch) => set((state) => {
    const next = { ...state, ...patch }
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
    return patch
  }),
  setStep: (step) => set({ step }),
  clearSource: () => set({ source: '', trimStart: '', trimEnd: '' }),
  markStarted: (started) => set({ started }),
  startAnother: () => set({ source: '', trimOpen: false, trimStart: '', trimEnd: '', step: 'video', started: null })
}))
