# bridgeclip-ssd-portable-ai - Work Plan

## TL;DR (For humans)
<!-- Filled after the detailed task plan below; this is the human handoff summary. -->

**What you'll get:** BridgeClip will run from a verified SSD checkout with its Git history intact, mandatory local GPU transcription, selectable local/OpenRouter/Codex providers, portable settings and recoverable history, and current documentation.

**Why this approach:** The first execution wave copies and verifies the complete repository before changing anything; provider/auth state stays in the main process/Windows Keyring, and the GPU path is verified with a real local fixture rather than a CPU-only claim.

**What it will NOT do:** It will not delete the source checkout, copy credentials, create a second GitHub repository, rewrite history, push upstream, download models automatically, or make paid provider calls during automated verification.

**Effort:** XL
**Risk:** High - the work combines path-bound Windows runtimes, GPU native binaries, OAuth/provider boundaries, persistence migrations, and packaging.
**Decisions to sanity-check:** GPU is mandatory; the existing `aMoonshine/bridgeclip` fork remains `origin`; source deletion is a later owner action.

Your next move: run the plan in a worker session with `$start-work bridgeclip-ssd-portable-ai`; the first wave starts with a non-destructive SSD copy and verification. Full execution detail follows below.

---

> TL;DR (machine): XL/high-risk, 16 implementation todos in four waves plus F1–F4; copy-first relocation, mandatory GPU ASR, provider/auth refactor, portable state, docs, and offline tests.

## Scope
### Must have
- Copy the complete BridgeClip repository to `Y:\ProjectsAI\bridgeclip`, including `.git`, tracked files, ignored project-local runtimes, and the already-present Nemotron model; keep the D: source as rollback until acceptance.
- Recreate path-bound Python virtualenv/runtime paths at the SSD destination and prove the app launches without stale D: references.
- Provide mandatory local GPU ASR using a verified CUDA/Vulkan-enabled NeMo-Speech.cpp runtime and a real local transcription fixture; CPU remains diagnostic only.
- Replace hardcoded provider gates with explicit local-ASR, OpenRouter, and official Codex-managed provider adapters; expose model discovery/selection without automatic downloads or paid generation.
- Implement official Codex ChatGPT sign-in through the supported app-server/SDK flow, account status/logout, Windows Keyring credential ownership, and no raw token exposure.
- Move settings, drafts, history index, logs, thumbnails, work/recovery state, and non-secret Codex runtime state to a versioned project-local portable data root; clear history without silently deleting media.
- Repair Windows/macOS resource staging, public snapshot manifest, third-party notices, CI/security gates, and continuously update architecture/status/runbooks.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No deletion or in-place mutation of `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip` during copy/verification; no `git clean`, hard reset, force-push, history rewrite, direct upstream write, release tag, or second GitHub repository.
- No raw ChatGPT/Codex access/refresh tokens, cookies, API keys, copied `auth.json`, or secrets in renderer state, logs, fixtures, screenshots, Git, or portable data.
- No hand-written OAuth/token exchange, browser token scraping, NIM deployment, automatic model download, SSD-wide indexing, or silent output deletion.
- No live OpenRouter, OpenAI API, GitHub Models, or other paid/authenticated calls in automated tests; model discovery tests use fixtures/mocks.
- No CPU-only result may satisfy GPU acceptance; no broad Zernio/social redesign or unrelated UI refactor.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after + Node test runner, Python `unittest`/`pytest`, typecheck/lint/build, local resource probes, and mocked provider fixtures; no paid/authenticated calls.
- Evidence: `.omo/evidence/bridgeclip-ssd-portable-ai/task-<N>-<slug>.md` and `.omo/evidence/bridgeclip-ssd-portable-ai/final-<lane>.md`.
- Every relocation/hash/Git assertion records source and destination paths, command, exit code, and result without secret values.
- GPU acceptance requires `nemo-speech doctor --json` to report a compiled GPU backend and a real local fixture to complete with GPU evidence; a CPU success is recorded only as diagnostic.
- Provider acceptance uses deterministic fixtures and mocked HTTP/app-server responses; any live provider check is a separate explicit user-triggered manual step and is not part of automated completion.

