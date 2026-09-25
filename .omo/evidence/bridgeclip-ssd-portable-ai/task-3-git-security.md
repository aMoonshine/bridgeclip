# Task 3 Git/Upstream/Security Evidence

- Status: `DONE`
- Recorded: `2026-09-25T16:14:46+03:00`
- Repair completed: `2026-09-25T16:20:15+03:00`
- Target: `Y:\ProjectsAI\bridgeclip`
- Source rollback: `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip`
- Repair result: Official Gitleaks `v8.30.1` was downloaded to approved temp storage, verified, and the redacted all-ref history scan passed with zero findings; all temporary tool artifacts were removed.
- Scope: Target Git fetch metadata/refs and this evidence file only, plus a temporary Gitleaks tool under the approved OS temp directory that was removed after scanning. No product source, documentation, runtime, model, credential, or D: source file was edited.

## Required inputs inspected first

The following target inputs were read before execution:

- `D:\!!!\Documents\ChatGPT\.omo\plans\bridgeclip-ssd-portable-ai.md` Todo 3. The requested plan path under the target did not exist; the authoritative plan was read from the unchanged D: work area.
- `.git/config`
- `.git/shallow`
- `package.json`
- `.github/workflows/ci.yml`
- `scripts/export-public-draft.sh`
- `.gitignore`

The target `.git/config` contains only the expected HTTPS remotes, with no URL userinfo, query token, or credential:

```text
origin  https://github.com/aMoonshine/bridgeclip.git
upstream https://github.com/bridge-mind/bridgeclip.git
```

The CI convention uses full-history checkout plus:

```text
gitleaks git --no-banner --redact=100 --log-opts=--all
gitleaks dir --no-banner --redact=100 .
```

The target began with one shallow boundary:

```text
.git/shallow: 87975f06edc271b2c41958e3ced09a31903cf5d4
```

## Command environment and safety

All Git invocations were run with:

```powershell
$env:GIT_OPTIONAL_LOCKS='0'
$env:GIT_MASTER='1'
```

Fetch invocations additionally used:

```powershell
$env:GIT_TERMINAL_PROMPT='0'
$env:GCM_INTERACTIVE='never'
$env:GIT_HTTP_LOW_SPEED_LIMIT='1'
$env:GIT_HTTP_LOW_SPEED_TIME='30'
git -c http.lowSpeedLimit=1 -c http.lowSpeedTime=30 ...
```

Each fetch had a 600-second execution bound. No checkout, merge, rebase, reset, clean, push, force-push, branch/tag deletion, repository creation, or history rewrite was run. Remote URLs were read from the credential-free target config; no token was printed or stored.

## Target baseline

Exact read-only commands:

```powershell
git rev-parse --show-toplevel
git symbolic-ref --quiet --short HEAD
git rev-parse HEAD
git rev-parse --is-shallow-repository
git status --short --branch --untracked-files=all
git diff --no-ext-diff --quiet
git diff --cached --no-ext-diff --quiet
git write-tree
git rev-parse 'HEAD^{tree}'
git hash-object '.git/config'
git hash-object '.git/index'
git remote -v
git for-each-ref --sort=refname --format='%(refname) %(objectname)' refs/remotes
git for-each-ref --sort=refname --format='%(refname) %(objectname)' refs/heads refs/tags
```

Result:

```text
Top-level: Y:/ProjectsAI/bridgeclip
Branch: main
HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
Shallow: true
.git/shallow exists: true
Tracked worktree diff exit: 0
Index diff exit: 0
Index tree: 7d51a2d7962c60d2ce7d2c6bfd67d0a0d384ba79
HEAD tree: 7d51a2d7962c60d2ce7d2c6bfd67d0a0d384ba79
Config blob: 4a476ae374e3046f2d88f9fef24d11c12c93007a
Index blob: bb104a24edf3782340ade7e445236ec007371a7c
Status: only pre-existing untracked .omo/evidence/bridgeclip-ssd-portable-ai/task-2-runtime.md
```

Remote-tracking refs before fetch:

