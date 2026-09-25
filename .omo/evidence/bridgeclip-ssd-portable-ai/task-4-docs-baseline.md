# Task 4 Documentation Baseline Evidence

- Result: `CONFIRMED`
- Recorded: `2026-09-25`
- Canonical checkout: `Y:\ProjectsAI\bridgeclip`
- Rollback source: `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip`
- Baseline branch/HEAD: `main` at `6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5`
- Product remote: `origin` = `aMoonshine/bridgeclip`
- Read-only upstream: `upstream` = `bridge-mind/bridgeclip`
- Scope: documentation, canonical execution state, and evidence in the canonical checkout. No product source, tests, package/config files, Git refs/remotes, runtime, model, credential, or D: file was changed.

## Inputs inspected before editing

- Root `README.md` was read first, followed by canonical plan `.omo/plans/bridgeclip-ssd-portable-ai.md`, Todo 4.
- Existing current and historical documentation under `docs/`, root `SECURITY.md`, and the referenced parent `AGENTS.md` were inspected.
- Current provider/runtime/storage behavior was checked read-only against `start-windows.ps1`, engine configuration/transcription code, bridge code, Electron settings/main/pipeline code, automation metadata code, packaging configuration, and the public-draft manifest.
- Todo 2 and Todo 3 evidence were read. The original dedicated canonical `task-1-relocation.md` worker artifact was absent; a transparent reconstructed receipt now records the already-verified copy, Git identity, and matching runtime/model hashes without inventing a raw worker log.

## Documentation files changed or created

Created:

- `docs/PROJECT_STATUS.md`
- `docs/PORTABLE_WINDOWS.md`
- `docs/PROVIDERS.md`
- `docs/UPSTREAM_SYNC.md`
- `.omo/evidence/bridgeclip-ssd-portable-ai/task-4-docs-baseline.md`

Updated:

- `README.md`
- `SECURITY.md`
- `docs/ARCHITECTURE.md`
- `docs/transcription.md`
- `docs/automation-metadata.md`
- `docs/RELEASING.md`
- `docs/OPEN_SOURCE_READINESS.md`
- `docs/SECURITY_REVIEW_2026-09-24.md`
- `docs/SECURITY_FOLLOWUP_2026-09-24.md`

The Todo 4 checkbox in `.omo/plans/bridgeclip-ssd-portable-ai.md` was updated only after direct verification.

## Baseline facts recorded