## Execution strategy
### Parallel execution waves
- Wave 1 (copy-first intake): todos 1–5; no feature behavior changes before destination verification.
- Wave 2 (GPU and provider core): todos 6–10; starts only after Wave 1 destination/runtime checks pass.
- Wave 3 (portable state, packaging, security, docs): todos 11–15; provider/state interfaces must be stable before migration and UI integration.
- Wave 4 (full regression and handoff): todo 16 plus final verification F1–F4; no completion claim before all final lanes approve.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2,3,4,5 | none |
| 2 | 1 | 6,7,8,9,10,16 | 3,4,5 |
| 3 | 1 | 11,15,16 | 2,4,5 |
| 4 | 1 | 6,7,8,9,10,15,16 | 2,3,5 |
| 5 | 1,2 | 16 | 3,4 |
| 6 | 2,4 | 16 | 7,8,9,10 |
| 7 | 2,4 | 8,9,10,16 | 6 |
| 8 | 2,4,7 | 9,10,16 | 6 |
| 9 | 2,4,7 | 10,16 | 6,8 |
| 10 | 2,4,7,8,9 | 16 | none |
| 11 | 1,3 | 12,15,16 | 13,14 |
| 12 | 11 | 15,16 | 13,14 |
| 13 | 2,3,4 | 15,16 | 11,12,14 |
| 14 | 3,4,7,8 | 15,16 | 11,12,13 |
| 15 | 3,4,6–14 | 16 | none |
| 16 | 1–15 | F1–F4 | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [x] 1. Copy the complete repository to the SSD destination without deleting the source
  What to do / Must NOT do: Copy `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip` to `Y:\ProjectsAI\bridgeclip`, including `.git`, tracked files, project-local Node/FFmpeg/NeMo runtime, the existing Nemotron model, and other inventoried ignored files; preserve source as rollback; do not use `/MIR`, `git clean`, junction-following, or any source deletion.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2, 3, 4, 5
  References (executor has NO interview context - be exhaustive): `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip\.git\config`; `.git/shallow`; `.gitignore:14-16`; `README.md:71-77`; `Y:\ProjectsAI`.
  Acceptance criteria (agent-executable): preflight confirms source exists and destination is absent/empty; `robocopy "<source>" "<dest>" /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /XJ` returns an accepted success code; `git -C "<dest>" rev-parse --show-toplevel`, `git status --short`, and `git rev-parse HEAD` match the source; key runtime/model hashes are recorded; source status is unchanged.
  QA scenarios (name the exact tool + invocation): happy — PowerShell `Test-Path`, `robocopy`, `git -C`, and `Get-FileHash` with evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-1-relocation.md`; failure — preflight aborts without touching either tree when destination is non-empty, source is missing, free space is insufficient, or a hash differs.
  Commit: N | chore(relocation): no source commit; preserve copied repository state

- [x] 2. Recreate path-independent Windows runtimes and verify the SSD launcher
  What to do / Must NOT do: Recreate `engine\.venv` at the SSD path, install the locked Python dependencies, use the project-local Node toolchain, and verify FFmpeg/ffprobe/yt-dlp/NeMo paths; do not copy or trust path-bound venv launchers, old junction targets, secrets, or stale D: references.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 6, 7, 8, 9, 10, 16
  References (executor has NO interview context - be exhaustive): `engine/.venv/pyvenv.cfg`; `engine/requirements.lock`; `bridge/requirements.txt`; `start-windows.ps1:1-30`; `src/main/pipeline-runner.ts:149-214,413-420,709-715`; `src/main/tools.ts:14-27`.
  Acceptance criteria (agent-executable): use the existing versioned interpreter `engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe` to create `Y:\ProjectsAI\bridgeclip\engine\.venv`; if that exact interpreter is unavailable, stop and report the missing path rather than guessing; record the selected interpreter; locked installs complete; `pyvenv.cfg`, activation scripts, generated config, and runtime logs contain no old `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip` path; `start-windows.ps1` preflight resolves every local binary; `python --version`, `node --version`, `ffmpeg -version`, and `nemo-speech --version` succeed.
  QA scenarios (name the exact tool + invocation): happy — `engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe -m venv engine\.venv`, `pip install --require-hashes -r engine\requirements.lock`, `npm ci`, and launcher preflight, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-2-runtime.md`; failure — if the exact interpreter is absent, stop before venv creation, remove only any newly created target venv, and report the missing path; never mutate the D: source venv.
  Commit: Y | build(runtime): recreate SSD-local Python and toolchain paths