```text
refs/remotes/origin/HEAD 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
refs/remotes/origin/main 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
refs/remotes/upstream/main 5edebbd8a457d3c9d3ec8883f97bf8638438f9bc
```

Local heads/tags before fetch:

```text
refs/heads/codex/upstream-sync 729273cdbe37c484fa655edc670ba44733d307ab
refs/heads/main 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
```

No local tag was present.

## Non-destructive fetch results

### Complete target history

Exact command:

```powershell
git -c http.lowSpeedLimit=1 -c http.lowSpeedTime=30 fetch --unshallow origin
```

Result: exit `0`; no stdout/stderr.

Immediate verification:

```text
git rev-parse --is-shallow-repository -> false (exit 0)
.git/shallow exists -> false
HEAD -> 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
Index blob -> bb104a24edf3782340ade7e445236ec007371a7c
Worktree diff exit -> 0
Index diff exit -> 0
```

### Prune origin

Exact command:

```powershell
git -c http.lowSpeedLimit=1 -c http.lowSpeedTime=30 fetch --prune origin
```

Result: exit `0`; no stdout/stderr.

### Prune upstream

Exact command:

```powershell
git -c http.lowSpeedLimit=1 -c http.lowSpeedTime=30 fetch --prune upstream
```

Result: exit `0`. Sanitized output:

```text
From https://github.com/bridge-mind/bridgeclip
 * [new branch]      build/private-cross-platform-release -> upstream/build/private-cross-platform-release
 * [new branch]      feat/complete-local-improvements -> upstream/feat/complete-local-improvements
 * [new branch]      feat/tiktok-automation-review -> upstream/feat/tiktok-automation-review
 * [new branch]      feat/video-speed -> upstream/feat/video-speed
   5edebbd..4914ab1  main -> upstream/main
 * [new branch]      review/automation-retry-20260924 -> upstream/review/automation-retry-20260924
 * [new branch]      review/automation-slot-fix -> upstream/review/automation-slot-fix
 * [new branch]      review/windows-followup-20260924 -> upstream/review/windows-followup-20260924
```

No ref was reported pruned. These were permitted target remote-tracking metadata changes; no local head, tag, checkout, or merge changed.

Post-fetch remote-tracking refs:

```text
refs/remotes/origin/HEAD 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
refs/remotes/origin/main 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
refs/remotes/upstream/HEAD 4914ab1acb1c4ee877ef7f380cec215106355506
refs/remotes/upstream/build/private-cross-platform-release 71289563df6e8181e4fd2442113a03c9f7a8a47e
refs/remotes/upstream/feat/complete-local-improvements a2fe32d0aac39fea63ccccf33430cf6e8fd4781a
refs/remotes/upstream/feat/tiktok-automation-review 36100f7dbdb8a8ce157d74e5fdbd25d324b102bc
refs/remotes/upstream/feat/video-speed e5b8e22dea4667ac6aa6ebbed6b4bbabf963e757
refs/remotes/upstream/main 4914ab1acb1c4ee877ef7f380cec215106355506
refs/remotes/upstream/review/automation-retry-20260924 ee8d130141dd9d49635e7fdf7eaca597f97561a8
refs/remotes/upstream/review/automation-slot-fix 445360bd5a080047e1052765aaadbd0ce20cbc94
refs/remotes/upstream/review/windows-followup-20260924 4d244c39937cd8aefbbeb23a4b08470cf18945de
```

Post-fetch local heads/tags were byte-for-byte the same object IDs as the baseline:

```text
refs/heads/codex/upstream-sync 729273cdbe37c484fa655edc670ba44733d307ab
refs/heads/main 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
```

### Stale-ref verification

Exact commands:

```powershell
git -c http.lowSpeedLimit=1 -c http.lowSpeedTime=30 remote prune --dry-run origin
git -c http.lowSpeedLimit=1 -c http.lowSpeedTime=30 remote prune --dry-run upstream
```

Both exited `0` with no output, so neither remote had stale tracking refs after fetch.

Branch comparison:

```text
git rev-list --left-right --count main...origin/main -> 0  0
git rev-list --left-right --count main...upstream/main -> 3  9
git merge-base main upstream/main -> 5edebbd8a457d3c9d3ec8883f97bf8638438f9bc
```

The local `main` branch matches origin and is three commits ahead/nine commits behind current upstream. No upstream commit was merged.

## Remote HEAD and branch protection inventory

Exact remote HEAD commands:

```powershell
git ls-remote --symref origin HEAD
git ls-remote --symref upstream HEAD
```

Both exited `0`:

```text
origin: refs/heads/main -> 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
upstream: refs/heads/main -> 4914ab1acb1c4ee877ef7f380cec215106355506
```

Read-only GitHub branch metadata commands:

```powershell
gh api repos/aMoonshine/bridgeclip/branches/main --jq '.protected'
gh api repos/bridge-mind/bridgeclip/branches/main --jq '.protected'
```

Both exited `0`:

```text
aMoonshine/bridgeclip main protected: false
bridge-mind/bridgeclip main protected: true
```

An initial branch-protection query used a more complex `jq` expression and exited `1` due only to quoting; it made no write. The simplified projections above succeeded. Authentication output was not copied into evidence.

## Git integrity

Exact command:

```powershell
git fsck --full
```

Result: exit `0`.

Output:

```text
dangling tree a0281ba69faf7ab0707150a18d4329ca8696afb8
```

There was no fsck error. The unreachable dangling tree is a non-fatal inventory item and was not pruned or remediated.

## Gitleaks repair and result

### Official release provenance

The official project selected by GitHub was `gitleaks/gitleaks`. The latest non-draft, non-prerelease release at repair time was:

```text
Release: v8.30.1
Published: 2026-03-21T02:17:58Z
Release URL: https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1
Tag target commit: 83d9cd684c87d95d656c1458ef04895a7f1cbd8e
Tag commit verification: unsigned; verified=false
Published signature assets: 0
```

The official release exposes SHA-256 digest metadata for each asset but no detached `.sig`, `.asc`, `.intoto`, `.minisig`, or certificate asset. Because no publisher signature was available, verification used both the official checksum manifest and GitHub's official release-asset digest metadata.

Selected official assets:

```text
Asset ID: 378333178
Asset: gitleaks_8.30.1_windows_x64.zip
State: uploaded
Size: 8438883 bytes
Published SHA-256: d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e
URL: https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_windows_x64.zip

Asset ID: 378333193
Asset: gitleaks_8.30.1_checksums.txt
State: uploaded
Size: 999 bytes
Published SHA-256: 061476c21adaf5441516f96f185c1a4706a83cd6329b9b38762271b3d4a52fae
URL: https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_checksums.txt
```

Download command, executed with a 600-second bound:

```powershell
gh release download v8.30.1 --repo gitleaks/gitleaks --pattern 'gitleaks_8.30.1_windows_x64.zip' --pattern 'gitleaks_8.30.1_checksums.txt' --dir C:\Users\sanma\AppData\Local\Temp\opencode\bridgeclip-tools\gitleaks
```

Result: exit `0`; exactly the archive and checksum manifest were downloaded.

### Checksum and binary verification

Downloaded archive:

```text
Size: 8438883 bytes
Computed SHA-256: d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e
GitHub published digest match: true
Official checksum-manifest match: true
```

Downloaded checksum manifest:

```text
Size: 999 bytes
Computed SHA-256: 061476c21adaf5441516f96f185c1a4706a83cd6329b9b38762271b3d4a52fae
GitHub published digest match: true
Relevant manifest line:
d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e  gitleaks_8.30.1_windows_x64.zip
```

The verified ZIP was allowed to contain only the top-level release files `LICENSE`, `README.md`, and `gitleaks.exe`; rooted paths and `..` traversal were rejected before extraction. Extracted executable identity:

```text
Path: C:\Users\sanma\AppData\Local\Temp\opencode\bridgeclip-tools\gitleaks\gitleaks.exe
Size: 22575104 bytes
SHA-256: 17157e2ee8b76fc8b1d8bee607a250e34b8a8023c8bc81822d4b5ee4d78fcb7c
Authenticode status: NotSigned
gitleaks version: 8.30.1
gitleaks version exit: 0
```