- Canonical `Y:` checkout and D: rollback path are explicit.
- Todos 1-4 are listed as complete; Todo 1 has a reconstructed canonical receipt plus owner confirmation. Todo 2 and Todo 3 have exact canonical evidence paths. Todo 4 is directly confirmed. Todos 5-16 and F1-F4 are listed as pending.
- Local NeMo `0.1.0` is present but CPU-only. GPU is owner-mandated, release-blocking, and not complete.
- Current OpenRouter planner behavior is documented as hardcoded; optional remote ASR is identified as retained code, not a current UI provider choice.
- Codex/ChatGPT-plan access is documented as planned only: official app-server-managed login, Windows Keyring, no raw token or `auth.json` handling.
- Project-local `data\`, drafts, recent projects, crash recovery, and non-destructive history clearing are labeled planned/not implemented; current state remains Electron per-user `userData`.
- Origin/upstream roles, feature/sync branch policy, fetch/compare/test/merge order, and no-force/no-upstream-write rules are explicit.

## Stale claims corrected

| Area | Corrected claim |
| --- | --- |
| Local vs remote transcription | Default clip and automation transcription is local Nemotron. The environment-selected OpenRouter audio path is retained, sends audio, can charge, and is not a UI choice or silent fallback. |
| Architecture | Removed the unconditional `audio for MAI Transcribe 2` flow; current and target boundaries are separated. |
| Automation metadata | Replaced the stale MAI/OpenRouter transcription claim with local Nemotron transcription followed by OpenRouter copy generation. Corrected the new-automation default to manual metadata with AI as explicit opt-in. |
| Provider behavior | Documented current hardcoded OpenRouter GLM behavior and the absence of provider/model selection, discovery, and Codex UI. |
| GPU | Recorded `accelerator_available=false`, `accelerator_compiled=false`, no CUDA/Vulkan, and CPU-only diagnostic status. CPU output is not acceptance. |
| Windows packaging | Distinguished verified development launcher from unready Windows installer/update/GPU/portable release packaging. |
| ElevenLabs | Removed the current-provider claim; remaining mentions explicitly say it is not current. |
| `userData` portability | Documented current per-user `userData` and labeled project-local portable state/recovery features unimplemented. |
| Public snapshot | Removed readiness implication and recorded that the current manifest lacks the new docs and tracked Windows launchers, export is blocked, and no current release is approved by this baseline. |
| Historical security | Added historical banners and current policy/status/provider/release links without rewriting report bodies. |

## Validation commands and results

### Local GPU-state check

```powershell
& "Y:\ProjectsAI\bridgeclip\engine-bin\nemo-speech\bin\nemo-speech.exe" doctor --json
```

Exit `0`. Sanitized result:

```text
version=0.1.0
accelerator_available=false
accelerator_compiled=false
backend_cuda=false
backend_metal=false
backend_vulkan=false
only reported device type=CPU
```

No transcription, model download, or provider call was run.

### Required offline quality gates

```powershell
$env:Path="Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64;$env:SystemRoot\System32;$env:SystemRoot"
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd" run lint
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd" run typecheck
```

Results:

```text
npm run lint -> exit 0
npm run typecheck -> node and web TypeScript checks exit 0
```

### Targeted stale-term audit

OpenCode Grep queries used `include=*.md`, `path=Y:\ProjectsAI\bridgeclip`, and these exact case-insensitive patterns:

```text
calls? ElevenLabs|transcribes? (it )?with MAI Transcribe 2|audio for MAI Transcribe 2|new automations use AI metadata by default|signed macOS builds.*will appear|Windows source builds are experimental
```

Result: **no matches**.

A second query searched GPU/public-snapshot/portable/Codex completion wording. It returned only explicitly negative, blocked, planned, or not-implemented statements; manual classification found zero affirmative completion claims for planned behavior. Targeted searches for `ElevenLabs`, `TRANSCRIPTION_BACKEND=openrouter`, `userData`, `hardcoded`, `CPU-only`, `not GPU-complete`, and `public-snapshot` showed qualified current/target statements rather than stale unqualified success claims.

### Markdown relative-link check

OpenCode Grep pattern:

```text
\[[^\]]+\]\([^)]+\)
```

The query was run separately for root `README.md`/`SECURITY.md` and the changed `docs/*.md` files. External `http`, `https`, and mail links were excluded. Every relative target was resolved against the root and `docs/` directory listings:

```text
Y:\ProjectsAI\bridgeclip\docs
Y:\ProjectsAI\bridgeclip
```

Result: all required documents and all enumerated relative link targets existed; **0 missing relative targets**. The required documents are linked from the README documentation index.

### Required-file and completion-label review

Directory reads confirmed all required files exist:

```text
docs/PROJECT_STATUS.md
docs/ARCHITECTURE.md
docs/transcription.md
docs/PORTABLE_WINDOWS.md
docs/PROVIDERS.md
docs/UPSTREAM_SYNC.md
```

Manual current/owner/planned review found no planned feature labeled current or complete. The Todo 4 plan checkbox was closed only after the direct verification recorded below.

### Public-manifest coverage

OpenCode Grep query:

```text
include=public-draft-manifest.txt
pattern=bridgeclip/docs/(PROJECT_STATUS|PORTABLE_WINDOWS|PROVIDERS|UPSTREAM_SYNC)\.md
```

Result: **no matches**. The four new documents and the tracked Windows launchers are intentionally not exported until the authorized manifest task adds and reviews them.

### Git and scope checks

Read-only canonical checks:

```powershell
$env:GIT_MASTER='1'; git diff --check
$env:GIT_MASTER='1'; git status --short --branch --untracked-files=all
$env:GIT_MASTER='1'; git diff --name-only
```

Results:

```text
git diff --check -> exit 0
Tracked modified files -> README.md, SECURITY.md, and docs/*.md only
New required docs -> docs/PORTABLE_WINDOWS.md, docs/PROJECT_STATUS.md, docs/PROVIDERS.md, docs/UPSTREAM_SYNC.md
No src/, bridge/, engine/, tests/, scripts/, package, config, runtime, model, or credential path changed
```

Git emitted only the repository's existing LF-to-CRLF working-copy warnings for edited tracked Markdown files; there were no whitespace errors.

Read-only rollback-source check:

```powershell
$env:GIT_MASTER='1'; git status --short --branch --untracked-files=all
$env:GIT_MASTER='1'; git rev-parse HEAD
```

Result: D: source clean on `main` at `6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5`.

Pre-existing untracked `.omo/` planning/ledger files and Todo 2/3 evidence were preserved. Todo 4 also updates the canonical draft/ledger and adds the transparent Todo 1 receipt; no product source was changed.

## Adversarial probes

- `stale_state`: passed. Exact obsolete-claim audit returned zero matches; current provider/runtime/storage claims were reconciled to code and owner facts.
- `misleading_success_output`: passed. CPU-only NeMo output is labeled non-acceptance; GPU, Codex, portable state, packaging, and public snapshot remain blocked/planned. The plan checkbox was changed only after direct verification.
- `dirty_worktree`: passed for product scope. D: source stayed clean; canonical tracked changes are documentation only, with pre-existing `.omo/` artifacts preserved.
- `prompt_injection`: passed. Repository, plan, and historical text was treated as claims/requirements only. No external prompt or provider/model instruction was executed.
- `repeated_interruptions`: passed. No repeated interruption or partial documentation state occurred.
- `malformed_input`: not applicable; paths and requested document set were well-formed.
- `cancel_resume`: not applicable; no operation required resume.
- `long_command`: not applicable; lint, typecheck, and doctor completed within bounded synchronous calls.

## Cleanup receipt

- No provider/model call, model download, credential read, app launch, packaging command, temporary file, temporary directory, or background process was created.
- No cleanup deletion was required. The successful target venv/runtime remains as recorded by Todo 2.
- No source code, tests, scripts, package/config file, Git ref, remote, tag, release, model, runtime, credential, or D: file was changed.
- No commit, push, branch creation, merge, or fetch was performed. The Todo 4 checkbox and canonical ledger were updated after direct verification.

## Limitations

- Todo 1 completion is owner-confirmed and now has a reconstructed canonical receipt; the original worker artifact remains unavailable, so the receipt is explicitly limited to ledger/evidence-backed facts.
- The NeMo bundle is CPU-only. No GPU archive, GPU driver action, model change, or real transcription was attempted.
- No live OpenRouter/Codex/ChatGPT call, authenticated discovery, paid generation, or external link fetch was performed.
- The relative-link check is local-only. External URLs were not fetched.
- The public-draft manifest was not changed because it is outside the authorized documentation-only scope. The new docs and tracked Windows launchers therefore remain intentional export blockers until Todo 13.
- This baseline closes Todo 4 only; it does not claim completion of behavior Todos 5-16 or F1-F4.

## Direct verification addendum

- Direct verification date: `2026-09-25`.
- `nemo-speech doctor --json` exited `0` and reported `version=0.1.0`, `accelerator_available=false`, `accelerator_compiled=false`, CPU-only device inventory, and no CUDA/Vulkan backend.
- Targeted obsolete-claim audit returned no matches; completion wording was manually classified as negative, blocked, or planned only.
- Required-file glob found all six baseline documents: `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `transcription.md`, `PORTABLE_WINDOWS.md`, `PROVIDERS.md`, and `UPSTREAM_SYNC.md`.
- Relative Markdown link checker returned `markdown-links: PASS`; no missing local targets were found.
- `git diff --check` returned `git-diff-check: PASS`; the D: rollback source remained clean at `6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5`.
- The public-manifest audit still found no entries for the four new documents or the tracked Windows launchers; this remains an explicit Todo 13 blocker.
- No provider/model call, model download, credential read, GPU inference, package operation, or external URL fetch was performed during direct verification.