- [x] 3. Establish a clean Git/upstream/security inventory before feature work
  What to do / Must NOT do: At the SSD checkout, fetch refs non-destructively, make the local history complete enough for scanning, compare origin/upstream, run Git integrity checks and a redacted full-history secret scan, and record the current branch/remote state; do not create a new GitHub repository, push, force-push, rewrite history, or expose secret values.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 11, 15, 16
  References (executor has NO interview context - be exhaustive): `.git/config:1-16`; `.git/shallow`; `refs/heads/main`; `package.json:17-39`; `.github/workflows/ci.yml:23-49`; `scripts/export-public-draft.sh:23-114`; `.gitignore:1-21`.
  Acceptance criteria (agent-executable): `git -C "<dest>" remote -v` shows the existing `origin=aMoonshine/bridgeclip` and `upstream=bridge-mind/bridgeclip`; if `.git/shallow` exists, `git fetch --unshallow origin` (or an equivalent full-history fetch) completes before scanning; `git fetch --prune origin` and `git fetch --prune upstream` complete without worktree changes; `git fsck --full` and a redacted Gitleaks scan pass; the evidence records remote HEADs, shallow state, branch protection status if observable, and scan exit codes.
  QA scenarios (name the exact tool + invocation): happy — `git status --short --branch`, `git remote -v`, `git fetch --prune`, `git fsck --full`, `gitleaks git --redact=100 --no-banner`, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-3-git-security.md`; failure — stop before any push and report the exact failed fetch, fsck, or secret-scan assertion.
  Commit: N | chore(git): record preflight inventory; no remote mutation

- [x] 4. Create the durable documentation baseline before behavior changes
  What to do / Must NOT do: Create/update the project status ledger and correct stale architecture, transcription, provider, security, release, and portable-path claims identified in the draft; do not defer documentation to the end or rewrite historical security evidence.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 6, 7, 8, 9, 10, 15, 16
  References (executor has NO interview context - be exhaustive): `README.md:71-130`; `docs/ARCHITECTURE.md`; `docs/transcription.md`; `docs/automation-metadata.md`; `SECURITY.md`; `docs/SECURITY_REVIEW_2026-09-24.md`; `docs/RELEASING.md`; `scripts/public-draft-manifest.txt:1-173`; `D:\!!!\Documents\ChatGPT\LinkedIn\AGENTS.md`.
  Acceptance criteria (agent-executable): `docs/PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`, `docs/transcription.md`, `docs/PORTABLE_WINDOWS.md`, `docs/PROVIDERS.md`, and `docs/UPSTREAM_SYNC.md` exist; every current provider/runtime claim matches the code and owner decisions; stale claims are either corrected or explicitly labeled historical; a link/index check finds no missing required document.
  QA scenarios (name the exact tool + invocation): happy — `rg`/`grep` targeted stale-term audit plus Markdown link check, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-4-docs-baseline.md`; failure — docs task remains incomplete and blocks behavior tasks rather than silently accepting contradictory documentation.
  Commit: Y | docs(status): establish portable relocation and provider baseline

- [x] 5. Capture a reproducible pre-change test and build baseline at the SSD destination
  What to do / Must NOT do: Install/verify locked dependencies and run the existing offline test, typecheck, lint, bridge, and build commands before behavioral edits; record failures as baseline rather than hiding them; do not use live provider credentials or network generation.
  Parallelization: Wave 1 | Blocked by: 1, 2 | Blocks: 16
  References (executor has NO interview context - be exhaustive): `package.json:17-39`; `scripts/run-bridge-tests.cjs:7-16`; `engine/tests`; `tests/main`; `tests/renderer-state.test.cjs`; `tests/zernio`; `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip-assessment.md:45-51`.
  Acceptance criteria (agent-executable): run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:bridge`, `python -m pytest -q engine/tests`, and `npm run build`; save command, exit code, counts, and environment in `.omo/evidence/bridgeclip-ssd-portable-ai/task-5-baseline.md`; classify every failure as pre-existing or introduced, with no unexplained skips.
  QA scenarios (name the exact tool + invocation): happy — the command set completes with recorded results and no paid calls, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-5-baseline.md`; failure — stop before feature edits if the baseline cannot be reproduced, preserving the exact failing command and log.
  Commit: N | test(baseline): record pre-change verification; no code changes

