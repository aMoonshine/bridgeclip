---
slug: bridgeclip-ssd-portable-ai
status: approved
intent: clear
review_required: true
plan_path: .omo/plans/bridgeclip-ssd-portable-ai.md
phase: executing
plan_sha256: d15c186493b3a24d93671c97da7ec6a7c06382964bf554daed04eab8571c662b
current_plan_sha256: EC63ECEFB7306BAA53699F870EE0F20399B8F0ED8FF966D47F1D9C8BD84AACD5
execution_workspace_root: Y:\ProjectsAI\bridgeclip
execution_status: in_progress
execution_phase: todo-6-gpu-runtime
review_round_id: bridgeclip-ssd-portable-ai-r3-20260925
pending-action: implement and verify Todo 6 CUDA/Vulkan NeMo GPU runtime in Y:\ProjectsAI\bridgeclip
review:
  momus:
    status: approved
    workspace_root: D:\!!!\Documents\ChatGPT
    runtime_home: null
    target: .omo/plans/bridgeclip-ssd-portable-ai.md
    round_id: bridgeclip-ssd-portable-ai-r3-20260925
    plan_sha256: d15c186493b3a24d93671c97da7ec6a7c06382964bf554daed04eab8571c662b
    launch_id: launch-momus-bridgeclip-r3-20260925
    session: ses_f27a052fbffeNoEhUPQmijqi5Q
    result: APPROVE r3 after exact Python path correction
  independent:
    status: inconclusive
    workspace_root: D:\!!!\Documents\ChatGPT
    runtime_home: null
    target: .omo/plans/bridgeclip-ssd-portable-ai.md
    round_id: bridgeclip-ssd-portable-ai-r3-20260925
    plan_sha256: d15c186493b3a24d93671c97da7ec6a7c06382964bf554daed04eab8571c662b
    launch_id: null
    session: null
    result: Oracle cancelled by owner; Prometheus self-review performed after Momus corrections
approach: staged read-only plan: relocate the complete BridgeClip working tree to Y:\ProjectsAI\bridgeclip without deleting the source until verification; preserve Git history/remotes; rebuild path-bound local runtimes; make portable app data and settings live under a project-local data root; add a provider boundary for local Nemotron ASR, OpenRouter, and the official Codex ChatGPT OAuth/SDK path; add model discovery/selection without live generation during tests; document architecture, operations, decisions, progress, and verification in the project plus durable .omo state.
---

# Draft: bridgeclip-ssd-portable-ai

## Components (topology ledger)
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- C1 Relocation/runtime | The working repository, Git metadata/history, ignored local runtimes, and model files are available from Y:\ProjectsAI\bridgeclip and pass integrity checks. | active | D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip\.git\config; D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip\README.md:71-88; Y:\ProjectsAI
- C2 GPU ASR | Local Nemotron transcription uses a verified GPU backend when available, preserves word timestamps, and falls back safely to CPU. | active | engine/clip_engine/services/transcription_service.py:633-689; engine/clip_engine/config.py:657-661; X:\Programs\Handy\Data\logs\handy.log:17-43; NVIDIA NeMo-Speech.cpp docs
- C3 Providers/auth | The user can sign in to ChatGPT for Codex through the official browser/device flow, select supported models, and separately configure OpenRouter; no token is exposed to renderer, logs, Git, or model files. | active | OpenAI Codex SDK docs; src/main/settings-store.ts:1-240; bridge/bridge_runner.py:163-207
- C4 Portable state/UX | Settings, selected models, draft options, history, logs, thumbnails, work state, and recovery records persist in a project-local portable data root and survive restart/crash; history can be listed and cleared without silently deleting media. | active | src/main/settings-store.ts:58-181; src/main/file-manager.ts:46-117; src/renderer/store/use-draft-store.ts:18-72; src/renderer/pages/LibraryPage.tsx:20-189
- C5 Git/secrets/docs | Feature work is committed in a reviewable branch, pushed only to the owner-approved remote, and the exact tracked/exported bytes pass secret scanning; architecture, status, decisions, and runbook documentation stay current. | active | .gitignore:1-21; .github/workflows/ci.yml:11-49; docs/OPEN_SOURCE_READINESS.md:3-17; scripts/export-public-draft.sh:1-114
- C6 Regression/QA | Offline tests cover relocation-adjacent paths, provider adapters, GPU/CPU selection, persistence, history clearing, security boundaries, and documentation consistency without calling paid models. | active | package.json:17-39; engine/tests; tests/main; tests/renderer-state.test.cjs; tests/zernio

