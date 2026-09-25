# Project status

Last updated: **2026-09-25**

- Canonical working checkout: `Y:\ProjectsAI\bridgeclip`
- Rollback source: none. The former `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip` checkout no longer
  exists; recovery is via `origin` = `aMoonshine/bridgeclip`. Verify with `git fsck --full` and
  `gitleaks git --redact=100` before relying on a remote rollback.
- Verified branch and HEAD at this baseline: `main` at `6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5`
- Product remote: `origin` = `aMoonshine/bridgeclip`
- Read-only upstream remote: `upstream` = `bridge-mind/bridgeclip`
- Active plan: `.omo/plans/bridgeclip-ssd-portable-ai.md`

Status terms in this document are deliberate:

- **Current verified state** means observed in the canonical checkout or supported by the evidence listed below.
- **Owner decisions** are fixed constraints for later implementation waves, not current features.
- **Planned / not yet implemented** must not be reported as complete.

## Current verified state

| Todo | Status | Verified result | Evidence |
| --- | --- | --- | --- |
| 1 | Complete; owner-confirmed; canonical receipt reconstructed | Full repository copy to the canonical SSD checkout, including Git history and ignored project-local runtime/model files. The D: checkout was later removed by owner decision, so the Git remote is the only rollback. | `.omo/evidence/bridgeclip-ssd-portable-ai/task-1-relocation.md` (reconstructed from the canonical ledger and corroborated by Tasks 2–3) |
| 2 | Complete | The Python 3.12.14 venv was recreated at the Y: path; locked Python, Node, Electron, FFmpeg/ffprobe, yt-dlp, and NeMo runtime paths were verified; and the real launcher passed bounded preflight/system checks. | `.omo/evidence/bridgeclip-ssd-portable-ai/task-2-runtime.md` |
| 3 | Complete | The target has full reachable history, expected origin/upstream roles, passing `git fsck --full`, and a redacted all-ref Gitleaks scan with zero findings. | `.omo/evidence/bridgeclip-ssd-portable-ai/task-3-git-security.md` |
| 4 | Complete; baseline confirmed | Durable documentation baseline is established and directly verified. The plan checkbox and canonical ledger are updated after the checks; behavior Todos 6–16 remain pending. | `.omo/evidence/bridgeclip-ssd-portable-ai/task-4-docs-baseline.md` |

Current product facts:

- `nemo-speech doctor --json` reports NeMo-Speech `0.1.0` with `accelerator_available=true`, `accelerator_compiled=true`, and `backend_vulkan=true`, with `Vulkan0 / NVIDIA GeForce RTX 3090` present. This supersedes the CPU-only reading in the Todo 4 and Todo 5 evidence files, which remain as the historical record of that earlier baseline.
- The current engine defaults to local Nemotron transcription on the GPU. Clip planning and optional layout analysis are hardcoded to OpenRouter GLM behavior; explicit provider/model selection and Codex access are not implemented.
- Settings and application state still use Electron per-user `userData`. A project-local portable `data\` root, portable drafts, recent projects, crash recovery, and non-destructive history clearing are not implemented.
- The canonical launcher is verified for this source checkout. Windows installer/update distribution and an automated GPU resource package are not release-ready.
- The public-draft manifest still omits the four new documentation files and the tracked `start-windows.cmd`/`start-windows.ps1` launchers; public export is blocked until Todo 13 updates and reviews it.
- Todo 5 baseline is recorded with typecheck, lint, bridge, renderer, and build passing; known failures are Windows symlink/permission/test-harness issues. `pytest` has since been installed into the venv as a local development dependency, so the Python suite now runs. Evidence: `.omo/evidence/bridgeclip-ssd-portable-ai/task-5-baseline.md`.

## Owner decisions

- GPU-capable local ASR is mandatory and is now met. CPU-only execution remains diagnostic and cannot satisfy a release gate.
- Codex means official app-server-managed ChatGPT-plan access, with Windows Keyring credential ownership. Raw ChatGPT/Codex tokens and copied `auth.json` files are forbidden.
- OpenRouter remains a separate explicit provider. It is not an authentication or billing fallback for Codex.
- No provider/model call or model download may be initiated autonomously. Network discovery and generation require explicit user action.
- Portable state belongs under a versioned project-local `data\` root. Credentials do not belong in portable files.
- The former D: checkout is gone by owner decision. Work only from `Y:\ProjectsAI\bridgeclip`; do not recreate a second working copy.
- `origin` is the product remote. `upstream` is read-only. No force-push, direct upstream write, history rewrite, second repository, tag, or release is authorized.
- A VPN profile that carries a ULA IPv6 address together with a `::/0` route is treated as a host misconfiguration, not an app defect. The owner's `comp2.conf` is corrected; a corrected profile is required for the tunnel itself to work.

## Current verified state (2026-09-25 network work)
- Source validation accepts a host that resolves to a mix of public and unroutable answers, and refuses it only when every answer is private. Verified against `www.youtube.com` and `i.ytimg.com` through a live tunnel.
- Requests are pinned to an IPv4 address when a name is dual-stack, and to the only available family otherwise. A test asserts an IPv6-only host still uses IPv6.
- A download that fails while the host advertises unreachable IPv6 now reports `download.ipv6_unreachable` with a VPN-specific message and hint, instead of the generic "video could not be downloaded".
- `pytest` is now installed in `engine\.venv` as a local development dependency; `engine/requirements.lock` is unchanged. The Python suite runs 411 tests.
- Regression baseline on this checkout is unchanged by the network work: main 31 pass / 9 fail, renderer 22 pass, zernio 109 pass / 6 fail, release 9 pass / 2 fail, bridge 24 pass, typecheck, lint, and build pass. The recorded failures are pre-existing Windows file-mode and symlink assertions.

## Current verified state (2026-09-25 GPU runtime)

- The installed NeMo-Speech.cpp `0.1.0` bundle is the official Vulkan archive from `NVIDIA/NeMo-Speech.cpp`, verified against the published digest `b5e7b04a...`. It replaces the CPU-only bundle, which was removed after verification along with the downloaded archive.
- `nemo-speech doctor --json` reports `accelerator_compiled=true` and `backend_vulkan=true`, with `Vulkan0 / NVIDIA GeForce RTX 3090` as device 0.
- GPU transcription on `engine\tests\fixtures\nemo-jfk.wav` returns the expected text, 22 word objects, and monotonic timestamps. `--device auto`, which is what the app sends, resolves to `backend=Vulkan0`. On this machine the same clip took 1.95 s on `Vulkan0` against 3.38 s on `cpu`.
- The model is untouched: `3FC991D3BADAD7277C11030A7519832CDDAF2057AAFED6D4B25147E953A070B1` before and after. No model was downloaded at any point.
- `TRANSCRIPTION_DEVICE` is a validated setting. It accepts `auto`, `cpu`, `cuda`, `vulkan`, `metal`, `gpu`, and an indexed form such as `vulkan:0`; anything else is rejected before it can reach a subprocess argv. Both local call sites forward it.
- A Vulkan backend DLL from an unrelated application on this machine was evaluated and rejected: its ggml generation does not match this runtime. Backends must come from the matching official archive.

## Planned / not yet implemented

- Versioned `local-nemo`, `openrouter`, and `codex` provider/model-role contract.
- Official Codex login, account status, logout, and safe model inventory.
- Explicit local/OpenRouter/Codex model discovery without downloads or generation.
- Typed provider/model/device selectors in the renderer.
- Versioned portable `data\` storage and migration.
- Draft persistence, recent-project index, crash recovery, and non-destructive history clearing.
- Deterministic Windows/macOS packaging, manifest updates, and public snapshot approval.

See [Portable Windows](PORTABLE_WINDOWS.md), [Providers](PROVIDERS.md), [Transcription](transcription.md), and [Upstream sync](UPSTREAM_SYNC.md) for the target boundaries.

## Remaining implementation work

| Item | Status | Scope |
| --- | --- | --- |
| Todo 5 | Complete; baseline recorded with platform failures | Pre-change typecheck/lint/build and component test results are recorded in `.omo/evidence/bridgeclip-ssd-portable-ai/task-5-baseline.md`; Windows test-harness failures and missing pytest are preserved, not hidden. |
| Todo 6 | Pending | Mandatory CUDA/Vulkan NeMo GPU runtime and fixture. |
| Todo 7 | Pending | Explicit provider and model-role contract. |
| Todo 8 | Pending | Official Codex-managed ChatGPT authentication lifecycle. |
| Todo 9 | Pending | Explicit non-generative model discovery. |
| Todo 10 | Pending | Typed provider/model/device renderer controls. |
| Todo 11 | Pending | Versioned project-local portable data root and migration. |
| Todo 12 | Pending | Drafts, recent projects, crash recovery, and safe history clearing. |
| Todo 13 | Pending | Resource staging, packaging, manifest, and notices. |
| Todo 14 | Pending | Secrets, egress, process, and provider-failure hardening. |
| Todo 15 | Pending | Documentation synchronization after behavior verification. |
| Todo 16 | Pending | Full offline regression, packaging, GPU, restart, and failure-path QA. |
| F1 | Pending | Plan compliance audit. |
| F2 | Pending | Code quality and security review. |
| F3 | Pending | Real local manual QA. |
| F4 | Pending | Scope, Git, and documentation fidelity review. |

## Evidence limitations

- Todo 1 has a reconstructed canonical receipt at `.omo/evidence/bridgeclip-ssd-portable-ai/task-1-relocation.md`, based on the existing ledger and Tasks 2–3; the original worker artifact remains unavailable.
- Todo 3 branch-protection values and remote heads are point-in-time observations from its evidence.
- No provider/model call, credential read, model download, GPU inference, packaging, or source behavior change was performed for this documentation task.