- [ ] 6. Install and verify a mandatory CUDA/Vulkan NeMo GPU runtime
  What to do / Must NOT do: Stage an official NeMo-Speech.cpp v0.1.0 CUDA or Vulkan build compatible with the RTX 3090/driver, preserve the existing Nemotron GGUF without downloading another model, add explicit device selection to both local transcription call sites, and prove a real GPU transcription; CPU-only success cannot close this task.
  Parallelization: Wave 2 | Blocked by: 2, 4 | Blocks: 16
  References (executor has NO interview context - be exhaustive): `engine/clip_engine/config.py:657-661`; `engine/clip_engine/services/transcription_service.py:633-689,844-848`; `src/main/automation-metadata.ts:58-105`; `src/main/pipeline-runner.ts:413-420`; `engine/tests/test_transcription.py:104-121`; `engine-bin/nemo-speech/bin`; official NeMo-Speech.cpp v0.1.0 release/docs; source fixture `test_files/asr/wav/test/jfk.wav` from the official NeMo-Speech.cpp checkout.
  Acceptance criteria (agent-executable): stage the official `test_files/asr/wav/test/jfk.wav` as `engine/tests/fixtures/nemo-jfk.wav` without downloading a model; use the exact existing model path `engine-bin/models/nemotron-3.5-asr-streaming-0.6b.q8_0.gguf`; `nemo-speech doctor --json` reports a compiled CUDA or Vulkan backend; the GPU transcription exits 0, returns text containing `fellow Americans`, and returns a non-empty `words[]` array with monotonic start/end timestamps; the existing model SHA-256 is unchanged; CPU invocation remains tested as diagnostic only; no CUDA/Vulkan acceptance is inferred from Handy or from file names.
  QA scenarios (name the exact tool + invocation): happy — `nemo-speech doctor --json` plus `nemo-speech transcribe "engine\tests\fixtures\nemo-jfk.wav" --model "engine-bin\models\nemotron-3.5-asr-streaming-0.6b.q8_0.gguf" --language en-US --device cuda:0 --format json` (or the verified Vulkan equivalent), then a JSON assertion for `fellow Americans`, non-empty words, and monotonic timestamps plus the Python transcription test, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-6-gpu.md`; failure — if the GPU archive/doctor/fixture fails, leave the CPU path explicitly marked incomplete and report the exact driver/runtime error; do not download a replacement model.
  Commit: Y | feat(gpu): make local Nemotron GPU execution mandatory and verified

- [ ] 7. Introduce an explicit provider and model-role contract
  What to do / Must NOT do: Define typed provider IDs and capability records for local ASR, OpenRouter, and Codex; carry selected provider/model through the job contract and bridge; replace unconditional OpenRouter/GLM gates with provider-specific validation; do not allow renderer-supplied arbitrary URLs, slugs, environment names, or secret values.
  Parallelization: Wave 2 | Blocked by: 2, 4 | Blocks: 8, 9, 10, 16
  References (executor has NO interview context - be exhaustive): `src/shared/jobs.ts:1-107`; `src/shared/job-contract.ts:1-12`; `bridge/bridge_runner.py:163-207,283-333`; `engine/clip_engine/config.py:566-661`; `engine/clip_engine/services/openrouter.py:58-128`; `src/main/ipc-handlers.ts:141-205`.
  Acceptance criteria (agent-executable): one versioned contract accepts only `local-nemo`, `openrouter`, or `codex` plus a validated model ID/role; missing credentials fail only for the selected provider; `bridge_runner.py` no longer overwrites the selected planner model; both shared/Python contract versions match; fixture tests cover unknown provider, missing key, unsupported modality, and model mismatch.
  QA scenarios (name the exact tool + invocation): happy — bridge and engine contract tests plus mocked planner/layout calls, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-7-provider-contract.md`; failure — malicious provider/model/URL input is rejected before process spawn and no secret appears in the error/log output.
  Commit: Y | feat(providers): add validated provider and model-role contract

- [ ] 8. Add official Codex-managed ChatGPT authentication and account lifecycle
  What to do / Must NOT do: Integrate the official Codex app-server process from the main process (not a hand-written OAuth client and not raw token extraction); implement explicit login, account/status, model inventory, logout, and child-process lifecycle; configure `CODEX_HOME` under non-secret portable data and Windows Keyring for credentials; do not copy `auth.json`, expose raw tokens, or claim generic ChatGPT/API access.
  Parallelization: Wave 2 | Blocked by: 2, 4, 7 | Blocks: 9, 10, 16
  References (executor has NO interview context - be exhaustive): `src/main/settings-store.ts:80-196`; `src/main/ipc-handlers.ts:55-78`; `src/preload/index.ts:16-24,164-252`; `src/main/security.ts:7-25`; `src/main/zernio/callback-server.ts:71-139`; `src/shared/zernio.ts:1-3`; `developers.openai.com/codex/auth`; `developers.openai.com/codex/app-server`; `openai.com/index/unlocking-the-codex-harness/`.
  Acceptance criteria (agent-executable): mocked app-server login/account/logout/model-list responses produce renderer-safe status DTOs; the child is launched with truthful client metadata and an isolated `CODEX_HOME`; no reusable token is written to `data`, logs, renderer state, argv, fixtures, or Git; logout terminates/revokes the managed session without deleting non-secret runtime state; UI labels this provider as Codex/ChatGPT-plan access, separate from API billing.
  QA scenarios (name the exact tool + invocation): happy — TypeScript main-process tests with a fake app-server and Keyring adapter, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-8-codex-auth.md`; failure — app-server timeout, cancelled login, malformed response, and unavailable Keyring return structured errors with no token leakage.
  Commit: Y | feat(auth): add Codex-managed ChatGPT account lifecycle

- [ ] 9. Implement local, OpenRouter, and Codex model discovery without generation
  What to do / Must NOT do: Add explicit user-triggered discovery for project-local model artifacts, OpenRouter `/models/user`, and Codex model inventory; classify ASR versus LLM roles and capabilities; persist only safe metadata and selected IDs; do not download models, call generation endpoints, or perform network discovery on startup.
  Parallelization: Wave 2 | Blocked by: 2, 4, 7, 8 | Blocks: 10, 16
  References (executor has NO interview context - be exhaustive): `engine/clip_engine/config.py:657-661,792-801`; `src/main/settings-store.ts:11-49`; `src/main/ipc-handlers.ts:55-78`; `src/preload/index.ts:16-24`; OpenRouter model API docs; official Codex app-server model-list contract.
  Acceptance criteria (agent-executable): local inventory enumerates only existing configured model roots and reports unclassified files; OpenRouter discovery is explicit, authenticated, mocked, and non-generative; Codex discovery requires managed login and returns only supported Codex inventory; selected provider/model/role is persisted without keys; all network calls have timeout, redirect blocking, and safe error mapping.
  QA scenarios (name the exact tool + invocation): happy — fixture-driven discovery tests and `npm test`/Python tests, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-9-discovery.md`; failure — unavailable network, 401/403/429/5xx, malformed model JSON, missing local model, and incompatible modality all return actionable non-secret errors without fallback generation.
  Commit: Y | feat(models): add safe local/OpenRouter/Codex discovery

