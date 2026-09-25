# Security policy

Security fixes target the current `main` branch and any future release that explicitly passes the gates in [Releasing](docs/RELEASING.md). This documentation baseline does not claim that a current macOS or Windows release is approved.

Please report a suspected vulnerability through the private vulnerability-reporting channel for the repository that owns the build. The current BridgeMind upstream channel is [GitHub private vulnerability reporting](https://github.com/bridge-mind/bridgeclip/security/advisories/new); the `aMoonshine/bridgeclip` fork must configure its own channel before publishing. Do not include exploit details, provider keys, tokens, private videos, or diagnostic logs in a public issue. Include the affected version, steps to reproduce with dummy data, and expected impact. Maintainers will coordinate a private response and disclosure with you.

## Current verified state

- The renderer is sandboxed and context-isolated; saved provider keys are owned by the Electron main process and exposed to the renderer only as configured-state booleans.
- OpenRouter and Zernio keys use Electron `safeStorage`. The renderer cannot retrieve stored key values.
- The current default ASR path is local. The current NeMo bundle is CPU-only and is not GPU-complete.
- Clip planning and optional AI metadata use the user's OpenRouter account. ElevenLabs is not a current provider.
- No Codex/ChatGPT-plan login exists. No raw ChatGPT/Codex token or `auth.json` handling is authorized.
- Saved run data and provider responses are treated as untrusted. Logs and UI errors must remain sanitized.

## Owner decisions for the target

- Official Codex authentication must be managed by the Codex app server from the main process.
- Reusable Codex credentials must remain in Windows Keyring ownership. Raw tokens, cookies, copied `auth.json`, and Keyring exports must not enter renderer state, logs, argv, fixtures, Git, or portable `data\`.
- Provider/model inputs, network destinations, redirects, child processes, and IPC values require explicit validation and bounded failure handling.
- Automated verification must not make live paid or authenticated provider calls.
- Portable state must contain no secrets. Migration and clear-history operations must fail safely and never silently delete output media.

Review [Architecture](docs/ARCHITECTURE.md), [Providers](docs/PROVIDERS.md), [Portable Windows](docs/PORTABLE_WINDOWS.md), and [Project status](docs/PROJECT_STATUS.md) for current boundaries and remaining work.

The September 2026 [security review](docs/SECURITY_REVIEW_2026-09-24.md) and [follow-up](docs/SECURITY_FOLLOWUP_2026-09-24.md) are historical records, not current release approval. If private reporting is unavailable, open a public issue requesting a private contact channel without vulnerability details.
