# Task 5 Pre-Change Baseline Evidence

- Result: `DONE_WITH_BASELINE_FAILURES`
- Recorded: 2026-09-25
- Canonical checkout: `Y:\ProjectsAI\bridgeclip`
- Rollback source: `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip`
- Branch/HEAD: `main` at `6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5`
- Scope: pre-change verification only. No product source, tests, scripts, package/config, model, credential, Git ref, or D: file was changed.
- Provider/network policy: no live OpenRouter, OpenAI, GitHub Models, or other paid/authenticated call. Zernio and bridge tests used local mocks/fixtures.

## Environment

```text
Node: v22.23.3 (project-local engine-bin/node/node-v22.23.3-win-x64)
npm: 10.9.9
Python: 3.12.14 (project-local engine/.venv/Scripts/python.exe)
Platform: win32
```

The canonical launcher/runtime and dependency checks were already recorded by Todo 2. This task ran the baseline from `Y:\ProjectsAI\bridgeclip` with the project-local Node and Python paths.

## Command matrix

| Command | Exit | Result |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Node and web TypeScript checks passed |
| `npm run lint` | 0 | ESLint passed |
| `npm test` | 1 | Stopped in `test:main`; see failures below |
| `npm run test:main` | 1 | 38 tests: 28 passed, 9 failed, 1 skipped |
| `npm run test:renderer` | 0 | 22 passed, 0 failed, 0 skipped |
| `npm run test:zernio` | 1 | 115 tests: 110 passed, 5 failed, 0 skipped |
| `npm run test:bridge` | 0 | 24 passed, 0 failed |
| `npm run test:release` | 1 | 12 tests: 9 passed, 2 failed, 1 skipped |
| `python -m pytest -q engine/tests` | 1 | `No module named pytest` |
| `npm run build` | 0 | Electron main/preload/renderer production build passed |

`npm test` was not allowed to hide later suites after `test:main` failed, so renderer, Zernio, bridge, and release suites were run independently to obtain the complete baseline.

## Failure classification

All failures are classified as pre-existing/platform-harness issues; none were introduced by product changes in this task.

### Main-process suite: 9 failures

1. `development checks the staged FFmpeg that the clipping engine uses` expects the POSIX path `engine-bin/ffmpeg`, while the Windows resolver correctly builds `ffmpeg.exe`; the test fixture is not Windows-aware.
2. Five security tests fail while creating symlinks with `EPERM`: media authorization, authorized-handle replacement, thumbnail cache, native picker alias, and library output symlink. The same suite explicitly skips one symlink test because Windows Developer Mode/elevated rights are required.
3. Three private-mode assertions read Windows mode bits as `54` (`0o066`) instead of POSIX `0o600`; Windows does not provide the POSIX permission-bit semantics asserted by the tests.

No assertion failure showed a new product regression; the target runtime and source tree were unchanged.

### Zernio suite: 5 failures

The five failures are private-mode assertions returning Windows mode `54`/`666` rather than POSIX `600`:

- post-history quarantine privacy;
- post-history atomic file mode;
- uncertain-post journal privacy;
- account-cache privacy;
- legacy-account-cache quarantine privacy.

The remaining 110 Zernio tests passed, including local mock request, upload, retry, scheduling, cancellation, and security-boundary scenarios.

### Release suite: 2 failures and 1 skip

1. `merge-update-metadata.test.cjs` cannot create a symlink (`EPERM`) in the Windows temp directory.
2. The initial restricted-PATH run could not find `git` (`spawnSync git ENOENT`). A controlled rerun with the existing Git path included reached the test but failed during Windows temp cleanup with `EBUSY`; this is a platform cleanup/handle-locking issue, not a release implementation failure.
3. Resource staging preservation test is explicitly skipped by its existing test condition.

The release configuration/lockfile tests otherwise passed.

### Python test runner

`engine/requirements.lock` and `engine/requirements.txt` contain no `pytest` entry, and the target venv reports `No module named pytest`. No package was installed during the baseline; installing a new test dependency would be a separate authorized environment change.

## Passing checks

- TypeScript node/web typecheck: passed.
- ESLint: passed.
- Renderer state/create-form tests: 22/22 passed.
- Bridge regression tests: 24/24 passed.
- Production Electron build: passed; output remains ignored build output.
- No paid provider/model request, credential read, or model download occurred.

## Baseline decision

Todo 5 is complete as a **recorded baseline**, not as a green test gate. Feature work must preserve these failures as known baseline items and must not delete or weaken tests. The Windows symlink/permission and extension-assumption failures should be handled in a separately scoped test-portability task, while provider/GPU behavior work remains blocked on its own acceptance criteria.

## Reproduction commands

```powershell
$env:Path="Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64;$env:SystemRoot\System32;$env:SystemRoot"
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd" run typecheck
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd" run lint
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd" test
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd" run test:bridge
& "Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\python.exe" -m pytest -q engine/tests
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd" run build
```

## Evidence integrity

- No source commit, push, branch, tag, merge, fetch, or history rewrite was performed.
- The D: rollback checkout was not used for test execution or mutation.
- Full detailed Todo 2/3 evidence remains in `.omo/evidence/bridgeclip-ssd-portable-ai/task-2-runtime.md` and `task-3-git-security.md`.