- [ ] 10. Add provider/model/device selectors to the renderer through typed IPC
  What to do / Must NOT do: Extend Settings/Create/JobForm UI with provider selection, model selection, Codex login/account controls, local model inventory, and GPU/device diagnostics; use main-process IPC only; do not expose tokens, arbitrary provider endpoints, or network access to renderer.
  Parallelization: Wave 2 | Blocked by: 2, 4, 7, 8, 9 | Blocks: 16
  References (executor has NO interview context - be exhaustive): `src/renderer/pages/SettingsPage.tsx:64-159`; `src/renderer/components/JobForm.tsx:66,335-376`; `src/renderer/hooks/use-api-key-drafts.ts:1-71`; `src/renderer/store/use-settings-store.ts:18-110`; `src/renderer/store/use-job-store.ts:1-50`; `src/preload/index.ts:54-156`; `src/main/ipc-handlers.ts:55-205`.
  Acceptance criteria (agent-executable): renderer receives only typed status/configured booleans and model metadata; selector state survives a reload through the portable settings store; unavailable provider/key/model produces inline actionable state; selected values are included in the validated job request; no `fetch` to OpenRouter/OpenAI/model hosts exists in renderer code.
  QA scenarios (name the exact tool + invocation): happy — renderer state tests, typecheck, and mocked IPC tests, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-10-ui.md`; failure — renderer cannot invoke arbitrary URLs or read a secret, and rejected model/provider input never reaches `spawn`.
  Commit: Y | feat(ui): add provider model and GPU controls

- [ ] 11. Establish a versioned project-local portable data root and migration
  What to do / Must NOT do: Move settings, logs, thumbnails, temporary work, automation state, history metadata, and non-secret Codex state under a project-local `data\` root selected before stores initialize; migrate existing OS userData state with backups/manifest and version checks; keep Windows Keyring credentials outside portable files; do not copy secrets or blindly merge incompatible stores.
  Parallelization: Wave 3 | Blocked by: 1, 3 | Blocks: 12, 15, 16
  References (executor has NO interview context - be exhaustive): `src/main/index.ts:29-43,141-158`; `src/main/settings-store.ts:58-181`; `src/main/logger.ts`; `src/main/file-manager.ts:159`; `src/main/pipeline-runner.ts:89-147`; `src/main/automations.ts:46-47`; `src/main/zernio/service.ts:81`; `src/main/zernio/posts.ts:67,150`; `.gitignore:1-21`.
  Acceptance criteria (agent-executable): fresh installs create only the documented `data\` layout; first-run migration copies non-secret legacy data atomically with a manifest and rollback; settings/history/automation paths contain no old userData path; Keyring is queried, not exported; restart and interrupted-migration tests preserve recoverable state.
  QA scenarios (name the exact tool + invocation): happy — isolated temp `userData` migration/restart tests, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-11-portable-data.md`; failure — invalid manifest, partial copy, locked file, and unavailable Keyring stop with the source untouched and a recovery record.
  Commit: Y | feat(portable): add versioned project-local data root

