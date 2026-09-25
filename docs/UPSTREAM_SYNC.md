# Upstream synchronization

## Current verified state

- Canonical checkout: `Y:\ProjectsAI\bridgeclip`
- Current branch at this documentation baseline: `main`
- HEAD: `6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5`
- Product remote: `origin` = `aMoonshine/bridgeclip`
- Upstream remote: `upstream` = `bridge-mind/bridgeclip`
- Rollback source: none. The former `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip` checkout was removed by
  owner decision; recover through `origin` = `aMoonshine/bridgeclip` instead.

Todo 3 made the target history complete and fetched both remotes non-destructively. At that evidence point, local `main` matched `origin/main`; it was three commits ahead and nine behind `upstream/main`. No upstream commit was merged. Remote heads and branch-protection state are point-in-time facts and must be fetched again before any sync.

## Remote roles

- `origin` is the only product remote authorized for BridgeClip feature branches and later owner-approved pushes.
- `upstream` is read-only. Fetching and comparing it is allowed; pushing, opening upstream PRs, changing upstream settings, or treating it as the product home is not authorized by this plan.
- Do not create a second GitHub repository, replace either remote, or change remote URLs as part of synchronization.

## Branch policy

- Behavior work belongs on a dedicated feature branch, planned as `feature/bridgeclip-ssd-portable-ai`; it is not checked out at this documentation baseline.
- Upstream integration uses a separate short-lived branch named `sync/upstream-YYYYMMDD`, created from a freshly fetched `origin/main` after the worktree is clean.
- Do not merge upstream into a dirty feature branch or directly into owner `main`.
- A pre-existing local `codex/upstream-sync` ref is not proof of an approved sync. Review it independently before reuse.

## Fetch, compare, test, and merge order

These commands are the required future order. Do not run the merge steps until the preceding review is recorded.

```powershell
git status --short --branch --untracked-files=all
git fetch --prune origin
git fetch --prune upstream
git rev-parse HEAD
git rev-parse origin/main
git rev-parse upstream/main
git rev-list --left-right --count origin/main...upstream/main
git log --oneline --left-right --cherry-pick origin/main...upstream/main
git diff --stat origin/main...upstream/main
git diff --check origin/main...upstream/main
```

1. Confirm the canonical checkout and unchanged D: rollback source.
2. Start or update the feature branch through the normal owner-approved workflow.
3. Fetch both remotes and record exact remote HEADs; do not prune local work.
4. Create `sync/upstream-YYYYMMDD` from the current `origin/main`.
5. Compare history and diffs. Identify behavior, security, packaging, provider, and documentation conflicts before merging.
6. Merge `upstream/main` into the sync branch without force, rebase, or history rewriting. Resolve conflicts explicitly and preserve both sides' security/behavior intent.
7. Run the full offline verification set, including typecheck, lint, unit/integration tests, bridge and engine tests, build, packaging/resource checks, GPU fixture, provider mocks, migration/restart/crash tests, and secret scanning.
8. Push only the reviewed feature/sync branch to `origin` after explicit owner approval.
9. Merge to owner `main` only in a separate owner-approved step. Never push to `upstream`.

## Prohibited operations

- No force-push to either remote.
- No direct upstream write or upstream release/tag action.
- No history rewrite, tag movement/deletion, or release publication during sync.
- No silent conflict resolution that drops upstream security fixes or local provider/GPU/portable constraints.
- No paid provider/model calls as part of comparison or verification.

See [Project status](PROJECT_STATUS.md) and [Open-source readiness](OPEN_SOURCE_READINESS.md).