The executable was not run until the containing archive matched both independent official checksum sources. The lack of a publisher signature is a provenance limitation, not a checksum failure.

### Redacted all-ref history scan

The target was already non-shallow and had no `.git/shallow` file. The scan used Gitleaks' built-in rules (`.gitleaks.toml` was absent), repository CI-compatible all-ref Git history mode, 100% redaction, and a bounded internal timeout. Exact command, run from `Y:\ProjectsAI\bridgeclip`:

```powershell
C:\Users\sanma\AppData\Local\Temp\opencode\bridgeclip-tools\gitleaks\gitleaks.exe git --no-banner --no-color --redact=100 --log-opts=--all --report-format json --report-path C:\Users\sanma\AppData\Local\Temp\opencode\bridgeclip-tools\gitleaks\gitleaks-report.json --timeout 540
```

Sanitized result:

```text
GITLEAKS_SCAN_EXIT=0
Gitleaks: 51 commits scanned
Bytes scanned: approximately 5575173 (5.58 MB)
Duration: 364ms
Gitleaks: no leaks found
Report: exact JSON [] (3 bytes)
Finding count: 0
Redaction: 100 percent
Scan mode: Git history, all reachable refs via --log-opts=--all
```

Git independently accounted for the full reachable graph:

```text
git rev-list --all --count -> 54
git rev-list --all --no-merges --count -> 51
git rev-list --all --merges --count -> 3
git rev-list --all --max-parents=0 --count -> 1
```

Gitleaks' 51-commit count exactly matches all 51 reachable non-merge commits; the remaining three reachable commits are merges. The target is full-history (`git rev-parse --is-shallow-repository=false`) and `git fsck --full` previously passed. No finding metadata existed to report because the verified report was the empty JSON array.

## Target preservation after fetch

Post-fetch checks showed:

```text
Top-level: Y:/ProjectsAI/bridgeclip
Branch: main
HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
Shallow: false
.git/shallow exists: false
Config blob: 4a476ae374e3046f2d88f9fef24d11c12c93007a
Index blob: bb104a24edf3782340ade7e445236ec007371a7c
Index tree: 7d51a2d7962c60d2ce7d2c6bfd67d0a0d384ba79
HEAD tree: 7d51a2d7962c60d2ce7d2c6bfd67d0a0d384ba79
Worktree diff exit: 0
Index diff exit: 0
```

The config hash, index hash, index tree, HEAD tree, branch, and HEAD were unchanged from baseline. Fetch introduced no product or worktree diff.

After this evidence file was written, the exact target status was:

```text
## main...origin/main
?? .omo/evidence/bridgeclip-ssd-portable-ai/task-2-runtime.md
?? .omo/evidence/bridgeclip-ssd-portable-ai/task-3-git-security.md
```

Both untracked files are evidence artifacts. The task-2 file pre-existed this task and was not modified. Tracked product status is clean.

## D: source preservation

Read-only before/after checks used:

```powershell
git rev-parse HEAD
git status --short --branch --untracked-files=all
git diff --no-ext-diff --quiet
git diff --cached --no-ext-diff --quiet
git rev-parse --is-shallow-repository
git hash-object '.git/config'
git hash-object '.git/index'
git remote -v
git for-each-ref --sort=refname --format='%(refname) %(objectname)' refs/remotes
```

The D: source was identical before and after target fetch work:

```text
Top-level: D:/!!!/Documents/ChatGPT/LinkedIn/bridgeclip
Branch: main
HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
Shallow: true
Status: clean
Worktree diff exit: 0
Index diff exit: 0
Index tree: 7d51a2d7962c60d2ce7d2c6bfd67d0a0d384ba79
HEAD tree: 7d51a2d7962c60d2ce7d2c6bfd67d0a0d384ba79
Config blob: 4a476ae374e3046f2d88f9fef24d11c12c93007a
Index blob: bb104a24edf3782340ade7e445236ec007371a7c
origin: https://github.com/aMoonshine/bridgeclip.git
upstream: https://github.com/bridge-mind/bridgeclip.git
refs/remotes/origin/HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
refs/remotes/origin/main: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
refs/remotes/upstream/main: 5edebbd8a457d3c9d3ec8883f97bf8638438f9bc
```