- [ ] 12. Add portable drafts, recent-project index, crash recovery, and non-destructive history clearing
  What to do / Must NOT do: Persist Create drafts and recent projects, maintain a versioned history index across output directories, reconcile running/interrupted jobs after restart, and add explicit clear-history behavior that removes index/tombstone metadata only; never silently delete output media or claim a clear operation that deletes files.
  Parallelization: Wave 3 | Blocked by: 11 | Blocks: 15, 16
  References (executor has NO interview context - be exhaustive): `src/main/run-history.ts:8-119`; `src/main/file-manager.ts:46-117`; `src/renderer/store/use-draft-store.ts:18-72`; `src/renderer/pages/LibraryPage.tsx:20-189`; `src/renderer/pages/JobsPage.tsx:24-31,250`; `src/main/ipc-handlers.ts:206-238`; `src/preload/index.ts:100-156`; `tests/main/security.test.cjs:333-365`; `tests/main/job-manager.test.cjs:139-141`.
  Acceptance criteria (agent-executable): draft/recent-project state survives restart; history index records run ID, provider/model, source label, output path, status, timestamps, and recovery state; crash simulation marks unfinished work recoverably; clear-history leaves output files untouched and is separately named from delete-media; migration from existing output-derived history is deterministic and idempotent.
  QA scenarios (name the exact tool + invocation): happy — renderer/main persistence tests plus restart/crash fixture, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-12-history.md`; failure — corrupt index, missing output directory, duplicate run ID, and interrupted clear leave media intact and recover from backup.
  Commit: Y | feat(history): add portable recovery and safe history controls

- [ ] 13. Repair resource staging, packaging, manifest, and third-party notices
  What to do / Must NOT do: Make Windows and macOS resource staging deterministic for the correct venv, GPU NeMo runtime, existing model, launchers, and public snapshot; update packaging validation and notices; do not download a new model, publish a release, sign with unknown credentials, or include secrets.
  Parallelization: Wave 3 | Blocked by: 2, 3, 4 | Blocks: 15, 16
  References (executor has NO interview context - be exhaustive): `electron-builder.yml:17-114`; `scripts/prepare-resources.sh:6-58`; `scripts/verify-packaged-mac.sh:30-86`; `scripts/public-draft-manifest.txt:1-173`; `scripts/export-public-draft.sh:23-114`; `THIRD_PARTY_NOTICES.md:8-11`; `start-windows.cmd`; `start-windows.ps1`.
  Acceptance criteria (agent-executable): a clean staging directory contains the selected GPU runtime, existing model hash, `engine/tests/fixtures/nemo-jfk.wav`, correct Python venv, FFmpeg/ffprobe/yt-dlp, launchers, and no `data`/secret files; `npm run build` and an unpacked Windows packaging command succeed; resource verification fails clearly when NeMo/model/venv is absent; manifest/docs agree; NVIDIA/NeMo/ggml notices are present.
  QA scenarios (name the exact tool + invocation): happy — `npm run build`, `npx electron-builder --win dir` or the repository's non-publishing equivalent, resource assertions, and manifest check, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-13-packaging.md`; failure — missing runtime/model, stale venv, secret file, or unlisted launcher fails the staging test without publishing.
  Commit: Y | build(packaging): stage portable GPU runtime and public resources

- [ ] 14. Harden secrets, egress, process boundaries, and provider failure handling
  What to do / Must NOT do: Ensure no reusable secret enters renderer/Git/logs/argv, replace or isolate child-process secret handoff, enforce provider host allowlists and redirect blocking, validate all IPC/model/source inputs, and add regression tests for secret redaction, path traversal, prompt/data boundaries, and network failure; do not add a raw-token storage mode.
  Parallelization: Wave 3 | Blocked by: 3, 4, 7, 8 | Blocks: 15, 16
  References (executor has NO interview context - be exhaustive): `src/main/settings-store.ts:80-196,234-240`; `src/main/pipeline-runner.ts:383-439,709-715`; `src/main/security.ts:7-25`; `src/main/network-policy.ts:16-63`; `bridge/network_guard.py:24-51`; `engine/clip_engine/network_policy.py:23-152`; `engine/clip_engine/logging_safety.py:8-10`; `tests/main/security.test.cjs:13-65`; `engine/tests/test_openrouter_security.py:38-77`.
  Acceptance criteria (agent-executable): renderer receives no secret values; worker handoff exposes no reusable token in logs/argv/crash-safe output; only approved provider destinations are reachable; redirects, oversized responses, malformed JSON, private destinations, and prompt-injection fixtures fail safely; redacted secret scan passes.
  QA scenarios (name the exact tool + invocation): happy — Node/Python security tests, static secret grep, mocked HTTP redirect/oversize tests, and Gitleaks, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-14-security.md`; failure — any secret echo, private redirect, unapproved host, or unsafe IPC input fails closed and records a sanitized diagnostic.
  Commit: Y | fix(security): enforce provider and secret trust boundaries

- [ ] 15. Synchronize all product and operational documentation with completed behavior
  What to do / Must NOT do: Update architecture, transcription/GPU, providers/auth, portable Windows, packaging/release, security, upstream-sync, README, and project-status documents after the corresponding behavior is verified; record commands, hashes, migration state, and unresolved external prerequisites; do not claim completion from code alone or overwrite historical security reports.
  Parallelization: Wave 3 | Blocked by: 3, 4, 6–14 | Blocks: 16
  References (executor has NO interview context - be exhaustive): `README.md:26-130`; `docs/ARCHITECTURE.md`; `docs/transcription.md`; `docs/automation-metadata.md`; `SECURITY.md`; `docs/SECURITY_REVIEW_2026-09-24.md`; `docs/SECURITY_FOLLOWUP_2026-09-24.md`; `docs/RELEASING.md`; `docs/OPEN_SOURCE_READINESS.md`; `docs/PROJECT_STATUS.md`; `docs/PORTABLE_WINDOWS.md`; `docs/PROVIDERS.md`; `docs/UPSTREAM_SYNC.md`.
  Acceptance criteria (agent-executable): every current feature has a documented user flow, data location, failure behavior, and verification command; `docs/PROJECT_STATUS.md` lists completed stages and exact evidence paths; no current doc claims CPU-only, generic ChatGPT API, or missing NeMo packaging as complete; Markdown links resolve; historical reports remain labeled historical.
  QA scenarios (name the exact tool + invocation): happy — targeted stale-term/link audit plus manual diff review, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-15-docs.md`; failure — any contradiction between docs and acceptance evidence blocks handoff.
  Commit: Y | docs(status): synchronize architecture operations and completion records

