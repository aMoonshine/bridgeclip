# Upstream synchronization

## Branches and remotes

- `upstream` = `https://github.com/bridge-mind/bridgeclip.git`, read-only.
- `origin` = `https://github.com/aMoonshine/bridgeclip.git`, our fork.
- `main` is the local mirror of the fetched upstream base.
- `ours/upstream-overlay` is the current application branch, based on upstream
  `f6c722672d10b04b2bc93b1e253697477d5fc6b1` (v0.1.18). Run the app from this branch.
- `ours/ui-overhaul` at `ce653d5` preserves the previous implementation.
- `codex/archive-main-2026-09-26` preserves the former local main at `a217f87`.
- `origin/main` still contains legacy fork history. It is not yet an upstream
  mirror. Do not force-push it; migrating the remote default branch is a separate action.

The owner authorized saving the current overlay to their GitHub fork on 2026-09-26.
Saving a work checkpoint does not certify a release. Framing remains visually
unverified; see `FORK_DECISIONS_AND_BACKLOG.md` for verification and open bugs.

## Update workflow

Keep fork features as commits above the upstream base. Never rewrite a published
branch: rebase a new versioned branch and publish that branch normally. The old
branch remains the rollback point. This reconciles replaying our changes with
preserving published history, without force-pushes.

1. Commit current work; require a clean working tree.
2. Fetch `upstream` and `origin`. Review upstream release notes and diff.
3. Record the old upstream base and create `codex/overlay-<version>` from the
   current application branch.
4. Run `git rebase --onto <new-upstream-sha> <old-upstream-sha>` on that new branch.
   Resolve conflicts while preserving the useful features below. Use
   `git rebase --abort` if integration cannot be completed safely.
5. Review `git range-diff <old-base>..<old-overlay> <new-base>..HEAD` to check that
   no fork feature was lost. Drop a local patch only when upstream covers it.
6. Run scoped engine/bridge tests, typecheck, lint and build; check the UI and a
   real framing example. Verify cache reuse without a YouTube request, resolution
   limits for new downloads, settings persistence and mode/model switching.
7. Publish the new branch to `origin` with `git push -u origin HEAD`. Record the
   new application branch and upstream SHA in both project documents.
8. Fast-forward local `main` with `git branch -f main <new-upstream-sha>` only
   after checking ancestry and confirming main is not checked out elsewhere.
   Run the application from the overlay branch, never the mirror.

Do not push to upstream or create upstream PRs. Do not publish releases or move
release tags as part of routine sync. Use immutable tags on verified overlay
commits for future builds; no separate release branch is required yet.

## Features to retain and verify

- Downloaded-source cache, source-folder picker and offline reuse of saved media.
- Output-folder selection and download-resolution controls.
- Hosted model selection and reset to defaults when clipping mode changes.
- Render concurrency, 24-hour time and title-card removal.
- Windows double-click launcher (`start-windows.cmd`).
- Framing fixes only after visual verification; current person-box patch is provisional.

Cloud transcription is the supported path; do not restore local ASR, diarization
or optional NVENC controls during conflict resolution.

## Files outside Git

`comp2.conf` contains credentials and is ignored. Cached videos, Python/Node
runtimes and dependencies are also outside Git. Preserve credentials separately
in a private backup; clone plus dependency installation restores source tooling.
Never create junctions for runtime or dependency directories in this checkout.
