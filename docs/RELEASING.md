# Releasing BridgeClip

## Release status

**No release is approved by the current documentation baseline.** The repository contains macOS and Windows packaging configuration, but configuration is not release evidence.

Current blockers include:

- The local NeMo `0.1.0` bundle now passes GPU acceptance on Vulkan. Reproducing it on a clean machine still requires staging the official GPU archive by hand, which is not automated yet.
- Provider selection, official Codex/ChatGPT-plan access, explicit model discovery, and GPU device controls are not implemented.
- Project-local `data\`, migration, drafts, recent projects, crash recovery, and non-destructive history clearing are not implemented.
- Deterministic resource staging, the public-draft manifest, third-party notices, unpacked Windows packaging, signing, and clean-machine/update tests are not all verified.
- The manifest does not yet include the new documentation baseline or the tracked Windows launchers (`start-windows.cmd` and `start-windows.ps1`). `scripts/export-public-draft.sh` should reject unreviewed files rather than silently producing a public snapshot.

The existing `upstream` remote and any GitHub release page do not prove that the current checkout is a reviewed or releasable public snapshot. Start from the canonical `Y:\ProjectsAI\bridgeclip` checkout, the [project status](PROJECT_STATUS.md), and recorded evidence.

## Publication rules

1. Keep the D: source checkout unchanged as rollback evidence.
2. Do not publish from a dirty worktree, shallow history, stale model/runtime, or unreviewed exported bytes.
3. Do not include `data\`, credentials, raw tokens, `auth.json`, caches, local logs, or unreviewed ignored files.
4. Do not download a replacement ASR model automatically. Stage and hash the existing model only after ownership and redistribution review.
5. Do not make live paid/authenticated provider calls during automated release verification.
6. No tag, release, push, direct upstream write, or force-push is authorized by this document. Those actions require explicit owner approval after all gates pass.

## Required release order

### 1. Verify the source baseline

```powershell
git status --short --branch --untracked-files=all
git rev-parse --is-shallow-repository
git rev-parse HEAD
git remote -v
git fsck --full
```

Require a reviewed feature branch, full history, the expected `origin`/`upstream` roles, and no product-code changes outside the approved task. Record exact commands, exit codes, hashes, and evidence paths.

### 2. Rebuild the public-draft manifest

After the documentation and source review stabilizes, update `scripts/public-draft-manifest.txt` in its authorized task. Export to a new directory outside the checkout:

```bash
bash scripts/export-public-draft.sh /path/to/new-draft-directory
```

Review and secret-scan the exact exported bytes. The manifest checks paths, not ownership, licenses, model rights, or secret safety.

### 3. Run offline source verification

From the exact exported draft:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm audit --audit-level=low
```

Install locked Python dependencies, then run:

```bash
PYTHONPATH=engine python3 -m pytest -q engine/tests
```

Also run the Python dependency audit, resource/manifest checks, migration/restart/crash tests, provider mocks, and redacted Gitleaks scan. Record failures as failures; do not hide skips.

### 4. Verify GPU and packaged resources

Require `nemo-speech doctor --json` to report a compiled CUDA or Vulkan backend, then transcribe the approved local fixture with the existing model and verify text, non-empty words, and monotonic timestamps. CPU-only output is diagnostic only.

A clean staging directory must contain the selected venv, Node/Electron dependencies, FFmpeg/ffprobe/yt-dlp, verified GPU NeMo runtime, existing model with recorded hash, launchers, notices, and the approved fixture. It must not contain secrets or portable user data. Run `npm run build` and an unpacked Windows packaging command before any signed artifact.

### 5. Qualify artifacts

Test installation, first launch, local GPU transcription, mocked provider flows, migration, restart/crash recovery, history clearing without media deletion, and update behavior on clean target machines. Record exact artifact hashes and updater metadata.

### 6. Publish only after owner approval

Create a protected release only from the reviewed commit and exact artifacts. Freeze the commit SHA, require protected environments/reviewers, verify signatures/notarization where applicable, and keep the release draft until all checks pass. Push product branches only to `origin`; `upstream` remains read-only.

See [Portable Windows](PORTABLE_WINDOWS.md), [Open-source readiness](OPEN_SOURCE_READINESS.md), and [Upstream sync](UPSTREAM_SYNC.md).