- [ ] 16. Run full offline regression, packaging, GPU, restart, and failure-path QA
  What to do / Must NOT do: Execute the complete verification matrix at the SSD destination, including all existing tests, new regression tests, typecheck/lint/build, GPU fixture, provider mocks, migration/restart/crash, resource staging, and negative security cases; do not call paid/authenticated providers, push, tag, or delete the D: source.
  Parallelization: Wave 4 | Blocked by: 1–15 | Blocks: F1–F4
  References (executor has NO interview context - be exhaustive): `package.json:17-39`; `scripts/run-bridge-tests.cjs:7-16`; `engine/tests`; `tests/main`; `tests/renderer-state.test.cjs`; `tests/create-form.test.cjs`; `tests/zernio`; `tests/main/local-file.e2e.cjs`; `tests/zernio/support/electron-app.cjs`; `docs/PROJECT_STATUS.md`.
  Acceptance criteria (agent-executable): add or retain an agent-run Electron smoke test at `tests/main/portable-smoke.e2e.cjs` that launches the SSD checkout, exercises Settings/provider selection, local GPU transcription, draft persistence, restart/crash recovery, and non-destructive history clearing; run it with `node --test tests/main/portable-smoke.e2e.cjs`; run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:bridge`, `python -m pytest -q engine/tests`, `npm run build`, local packaged-resource checks, `nemo-speech doctor --json`, the exact GPU fixture from todo 6, migration/restart/crash tests, and secret scan; every result has an evidence file and no paid network generation occurred.
  QA scenarios (name the exact tool + invocation): happy — `node --test tests/main/portable-smoke.e2e.cjs` plus the full command matrix and local app smoke run, evidence `.omo/evidence/bridgeclip-ssd-portable-ai/task-16-full-qa.md`; failure — stop before final review and preserve the first failing command, stdout/stderr artifact, environment, and suspected regression owner.
  Commit: N | test(regression): record final offline verification; no source commit

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  What to do / Must NOT do: Read every implementation todo and compare its references, acceptance, QA, commit, and dependency claims against the live SSD checkout; reject missing paths, stale claims, skipped evidence, or unapproved scope expansion; do not modify product code.
  Parallelization: Final wave | Blocked by: 1–16 | Blocks: completion
  References (executor has NO interview context - be exhaustive): this complete plan; `.omo/evidence/bridgeclip-ssd-portable-ai/`; `.omo/drafts/bridgeclip-ssd-portable-ai.md`.
  Acceptance criteria (agent-executable): every `- [ ] N.` row has all required fields, every `- [ ] F<n>.` row is present, dependencies are acyclic, and all evidence paths exist; verdict is `APPROVE` or `REJECT` with cited todo IDs.
  QA scenarios (name the exact tool + invocation): happy — structural Markdown/task parser plus evidence existence check, `.omo/evidence/bridgeclip-ssd-portable-ai/final-F1.md`; failure — report the first noncompliant todo and block the final wave.
  Commit: N | review(plan): audit compliance; no product commit
- [ ] F2. Code quality and security review
  What to do / Must NOT do: Review changed source/tests/docs for correctness, type safety, secret boundaries, migration safety, path handling, provider policy compliance, and absence of CPU-only GPU claims; do not fix code in the reviewer or waive a failed secret/GPU assertion.
  Parallelization: Final wave | Blocked by: 1–16 | Blocks: completion
  References (executor has NO interview context - be exhaustive): `src/main`; `src/preload`; `src/shared`; `src/renderer`; `bridge`; `engine/clip_engine`; `engine/tests`; `tests`; `docs`; `.gitignore`; `electron-builder.yml`.
  Acceptance criteria (agent-executable): diagnostics are clean, imports/types are complete, no secret/token fixture is real, network boundaries are deny-by-default, and all changed docs match behavior; verdict is `APPROVE` or `REJECT` with file/line findings.
  QA scenarios (name the exact tool + invocation): happy — `lsp_diagnostics`, `npm run typecheck`, `npm run lint`, targeted security tests, and static secret scan, `.omo/evidence/bridgeclip-ssd-portable-ai/final-F2.md`; failure — any real credential, raw-token path, unsafe redirect, stale absolute D: path, or GPU claim mismatch yields `REJECT`.
  Commit: N | review(quality): inspect code and security; no product commit
- [ ] F3. Real local manual QA
  What to do / Must NOT do: Launch the SSD checkout through `start-windows.ps1`, exercise settings/provider selection, local GPU transcription, draft persistence, restart/crash recovery, history clear-without-media-delete, and packaged-resource checks; do not use paid/authenticated provider calls or delete the source.
  Parallelization: Final wave | Blocked by: 1–16 | Blocks: completion
  References (executor has NO interview context - be exhaustive): `start-windows.ps1`; `src/renderer/pages/SettingsPage.tsx`; `src/renderer/components/JobForm.tsx`; `src/renderer/pages/LibraryPage.tsx`; `engine/clip_engine/services/transcription_service.py`; `tests/main/portable-smoke.e2e.cjs`; `tests/zernio/support/electron-app.cjs`; `docs/PORTABLE_WINDOWS.md`; `docs/PROJECT_STATUS.md`.
  Acceptance criteria (agent-executable): local app starts from `Y:\ProjectsAI\bridgeclip`; the agent-run `node --test tests/main/portable-smoke.e2e.cjs` flow exercises settings/provider selection, GPU fixture with word timestamps, restart/crash recovery, and non-destructive history clearing; CPU-only behavior is visibly diagnostic and not reported as GPU success; evidence includes exact command output and artifact paths.
  QA scenarios (name the exact tool + invocation): happy — `node --test tests/main/portable-smoke.e2e.cjs` with the SSD checkout and `.omo/evidence/bridgeclip-ssd-portable-ai/final-F3.md`; failure — any broken flow, stale path, missing GPU evidence, or media deletion yields `REJECT`.
  Commit: N | qa(manual): record SSD local smoke; no product commit
- [ ] F4. Scope, Git, and documentation fidelity review
  What to do / Must NOT do: Verify origin/upstream boundaries, no source deletion, no direct upstream/force/history rewrite, no new GitHub repo, no automatic model downloads, no paid calls, and complete documentation/status evidence; do not treat a passing test as proof of scope fidelity.
  Parallelization: Final wave | Blocked by: 1–16 | Blocks: completion
  References (executor has NO interview context - be exhaustive): `.git/config`; `.gitignore`; `scripts/public-draft-manifest.txt`; `docs/UPSTREAM_SYNC.md`; `docs/PROJECT_STATUS.md`; this plan's Scope and Must NOT have sections.
  Acceptance criteria (agent-executable): only the existing origin/upstream remain configured; no force-push/tag/release/source deletion occurred; tracked/exported bytes pass manifest and secret checks; every scope item has a todo and every todo has evidence; verdict is `APPROVE` or `REJECT`.
  QA scenarios (name the exact tool + invocation): happy — Git diff/status/remote inspection, manifest comparison, Gitleaks, and scope-to-task checklist, `.omo/evidence/bridgeclip-ssd-portable-ai/final-F4.md`; failure — any unapproved remote, missing documentation, or out-of-scope change yields `REJECT`.
  Commit: N | review(scope): verify Git docs and boundaries; no product commit

## Commit strategy
- Work on `feature/bridgeclip-ssd-portable-ai` from the verified `origin/main` checkout; do not edit the D: source.
- Make atomic commits per completed todo: relocation/runtime, GPU, provider/auth, discovery/UI, portable state/history, packaging/security, and docs.
- Run the task's offline tests and documentation checks before each commit; never commit `data\`, `engine-bin\`, `engine-venv\`, `.venv`, auth files, keys, or model files.
- Keep `origin` as the product remote and `upstream` as read-only/update source. Do not merge upstream until a dedicated sync branch has a fresh fetch, conflict review, and full offline verification.
- Push the feature branch to `origin` only after F1–F4 approve; never push directly to upstream or rewrite shared history. Merge to owner main only in a separate explicit owner-approved step.

## Success criteria
- `Y:\ProjectsAI\bridgeclip` contains a verified standalone Git checkout with matching history/remotes, working project-local runtime, no stale D: path references, and the original D: source untouched.
- `nemo-speech doctor --json` reports a compiled CUDA/Vulkan backend and a real local GPU transcription fixture succeeds with word timestamps; CPU-only evidence is not accepted as completion.
- BridgeClip can select and persist local/OpenRouter/Codex providers and models, discover models only through explicit safe paths, and keep all credentials in main-process/Windows Keyring ownership.
- Settings, drafts, recent projects, history metadata, logs, work/recovery state, and non-secret Codex state survive restart at the portable data root; clear history never deletes media implicitly.
- Packaging, public manifest, third-party notices, architecture/status/runbooks, CI/security checks, and all offline tests pass with evidence.
- No raw secrets, automatic model downloads, paid provider calls, direct upstream writes, force-pushes, history rewrites, or source deletion occur.
- F1, F2, F3, and F4 all return `APPROVE`; only then may the worker request the owner's explicit handoff/push decision.