## Open assumptions (announced defaults)
<!-- assumption | adopted default | rationale | reversible? -->
- Target checkout name | Y:\ProjectsAI\bridgeclip | Preserves the repository identity while placing the project on the SSD. | yes
- Move safety | Copy and verify first; keep the D: source as a rollback copy until the user explicitly approves deletion | Avoids destructive loss and permits hash/test comparison. | yes
- Git safety | Preserve the existing `.git` directory and both remotes: `origin` = `aMoonshine/bridgeclip` is the product line; `upstream` = `bridge-mind/bridgeclip` is an update source. Implement on feature branches, merge verified work into the owner main, and import upstream through a dedicated sync branch; never force-push or write directly to upstream. | Matches the owner's repository ownership decision and keeps updates auditable. | yes
- Runtime migration | Recreate the Python virtual environment at the new absolute path; copy/reinstall project-local Node, FFmpeg, NeMo runtime, and model rather than trusting path-bound venv launchers | Windows venvs and scripts can retain absolute paths. | yes
- GPU policy | GPU is owner-mandated and release-blocking: completion requires a verified Vulkan/CUDA backend plus a successful real local GPU transcription; the installed vendor driver is an allowed OS prerequisite. CPU remains only a tested diagnostic/regression path and does not satisfy GPU acceptance. | Owner explicitly selected “GPU обязателен”; Handy logs prove Vulkan0 on this machine while the current BridgeClip bundle appears CPU-only. | yes
- Local model policy | Discover every already-present model artifact under the configured project-local model roots; never download a new model automatically | Owner explicitly chose all project-folder models as the inventory and prohibited new downloads. | yes
- Provider policy | Use the official OpenAI Codex SDK/CLI login and model APIs, not a hand-written reverse-engineered OAuth client or copied auth.json | Official docs support ChatGPT browser/device login and programmatic SDK integration. | yes
- Codex credential storage | Keep Codex runtime state under the portable data root, but store ChatGPT credentials in Windows Keyring/Windows Credential Manager, never in portable files or Git | Owner explicitly selected Windows Keyring; this is safer but requires sign-in again on another Windows user/device. | no
- OpenRouter testing | Model discovery and adapters are tested with local mocks/fixtures; no live OpenRouter generation or model call is performed by the worker | User prohibited autonomous paid calls. | yes
- Model selection UX | Keep transcription and LLM roles explicit while surfacing every compatible model discovered in the project-local inventory; do not hide unclassified files without reporting them | Prevents mixing roles while honoring the owner's all-discovered-models decision. | yes
- Portable data layout | Project-local `data\` for settings, history, logs, thumbnails, non-secret Codex runtime state, and temporary work; output remains user-selectable and defaults inside the project | Meets portability while credentials remain in Windows Keyring. | yes
- History semantics | Show only runs BridgeClip knows about or the user explicitly imports; do not scan the whole SSD automatically | Avoids surprise disk indexing and privacy issues. | yes
- Documentation | Maintain `docs/ARCHITECTURE.md`, `docs/transcription.md`, Windows/portable operations docs, model/provider docs, and a current `docs/PROJECT_STATUS.md`; keep the executable work state in `.omo` | User explicitly requires progress to survive compaction. | yes
- Documentation synchronization | Every implementation stage updates existing affected docs in the same stage and adds missing new docs before that stage is marked complete; code, tests, and documentation ship together | The owner explicitly requires immediate, continuous documentation rather than a final documentation pass. | yes
- Compaction continuity | After every verified decision, completed stage, failed command, or changed plan, update this durable draft and later the executable plan/status ledger; never rely on chat memory | The current research session is very large and the owner explicitly asked not to keep such sessions open. | yes
- Test strategy | Owner-confirmed tests-after: add regression tests alongside each behavior change, use mocks/fixtures and local-only QA, and perform no paid/authenticated provider call during automated verification | Existing project has broad tests and the requested integrations are high-risk. | yes

## Findings (cited - path:lines)
- The source checkout is D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip; Y:\ProjectsAI exists and is empty, with no existing bridge or bridgeclip child (read-only directory inspection, 2026-09-25).
- The checkout has a main branch at 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5, origin https://github.com/aMoonshine/bridgeclip.git, upstream https://github.com/bridge-mind/bridgeclip.git, and a codex/upstream-sync branch; the working tree/history contains prior local Nemotron/GLM changes (bridgeclip/.git/config:1-16; refs/heads/main; .git/logs/HEAD:1-7; bridgeclip-assessment.md:45-50).
- The current launcher uses project-local Node 22.23.3, Python venv, FFmpeg/ffprobe, NeMo-Speech.cpp, and Nemotron GGUF under engine-bin (start-windows.ps1:1-30; README.md:71-77). Large runtime/model/venv directories are ignored (.gitignore:14-16).
- The current transcription service defaults to local Nemotron, calls nemo-speech transcribe with JSON, parses word timings, and has an optional OpenRouter recovery path (engine/clip_engine/config.py:657-661; engine/clip_engine/services/transcription_service.py:558-689).
- The current bundled NeMo runtime directory contains CPU-looking ggml DLLs and nemo-speech.exe; no Vulkan DLL was present in the inspected bin listing. Handy separately logs backend Vulkan0 and approximately 12x real-time performance on this machine (engine-bin/nemo-speech/bin; X:\Programs\Handy\Data\logs\handy.log:17-43, 149-182).
- Official NVIDIA NeMo-Speech.cpp v0.1.0 publishes CPU, CUDA, and Vulkan archives; current docs expose `--device cuda:0`, `--device vulkan:0`, `doctor`, JSON word timestamps, and a Windows build path. CUDA builds need a compatible driver/toolkit at build/run; Vulkan needs a vendor driver at run (NVIDIA release API v0.1.0; docs/build.md; docs/cli.md; docs/asr/configuration.md).
- The current bridge hardcodes GLM 5.3 Flash and requires OPENROUTER_API_KEY even when local transcription is selected (bridge/bridge_runner.py:163-207; engine/clip_engine/config.py:640-655; engine/clip_engine/services/intelligence_planner.py:563-587).
- OpenRouter's official API exposes an authenticated `/models/user` discovery endpoint with modality filters and no generation required; it should be an explicit user-triggered refresh, mocked in tests (Context7 OpenRouter docs, /openrouterteam/docs).
- Official Codex SDK docs expose `login_chatgpt()`, `login_chatgpt_device_code()`, `account()`, `models()`, structured `output_schema`, image inputs, and sandboxed turns; ChatGPT auth is subscription-based while API-key auth is billed separately (OpenAI Codex SDK docs, getting-started/API reference/FAQ; developers.openai.com/codex/auth).
- The current BridgeClip settings store uses Electron safeStorage for provider keys but stores app data under OS userData; renderer receives only configured flags (settings-store.ts:1-27, 58-181, 188-240; preload/index.ts:16-24, 66-71).
- The current draft store is memory-only, so Create options do not survive a restart (use-draft-store.ts:18-72). History is derived from output folders and Library currently shows only completed runs; there is no clear-history operation (file-manager.ts:46-117; LibraryPage.tsx:20-189).
- Current .gitignore excludes env files, keys, logs, engine-bin, venv, and build output, but does not yet define a portable data/Codex state boundary; public-export and CI scripts already perform manifest, Gitleaks, dependency, and test gates (.gitignore:1-21; scripts/export-public-draft.sh:23-114; .github/workflows/ci.yml:11-49).
- The parent assessment already records that no paid OpenRouter request should be made and that the current local Nemotron path is tested (LinkedIn/bridgeclip-assessment.md:45-50).

## Research checkpoint (delegated claims; worker must re-verify)
- Repository shape: delegated Git audit found a clean standalone repository with no submodules, no tracked symlinks, and no nested repository metadata; the local clone is shallow, so full remote history/secret verification is a mandatory pre-move step (`.git/shallow`; `git ls-files --stage`; `.git/config:1-16`).
- Public Git state: delegated GitHub inspection found `aMoonshine/bridgeclip` is a public fork of `bridge-mind/bridgeclip`; upstream has advanced since the last local fetch, so sync must begin with a fresh non-destructive fetch and branch comparison, never with the stale `upstream/main` tracking ref.
- Relocation runtime: `engine/.venv/pyvenv.cfg` contains the old D: absolute base path and the bundled Python directory is a junction back into the old checkout; the venv must be recreated at `Y:\ProjectsAI\bridgeclip` rather than trusted after a move (`engine/.venv/pyvenv.cfg:1-10`; `README.md:71-77`).
- Local GPU: delegated offline probe reported RTX 3090/driver 610.88 on the host while bundled NeMo-Speech.cpp 0.1.0 imports only `ggml-cpu.dll`, reports no compiled accelerator, and rejects `--device cuda`; the worker must rerun `nemo-speech doctor --json` and a short local CPU/GPU transcription fixture after relocation before claiming GPU support (`engine-bin/nemo-speech/bin`; `engine/clip_engine/services/transcription_service.py:633-689`).
- Packaging: `scripts/prepare-resources.sh:29,51-58` deletes `engine-bin` and stages only FFmpeg/ffprobe/yt-dlp, while packaged validation requires the Nemotron runtime/model; this release-path mismatch must be documented and tested rather than silently inherited (`scripts/verify-packaged-mac.sh:30-33,65-66`; `electron-builder.yml:41-59`).
- Packaging/runtime mismatch: `electron-builder.yml:52-55` expects `engine-venv`, while the Windows checkout uses `engine/.venv`; the relocation plan must create a deterministic packaged-venv staging step and update the resource-verification script and `THIRD_PARTY_NOTICES.md` for NVIDIA/NeMo/ggml components.
- Provider architecture: delegated auth/provider audit confirmed there is no provider interface or model picker; GLM is hardcoded in Python/TypeScript, `bridge/bridge_runner.py:163-177` overwrites the planner model before engine import, and `ipc-handlers.ts:156-159` unconditionally requires OpenRouter. The plan must remove those gates and centralize provider/model capabilities.
- Credential boundary: `settings-store.ts:85-181,188-196,234-240` safely encrypts OpenRouter/Zernio keys and exposes only booleans to renderer, but currently passes the OpenRouter key to the child through an environment variable. The provider refactor must preserve main-process ownership and avoid adding reusable ChatGPT/Codex secrets to portable files or renderer state.
- Official OpenAI boundary: delegated official-doc research found that ChatGPT Plus/Pro entitlement and OpenAI API billing are separate. A compliant desktop integration should use the official Codex app-server/SDK-managed sign-in and model inventory, label it as Codex/ChatGPT-plan access, never copy/reuse `auth.json` or raw `chatgptAuthTokens`, and keep direct OpenAI API and OpenRouter as separate credentialed providers (`developers.openai.com/codex/auth`; `developers.openai.com/codex/app-server`; `openai.com/index/unlocking-the-codex-harness/`; `openai.com/policies/terms-of-use/`).
- Persistence/history: delegated UX audit confirmed settings use OS `userData`, history is reconstructed from one currently selected output directory, drafts are memory-only, recent projects do not exist as a persisted entity, and no clear-history operation exists. The plan must add a versioned portable index/migration rather than silently deleting media (`settings-store.ts:58-181`; `file-manager.ts:46-117`; `use-draft-store.ts:18-72`; `LibraryPage.tsx:20-189`).
- Secrets audit: no actual `.env`/private-key/personal-access-token file was found in the inspected tracked snapshot; apparent provider-key patterns were confined to test fixtures. Because the local clone is shallow and the fork is already public, a fresh full-history Gitleaks scan is still mandatory before any push (`tests/create-form.test.cjs:32-55`; `tests/main/security.test.cjs:13-65`; `.github/workflows/ci.yml:23-49`).
- Documentation drift: delegated status review found existing `docs/ARCHITECTURE.md`, `docs/automation-metadata.md`, `docs/SECURITY.md`, `docs/RELEASING.md`, and parent `bridgeclip-assessment.md` contain stale remote-ASR/provider/security/release claims relative to the current code. The first execution stage must correct these sources of truth; documentation cannot be deferred to the end.
- Public snapshot drift: `scripts/public-draft-manifest.txt:1-173` omits tracked `start-windows.cmd` and `start-windows.ps1`, although the exported README references them. The relocation/public-sync plan must either include the launchers or explicitly document and test a source-only snapshot without them.
- Test baseline: the latest documented historical baseline is 289 engine tests with 3 skips, 19 bridge tests, and Electron 44; no fresh full local run was performed during planning. The worker must capture a new baseline at the SSD destination before behavioral edits (`bridgeclip-assessment.md:45-51`; `package.json:17-39`).
- Research task `bg_27bb0f06` / `ses_f27d8ff41ffeWzCJ7kAZ3HKJxi` is complete; its GPU/NIM conclusion is reflected in the plan and no duplicate research task is needed.

## Decisions (with rationale)
- Canonical checkout: the owner reconfirmed `Y:\ProjectsAI\bridgeclip` as the SSD destination on 2026-09-25. Move the standalone repository including its own `.git`; keep `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip` intact as rollback until the destination passes Git/runtime/test acceptance. Source deletion is a separate, later owner action.
- Git ownership: `origin` (`aMoonshine/bridgeclip`) is the product-main repository; `upstream` (`bridge-mind/bridgeclip`) is the update source. Work uses feature branches; upstream is integrated through a dedicated sync branch/merge; no direct upstream writes, force-pushes, or history rewrites.
- Official OAuth only: BridgeClip will launch the official Codex login flow (browser first, device-code fallback), not implement OAuth endpoints or copy `~/.codex/auth.json`. The renderer sees status/account metadata only; the main process owns the helper and auth state. Windows Keyring stores credentials; project-local state contains no reusable secret.
- Provider abstraction: the job request carries provider/model selections; the engine dispatches to a local ASR adapter, an OpenRouter adapter, or a Codex adapter. Provider-specific auth requirements replace the current unconditional OpenRouter gate.
- Model discovery is non-generative and explicit: every already-present compatible model under the configured project-local inventory is shown; OpenRouter models are fetched only on explicit refresh; Codex models are fetched through the official interface after login. Tests use fixtures/mocks; no autonomous model download or paid generation.
- GPU is an implementation detail of local ASR, not a second transcription model, but it is owner-mandated and release-blocking. The same Nemotron GGUF must run through a verified Vulkan/CUDA backend and complete a real local transcription fixture; all application/runtime files remain under `Y:\ProjectsAI\bridgeclip`, while the installed vendor driver is an allowed OS prerequisite. CPU remains covered only as a diagnostic/regression path and cannot satisfy completion.
- Documentation is a first-class deliverable: every implementation stage updates affected existing docs and creates missing docs in the same stage. Required durable documents include architecture, GPU/CPU transcription runbook, provider/auth behavior, portable Windows operations, upstream-sync policy, and a current project-status/completed-stages ledger. `.omo` remains the compaction-safe planning/execution ledger.
- Owner-confirmed topology (2026-09-25): execute C1–C6 together — relocation/runtime, GPU ASR, Codex/OpenRouter providers, portable state/history, Git/secrets/docs, and regression/QA. No reduced first phase is invented; implementation waves may still stage the work safely.
- Owner-confirmed QA: tests-after with regression coverage, mocks/fixtures, and local-only automated verification; no paid/authenticated provider calls.
- Subagent model preference: use Space Bunny Free for all project subagents. The current task surface exposes no per-call model selector, so use direct agent types only and do not dispatch category-based implementer agents; record any runtime limitation rather than silently substituting a different model.
- Execution-order override (owner, 2026-09-25): start with a non-destructive copy/clone of the complete repository to `Y:\ProjectsAI\bridgeclip`, including `.git` and explicitly inventoried ignored runtime/model files; verify the destination before any gap analysis or source deletion. Existing `origin=aMoonshine/bridgeclip` is the GitHub target; do not create a second repository/remote unless the owner separately requests it.
- Metis execution note: two Metis gap-analysis calls aborted without a result; no further retries were made. Momus reviewed the synthesized plan, and Prometheus independently checked the corrected references, GPU fixture, E2E command, and dependency graph.

## Scope IN
- Safe relocation of the complete working project and Git history to Y:\ProjectsAI\bridgeclip; local runtime repair and launch verification.
- Mandatory GPU-capable portable local Nemotron ASR with word timestamps, diagnostics, a real GPU transcription acceptance fixture, and CPU retained only for diagnostic/regression coverage.
- Official ChatGPT/Codex OAuth-style sign-in via the supported Codex SDK/CLI, account status/logout, model discovery, and safe provider adapter.
- OpenRouter provider/model selection and non-generative discovery, with no autonomous live calls by the worker.
- Separate local-ASR and LLM selectors in the UI, persisted safely.
- Project-local portable settings/history/logs/work/Codex state, draft persistence, restart/crash recovery, and safe history clearing.
- Secret hygiene, Git branch/commit/push workflow, tests, bug audit, and architecture/status/operations documentation.

## Scope OUT (Must NOT have)
- No raw ChatGPT/Codex access tokens, refresh tokens, API keys, cookies, or copied ~/.codex/auth.json in the repository, logs, screenshots, fixtures, or documentation.
- No hand-written imitation of OpenAI OAuth endpoints, browser token scraping, token exchange, or bypass of subscription/API boundaries.
- No automatic model downloads, silent SSD-wide file indexing, or automatic deletion of source/output media.
- No live OpenRouter, OpenAI API, GitHub Models, or other paid generation calls during automated tests or planning; all such calls require explicit user action later.
- No direct push to upstream, force-push, history rewrite, or release/tag creation without separate explicit approval.
- No claim that GPU mode is dependency-free: an installed vendor GPU driver is an allowed OS/hardware prerequisite. A CPU-only run is not accepted as completion because GPU is owner-mandated.
- No broad unrelated redesign of BridgeClip, Zernio posting, or social-provider behavior beyond integration points required by the request.

## Review receipt
- Momus r3: `APPROVE`; session `ses_f27a052fbffeNoEhUPQmijqi5Q`; plan SHA-256 `d15c186493b3a24d93671c97da7ec6a7c06382964bf554daed04eab8571c662b`.
- Oracle lane: intentionally cancelled by owner after repeated execution aborts; no Oracle approval is claimed.
- Prometheus self-review after Momus corrections: verified task rows, corrected references, exact GPU fixture/model path, exact agent-run E2E command, dependency matrix, and no remaining blockers.
- Plan is ready for worker handoff; no product files or Git state were changed by planning.

## Open questions
- None. The owner confirmed the full C1–C6 topology, mandatory GPU behavior with an allowed system driver prerequisite, and tests-after with offline automated verification.

## Approval gate
status: executing
approved_at: 2026-09-25
approved_scope: C1-C6 full relocation/runtime, mandatory GPU ASR, Codex/OpenRouter providers, portable state/history, Git/secrets/docs, and tests-after offline QA
next: continue canonical execution in `Y:\ProjectsAI\bridgeclip`: verify Todo 4, repair any documentation/state defects, then run the Todo 5 offline baseline.
