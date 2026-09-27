export interface CodexStatus {
  connected: boolean
  models: { id: string; name: string; vision: boolean; reasoningEfforts?: string[]; defaultReasoningEffort?: string }[]
}