No fetch or write command was run in the D: source.

## Cleanup receipt

- Removed `C:\Users\sanma\AppData\Local\Temp\opencode\bridgeclip-tools\gitleaks` after recording the verified scan result.
- Removed the downloaded ZIP, checksum manifest, extracted `gitleaks.exe`, extracted `LICENSE`, extracted `README.md`, and temporary JSON report.
- Removed the now-empty `C:\Users\sanma\AppData\Local\Temp\opencode\bridgeclip-tools` parent.
- Post-cleanup `Test-Path` for the Gitleaks directory: `False`; post-cleanup tool-parent entry count: `0`; two independent glob checks found no files.
- No package manager install, PATH change, BridgeClip dependency, global Gitleaks installation, or repository-local executable was created.
- Expected target Git metadata changes from the original Todo 3 fetch remain: `.git/shallow` absent, complete object database, refreshed `FETCH_HEAD`, and allowed remote-tracking refs.
- No Git lock or `tmp_pack_*` artifact, temporary checkout, branch, tag, credential, model, runtime, or product file remains.
- No product source or documentation was modified; this evidence file is the only new target worktree artifact from Todo 3.
- No D: source cleanup or mutation occurred.
- No process was launched in the background; download, verification, scan, and cleanup completed synchronously.

## Adversarial probes

- `stale_state`: immediately before tool repair, target remained non-shallow with 54 reachable commits, origin HEAD `6407bf3b...`, upstream HEAD `4914ab1ac...`, and the same remote/local refs recorded above; no additional fetch was needed or run.
- `dirty_worktree`: pre-install and post-cleanup target/source tracked diffs remained clean; target untracked content is limited to the pre-existing task-2 evidence and this allowed task-3 evidence.
- `misleading_success_output`: binary provenance was proved by official release identity, two matching SHA-256 sources, exact ZIP layout, extracted executable hash, and `gitleaks version` output. Scan success was proved by exit `0`, Gitleaks' own 51-commit/byte summary, exact three-byte JSON `[]`, and a strict zero-finding count. Gitleaks' 51 commits were reconciled to Git's 54 reachable commits as 51 non-merges plus three merges.
- `cancel_resume`: download had a 600-second bound; the scan had both Gitleaks' 540-second timeout and a 600-second tool bound. No interrupted or partial executable remains.
- `long_command`: the bounded scan completed in 364ms after provenance verification; no unbounded operation was used.
- `repeated_interruptions`: no download or scan was retried or resumed. The earlier harmless branch-protection jq retry was read-only. No Gitleaks lock, report, archive, executable, or tool directory remains.
- `malformed_input`: not applicable; target, temp, release, asset, and scan paths/commands were well-formed.
- `prompt_injection`: not applicable; no repository text, model, provider, or untrusted prompt was executed as instructions. Only the verified official release binary was executed.

## Limitations

- Gitleaks `v8.30.1` and its release tag were unsigned, no detached publisher-signature asset was published, and the Windows executable reported Authenticode `NotSigned`. Integrity was nevertheless verified against both the official checksum manifest and GitHub's published asset SHA-256 digest before execution.
- The scan used Gitleaks' built-in rules because the repository has no `.gitleaks.toml`. The separate CI working-directory scan was outside this Todo 3 full-history requirement and was not run.
- Gitleaks reported 51 scanned commits; Git has 54 reachable commits. The exact reconciliation is 51 non-merge commits plus three merge commits, which Gitleaks does not count as separate scan commits.
- Branch protection is a point-in-time GitHub API observation; only the protected boolean was recorded, not a policy/rules export.
- Upstream has diverged from local `main`; this inventory did not review or merge those changes.
- `git fsck` passed but reported one dangling tree; it was intentionally retained.
- The D: rollback checkout remains shallow and retains its old upstream ref, as required by the no-source-mutation rule.
