# Providers and authentication boundaries

This baseline separates the current implementation from the owner-approved target. See [Project status](PROJECT_STATUS.md) for completion evidence.

## Current verified state

| Provider | Current behavior | Authentication and billing | Model selection/discovery |
| --- | --- | --- | --- |
| Local ASR | The engine defaults to `nvidia/nemotron-3.5-asr-streaming-0.6b` through the project-local NeMo-Speech runtime. The installed bundle runs on the GPU through Vulkan. | No provider account or API charge. The model already exists under `engine-bin\models\`. | The path and model are hardcoded defaults with environment overrides. The device is settable through `TRANSCRIPTION_DEVICE` and defaults to `auto`; there is no UI inventory or model selector yet. |
| OpenRouter | Clip planning is required and hardcoded to GLM behavior. Optional layout vision and AI metadata also use OpenRouter. An environment-selected remote ASR implementation remains in the engine but is not exposed in the UI. | The user's OpenRouter key is stored with Electron `safeStorage` in per-user `settings.json` and passed to current OpenRouter calls. Requests can incur charges. Remote ASR sends audio; planning/metadata sends transcript text and, for vision, sampled frames. | `z-ai/glm-5.3-flash` is the current planner/layout/metadata default. There is no explicit provider/model picker or model-discovery flow. |
| Codex / ChatGPT-plan access | Not implemented. | No Codex login, account state, or billing path exists in the current product. | No Codex model inventory or selector exists. |

ElevenLabs is not a current provider. Current provider calls are initiated by a user-started clipping job or an AI metadata automation that the user explicitly enabled; this documentation task performs no provider/model call.

## Owner decisions

### Local ASR

- Local GPU transcription is the required default and release gate.
- CPU execution is diagnostic only.
- The existing model must be preserved; no automatic model download is allowed.

### OpenRouter

- OpenRouter remains a separate explicit provider with the user's own key and account billing.
- It must not be treated as a fallback for missing Codex authentication.
- Remote transcription, if retained, requires an explicit user choice and clear disclosure that audio leaves the computer.
- Model discovery must be user-triggered and non-generative.

### Codex / ChatGPT-plan access

- Use the official Codex app-server-managed ChatGPT login from the Electron main process.
- Use Windows Keyring for credential ownership.
- Do not implement hand-written OAuth, browser token scraping, raw token extraction, token persistence, or copied `auth.json` handling.
- Renderer state may contain safe account status, capabilities, and model metadata, never reusable credentials.
- Label this provider as Codex/ChatGPT-plan access. Do not claim generic ChatGPT API access or OpenAI API-key billing.

## Planned / not yet implemented

| Capability | Required boundary |
| --- | --- |
| Provider contract | Accept only validated `local-nemo`, `openrouter`, and `codex` IDs plus compatible model roles. |
| Local discovery | Enumerate only existing configured model artifacts; report unclassified files; never download. |
| OpenRouter discovery | Explicit user-triggered, authenticated model inventory only; no startup request and no generation. |
| Codex discovery | Official app-server model inventory after managed login; no raw token exposure. |
| Renderer controls | Typed IPC selectors for provider, model, role, and local GPU device; no arbitrary URLs or environment names. |
| Failure behavior | Missing credentials fail only for the selected provider; unavailable services do not trigger an unapproved paid fallback. |

Under the owner-approved target, no autonomous model download, provider discovery, or paid generation is permitted. Automated verification must use fixtures, mocks, or the explicitly requested local GPU fixture. See [Architecture](ARCHITECTURE.md) and [Transcription](transcription.md).
