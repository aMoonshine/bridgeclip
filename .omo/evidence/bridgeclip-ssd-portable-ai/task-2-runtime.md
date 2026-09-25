# Task 2 Runtime Evidence

- Status: `DONE`
- Recorded: 2026-09-25T15:49:32+03:00
- Target: `Y:\ProjectsAI\bridgeclip`
- Source rollback: `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip`
- Scope: SSD-local runtime/dependency recreation and launcher preflight only. No product source, Git refs/remotes, credentials, model weights, or D: source files were modified.

## Prior blocker (resolved on repair pass)

The initial unmodified target launcher failed its non-destructive dependency gate because the copied Node dependency tree did not contain the required Electron executable:

```text
Missing local dependency: Y:\ProjectsAI\bridgeclip\node_modules\electron\dist\electron.exe
```

`start-windows.ps1` exited with code `1` before reaching `npm run dev`; therefore no clipping job, provider request, model download, or paid/authenticated call was started. Per the task failure rule, no repair attempt was made during that initial pass; the successful repair is recorded below.

## Target and interpreter preflight

The target Git metadata and copied runtime directories were present before execution:

```text
Y:\ProjectsAI\bridgeclip\.git
Y:\ProjectsAI\bridgeclip\engine-bin
Y:\ProjectsAI\bridgeclip\engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe
Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\node.exe
Y:\ProjectsAI\bridgeclip\engine-bin\ffmpeg.exe
Y:\ProjectsAI\bridgeclip\engine-bin\ffprobe.exe
Y:\ProjectsAI\bridgeclip\engine-bin\nemo-speech\bin\nemo-speech.exe
Y:\ProjectsAI\bridgeclip\engine-bin\models\nemotron-3.5-asr-streaming-0.6b.q8_0.gguf
Y:\ProjectsAI\bridgeclip\node_modules
```

Exact interpreter:

```text
Path: Y:\ProjectsAI\bridgeclip\engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe
Version: Python 3.12.14
SHA-256: 1A967738A234A3BD90E8FA8B925E20A994326E1EB8B74913026A9449A933E6DB
```

## Venv recreation

The copied target venv was stale before execution. Its old `pyvenv.cfg` home and activation scripts referenced the D: source. Only the target venv was removed; the source venv was not touched.

Required command, executed exactly:

```powershell
Y:\ProjectsAI\bridgeclip\engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe -m venv Y:\ProjectsAI\bridgeclip\engine\.venv
```

Result: exit code `0`.

The new venv was verified as:

```text
Venv: Y:\ProjectsAI\bridgeclip\engine\.venv
Python: Python 3.12.14
home = Y:\ProjectsAI\bridgeclip\engine-bin\python\cpython-3.12.14-windows-x86_64-none
executable = Y:\ProjectsAI\bridgeclip\engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe
command = Y:\ProjectsAI\bridgeclip\engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe -m venv Y:\ProjectsAI\bridgeclip\engine\.venv
```

The new `activate` and `activate.bat` files also resolved `Y:\ProjectsAI\bridgeclip\engine\.venv`, with no D: source path.

## Dependency installation

### Python lock

The existing `bridge/requirements.txt` contains only an instruction to use the shared `engine/requirements.lock`; no separate bridge dependency install is required by the repository setup.

Command:

```powershell
Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\python.exe -m pip install --require-hashes -r Y:\ProjectsAI\bridgeclip\engine\requirements.lock
```

Result: exit code `0`.

Sanitized result:

```text
Successfully installed aiofiles-25.1.0 ... yt-dlp-2026.8.19 yt-dlp-ejs-0.8.0
PIP_EXIT_CODE=0
```

### Node dependencies

The project-local toolchain was used; no global Node or npm executable was selected.

```text
Node: Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\node.exe
Node version: v22.23.3
npm: Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd
npm version: 10.9.9
```

Command:

```powershell
$env:Path="Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64;$env:SystemRoot\System32;$env:SystemRoot"
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd" ci
```

Result: exit code `0`.

Sanitized result:

```text
added 546 packages, and audited 547 packages in 25s
found 0 vulnerabilities
NPM_CI_EXIT_CODE=0
```

The postinstall `electron-builder install-app-deps` step completed, but the Electron package executable required by the launcher was absent afterward.

## Resolved version checks

All commands below were run through the recorded absolute target paths before failure cleanup.

| Tool | Resolved path | Version/output | Exit |
|---|---|---|---:|
| Python | `Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\python.exe` | `Python 3.12.14` | 0 |
| Node | `Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\node.exe` | `v22.23.3` | 0 |
| FFmpeg | `Y:\ProjectsAI\bridgeclip\engine-bin\ffmpeg.exe` | `ffmpeg version 6.1.1-full_build-www.gyan.dev` | 0 |
| ffprobe | `Y:\ProjectsAI\bridgeclip\engine-bin\ffprobe.exe` | `ffprobe version N-113658-gacacf8a313-20240216` | 0 |
| yt-dlp | `Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\yt-dlp.exe` | `2026.08.19` | 0 |
| NeMo-Speech | `Y:\ProjectsAI\bridgeclip\engine-bin\nemo-speech\bin\nemo-speech.exe` | `nemo-speech 0.1.0` | 0 |

## Initial launcher preflight (failed)

The real target launcher was executed in a child PowerShell process with isolated temporary user data and `BRIDGECLIP_E2E=1`:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "Y:\ProjectsAI\bridgeclip\start-windows.ps1"
```

Bounded observation: 20 seconds. Result:

```text
LAUNCHER_EXIT_CODE=1
LAUNCHER_RESULT=FAIL
Missing local dependency: Y:\ProjectsAI\bridgeclip\node_modules\electron\dist\electron.exe
```

The launcher preflight therefore did not resolve every required local binary. It stopped before `npm run dev`; no application job was submitted.

## Initial stale-path scan

The exact stale path searched was:

```text
D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip
```

Search scope and result before cleanup:

```text
Target venv text/config: Y:\ProjectsAI\bridgeclip\engine\.venv
Include: *.cfg, *.ini, *.txt, *.log, *.json, *.ps1, *.cmd, *.bat, *.py, *.js, *.cjs, *.ts, *.tsx
Result: no matches

Target text/config/log metadata: Y:\ProjectsAI\bridgeclip
Include: *.cfg, *.ini, *.txt, *.log, *.json, *.ps1, *.cmd, *.bat, *.py, *.js, *.cjs, *.ts, *.tsx
Result: no matches
```

The evidence file itself is excluded from the stale-path scan because it intentionally records the old path for auditability. The D: source venv remains stale by design as rollback state; it was not changed.

## Initial Git and source-preservation checks

Source and target both reported:

```text
Branch: main
HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
Tracked status: clean
git diff exit: 0
git diff --cached exit: 0
origin: https://github.com/aMoonshine/bridgeclip.git
upstream: https://github.com/bridge-mind/bridgeclip.git
```

The target Git directory is `.git`; `engine-bin`, `node_modules`, and the venv path are ignored by the repository. The copied `node_modules` tree is present but lacks `electron/dist/electron.exe`, which is the recorded blocker.

## Initial failure cleanup receipt

```text
Removed: Y:\ProjectsAI\bridgeclip\engine\.venv
Scope: only the newly created target venv
Source venv: not removed or modified
Source venv pyvenv.cfg SHA-256 after cleanup:
A48D4A65BC934CDF7719EA2A30B0EDC43FEA0311E5935E078902CAF825392505
Expected pre-cleanup source hash: same
Isolated empty preflight temp directory: removed
```

## Repair pass (2026-09-25)

### Exact diagnosis

- `package.json` declares `electron: ^44.4.5`; `package-lock.json` and `npm ls electron --depth=0 --json` resolve `44.4.5` with exit `0`.
- `node_modules/electron/package.json` contains `bin.install-electron -> install.js` but no lifecycle `scripts` field. The copied package had no `dist/electron.exe`, `dist/version`, or `path.txt`.
- Local npm configuration was not suppressing scripts: `npm config get ignore-scripts` returned `false`; cache was `C:\Users\sanma\AppData\Local\npm-cache`; `proxy` and `https-proxy` returned `null`.
- `ELECTRON_SKIP_BINARY_DOWNLOAD`, `ELECTRON_MIRROR`, `ELECTRON_CUSTOM_DIR`, `ELECTRON_OVERRIDE_DIST_PATH`, `npm_config_ignore_scripts`, `NPM_CONFIG_IGNORE_SCRIPTS`, `HTTP_PROXY`, and `HTTPS_PROXY` were unset for the repair child process.
- Therefore the failure was not an environment skip or global npm selection. The package metadata exposes the installer as a binary but does not register it as an npm lifecycle script, so the earlier `npm ci` completed while leaving `dist` unpopulated.

### Safe Electron repair

The project-local foreground rebuild was tested first:

```powershell
$env:Path="Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64;$env:SystemRoot\System32;$env:SystemRoot"
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd" rebuild electron --foreground-scripts
```

With skip variables removed, result was `rebuilt dependencies successfully`, exit `0`, but `electron.exe` remained absent. The package's own installer was then run with the local Node executable and explicit target platform:

```powershell
$env:ELECTRON_INSTALL_PLATFORM="win32"
$env:ELECTRON_INSTALL_ARCH="x64"
& "Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\node.exe" "Y:\ProjectsAI\bridgeclip\node_modules\electron\install.js"
```

Result: `ELECTRON_INSTALL_EXIT_CODE=0`; only the Electron tool dependency was downloaded. No Nemotron model was downloaded or replaced.

Final Electron proof:

```text
Package version: 44.4.5
dist/version: 44.4.5
path.txt: electron.exe
Executable: Y:\ProjectsAI\bridgeclip\node_modules\electron\dist\electron.exe
Executable size: 246032896 bytes
Executable SHA-256: BD14928E0728366FD3F41499CB398FF3F4304DAB259A3E605077899A6F8C748E
electron.exe --version: v44.4.5 (status 0)
require('electron'): Y:\ProjectsAI\bridgeclip\node_modules\electron\dist\electron.exe
```

### Venv recreation and lock install

The target venv was recreated with the required exact command:

```powershell
Y:\ProjectsAI\bridgeclip\engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe -m venv Y:\ProjectsAI\bridgeclip\engine\.venv
```

Result: exit `0`; `pyvenv.cfg`, `Scripts/activate`, and `Scripts/activate.bat` all resolve the Y: target path. The hashed install completed:

```powershell
Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\python.exe -m pip install --require-hashes -r Y:\ProjectsAI\bridgeclip\engine\requirements.lock
```

Result: `PIP_EXIT_CODE=0`; the shared lock installed the engine and bridge dependencies. `bridge/requirements.txt` contains no separate dependency set.

### Final resolved version matrix

All commands used absolute target paths and exited `0`:

| Tool | Version |
|---|---|
| `Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\python.exe` | `Python 3.12.14` |
| `Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\node.exe` | `v22.23.3` |
| `Y:\ProjectsAI\bridgeclip\engine-bin\ffmpeg.exe` | `6.1.1-full_build-www.gyan.dev` |
| `Y:\ProjectsAI\bridgeclip\engine-bin\ffprobe.exe` | `N-113658-gacacf8a313-20240216` |
| `Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\yt-dlp.exe` | `2026.08.19` |
| `Y:\ProjectsAI\bridgeclip\engine-bin\nemo-speech\bin\nemo-speech.exe` | `nemo-speech 0.1.0` |
| `Y:\ProjectsAI\bridgeclip\node_modules\electron\dist\electron.exe` | `v44.4.5` |

### Launcher verification

The unmodified launcher was run with isolated temporary user data and `BRIDGECLIP_E2E=1`:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "Y:\ProjectsAI\bridgeclip\start-windows.ps1"
```

The bounded 30-second run passed the launcher gate and remained running until the expected test teardown:

```text
LAUNCHER_WAS_RUNNING_AFTER_30S=True
LAUNCHER_RESULT=PASS_BOUNDED_STARTUP
system.checkTools: python=true, pythonDeps=true, ffmpeg=true, ffmpegCaptions=true, ffprobe=true, ytdlp=true, engine=true, bridgeRunner=true
```

The parent exit code was `1` only because the bounded harness terminated the still-running process tree with `taskkill /T /F`; stderr was empty. No clipping job, provider request, model download, or paid/authenticated call occurred. No target-related process remained afterward.

### Final stale-path and Git checks

The exact stale path `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip` was searched in the target venv and target text/config/log metadata with the same include set as the prior pass; both searches returned no matches. The evidence Markdown is excluded from that scan because it records the old path for auditability.

Final Git results, using read-only commands:

```text
Source HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
Target HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
Source/target branch: main
Source status: clean
Target tracked status: clean
Source diff / cached diff exit: 0 / 0
Target diff / cached diff exit: 0 / 0
origin: https://github.com/aMoonshine/bridgeclip.git
upstream: https://github.com/bridge-mind/bridgeclip.git
Source venv pyvenv.cfg SHA-256: A48D4A65BC934CDF7719EA2A30B0EDC43FEA0311E5935E078902CAF825392505
```

The target status shows only `?? .omo/`, the explicitly allowed evidence artifact; runtime/dependency paths remain ignored. The D: source venv and source tree were not modified.

### Additional local quality checks

```text
Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd run lint
LINT_EXIT_CODE=0

Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64\npm.cmd run typecheck
TYPECHECK_EXIT_CODE=0
```

### Cleanup receipt

- The successful target venv remains in place at `Y:\ProjectsAI\bridgeclip\engine\.venv`; no failure cleanup was needed.
- The isolated launcher user-data/log directory was removed after its sanitized system-check result was recorded.
- No source files, source venv, Git refs/remotes, credentials, or model weights were changed.
- The pre-existing ignored `out/` build directory was not deleted; the launcher refreshed generated dev output only.

## Adversarial probes

- `stale_state`: detected and replaced the copied D:-bound venv, then confirmed Y:-only activation/config paths and no stale target matches.
- `dirty_worktree`: source and target tracked worktrees were clean with matching HEADs/remotes; only the allowed `.omo/` evidence artifact is untracked.
- `misleading_success_output`: verified package metadata, actual executable presence, `dist/version`, `path.txt`, `require('electron')`, and `electron.exe --version` rather than trusting `npm ls` alone.
- `cancel_resume`: venv recreation and Electron extraction completed without interruption; no partial venv was left.
- `long_command`: all network/install and launcher operations used bounded timeouts; the launcher harness was bounded to 30 seconds.
- `repeated_interruptions`: no repeated interruption or stale process remained; cleanup was verified with `Test-Path` and process inspection.
- `malformed_input`: not applicable; supplied paths and commands were well-formed.
- `prompt_injection`: not applicable; no untrusted prompt or external content was executed, and no provider/model call was made.

## Limitations

- A fresh `npm ci` in this package state can again omit the Electron `dist` payload because the installed Electron package has no lifecycle script; the explicit target-scoped `install.js` repair is therefore required unless a later authorized task changes package metadata.
- No product source, documentation, model, provider integration, GPU transcription, or paid service was tested in this todo. The successful launcher run was isolated and non-destructive.
- The evidence file is intentionally untracked under `.omo/`; it is the only target worktree artifact outside ignored runtime/dependency paths.

## Cache repair pass (2026-09-25)

### Verifier finding confirmed

The exhaustive byte-level pre-scan used the target venv with `PYTHONDONTWRITEBYTECODE=1`, a chunked binary search, and excluded only this evidence file:

```text
scanned_files: 33425
matched_files: 412
matching_extension_breakdown: {".pyc": 412}
read_error_count: 0
```

The 412 matches were all in generated `__pycache__` directories:

```text
bridge: 5
engine: 47
engine-bin: 360
```

The target cache inventory found 3,701 `.pyc` files in 327 `__pycache__` directories, 0 `.pyc` files outside generated cache directories, and no reparse points. The verifier's count and the independent scan therefore agree.

### Exact deletion invocation and result

The deletion was executed through the target venv, with no source or evidence file as an input:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
@'
(strict os.walk(root, followlinks=False) cache-only deletion walker:
 abort on reparse points; select only *.pyc whose normalized path contains
 __pycache__; validate every selected path is under Y:\ProjectsAI\bridgeclip;
 os.remove each selected file; remove only empty __pycache__ directories under
 engine and bridge)
'@ | & "Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\python.exe" - "Y:\ProjectsAI\bridgeclip"
```

The strict walker selected only generated cache files, including the 360 stale `engine-bin` cache files required by the target-wide `.pyc` rule. It did not select `.py`, model files, binaries, configuration, evidence, or any `.pyc` outside `__pycache__`.

```text
deleted_pyc_count: 3701
deleted_pyc_bytes: 56399065
removed_empty_engine_bridge_cache_dirs: 245
preserved_pyc_outside_cache_count: 0
remaining_cache_pyc_count: 0
```

### Exact regeneration command and result

The target interpreter regenerated bytecode from target source paths, excluding the installed venv packages:

```powershell
Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\python.exe -m compileall -q -f -x '(^|[\\/])\.venv([\\/]|$)' Y:\ProjectsAI\bridgeclip\engine Y:\ProjectsAI\bridgeclip\bridge
```

```text
COMPILEALL_EXIT_CODE=0
```

The initial source regeneration produced 54 `engine`/`bridge` `.pyc` files. Subsequent target-local runtime checks created additional target-path caches in the venv/copied runtime; the final set was 835 `.pyc` files. A marshal/code-object inspection checked all 835 files and found 0 embedded filenames outside `Y:\ProjectsAI\bridgeclip`.

### Final exhaustive scan

The final byte-level scan ran after all repairs, dependency rechecks, launcher activity, and temp cleanup. It excluded only the evidence file and searched every other regular target file:

```text
scanned_files: 30559
matched_files: 0
matching_extension_breakdown: {}
read_error_count: 0
sample_matches: []
```

Complete scanned-file extension breakdown:

```json
{".1":76,".5":8,".7":11,".apache":4,".applescript":1,".asar":1,".bat":10,".bin":2,".bnf":13,".bsd":6,".build":3,".c":7,".cc":4,".cfg":3,".cjs":94,".cmake":2,".cmd":86,".coffee":5,".com":1,".config":2,".cpp":1,".cs":10,".csc":8,".csh":1,".css":21,".csv":30,".cts":65,".ctypes":1,".cub":1,".dat":1,".def":9,".dll":49,".enc":80,".eps":2,".exe":59,".f":25,".f90":62,".f95":1,".fish":3,".fits":1,".flow":28,".fs":8,".fsc":6,".gguf":1,".gif":39,".go":1,".gypi":2,".gz":935,".h":246,".html":99,".icns":2,".ico":3,".idx":2,".inc":1,".ini":1,".js":10346,".json":2026,".jst":25,".keychain":1,".lib":63,".license":3,".list":1,".lock":4,".map":3181,".markdown":9,".mask":1,".md":1096,".mjs":111,".msg":145,".ninja":2,".nmake":1,".node":11,".npy":5,".npz":2,".nsh":18,".nsi":2,".nuspectemplate":2,".onnx":1,".opts":1,".pack":2,".pak":58,".pc":1,".pdb":5,".pem":4,".php":1,".pkl":1,".plist":8,".png":24,".ppm":1,".ps1":92,".pxd":10,".py":4263,".pyc":835,".pyd":110,".pyf":8,".pyi":433,".pyw":1,".pyx":6,".rev":2,".rst":7,".sample":14,".sh":26,".svg":16,".tag":1,".tcl":252,".template":1,".terms":2,".tiff":1,".tm":5,".toml":2,".tpl":4,".ts":2721,".tsbuildinfo":14,".tsx":40,".ttf":11,".txt":127,".typed":60,".vc":2,".wasm":1,".webmanifest":1,".whl":1,".woff2":4,".wxs":1,".xbm":50,".xml":21,".xpm":24,".yaml":7,".yml":76,"<none>":1922}
```

### Todo 2 verification after cache repair

- Hashed lock recheck: `Y:\ProjectsAI\bridgeclip\engine\.venv\Scripts\python.exe -m pip install --require-hashes -r Y:\ProjectsAI\bridgeclip\engine\requirements.lock`, exit `0`.
- Python `3.12.14`; Node `v22.23.3`; FFmpeg `6.1.1-full_build-www.gyan.dev`; ffprobe `N-113658-gacacf8a313-20240216`; yt-dlp `2026.08.19`; NeMo `0.1.0`; all absolute target paths exited `0`.
- Electron package `44.4.5`, `require('electron')` resolved the target `dist\electron.exe`, and `electron.exe --version` returned `v44.4.5`.
- Local target commands `npm run lint` and `npm run typecheck` both exited `0`.
- Real `start-windows.ps1` bounded E2E/system-check: `LAUNCHER_RESULT=PASS_BOUNDED_STARTUP`; both `system.checkTools` records reported `python=true`, `pythonDeps=true`, `ffmpeg=true`, `ffmpegCaptions=true`, `ffprobe=true`, `ytdlp=true`, `engine=true`, and `bridgeRunner=true`.
- Launcher log scan found no `job.start`, provider, generation, or paid-event markers. No related process remained; the isolated user-data/log directory was removed.

### Final Git/source-preservation check

```text
source HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
target HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
source/target branch: main
source status: clean
target tracked status: clean
source diff/cached diff: 0/0
target diff/cached diff: 0/0
origin: https://github.com/aMoonshine/bridgeclip.git
upstream: https://github.com/bridge-mind/bridgeclip.git
source venv pyvenv.cfg SHA-256: A48D4A65BC934CDF7719EA2A30B0EDC43FEA0311E5935E078902CAF825392505
target venv pyvenv.cfg SHA-256: 71254C6BDC694C19B9C03872F78CC7C3C88DAFA7189B66B4757F5D26C1016376
```

The only target untracked item is the explicitly allowed `.omo/` evidence directory. No D: source path remains outside the evidence file.

### Cache-repair cleanup receipt and adversarial probes

- Deleted only target `.pyc` files inside generated `__pycache__` directories; removed 245 empty `engine`/`bridge` cache directories; preserved all source files, model files, Electron/Node/FFmpeg/NeMo files, evidence, and non-cache `.pyc` files.
- `stale_state`: all 412 verifier matches removed; final exhaustive scan is zero.
- `dirty_worktree`: source and target tracked worktrees remain clean with matching HEADs/remotes; no Git metadata changed.
- `misleading_success_output`: verified actual cache bytes, all 835 embedded code-object filenames, launcher log fields, and zero-match scan rather than trusting command exit alone.
- `cancel_resume`: deletion/regeneration completed without interruption; no partial cache or venv state remains.
- `partial venv/cache state`: target venv remained present throughout; final interpreter, lock, versions, launcher, and cache checks passed.
- `long_command`: cache scan, compileall, pip recheck, and launcher were bounded; no lingering process remained.
- `repeated_interruptions`: no repeated interruption or stale process was observed; temp cleanup was verified by `Test-Path`.
- `malformed_input`: not applicable; supplied paths and commands were well-formed.
- `prompt_injection`: not applicable; no untrusted prompt or external content was executed, and no provider/model call was made.

### Cache-repair limitations

- The 360 stale `engine-bin` cache files were removed as target `.pyc` files inside generated `__pycache__` directories, as required for the exhaustive target scan; their parent cache directories were not recursively deleted.
- The target now retains 835 target-path `.pyc` files, including caches created by normal local imports after regeneration; all embedded filenames resolve under Y: and none contain the old D: path.
- No product source, documentation, model weights, credentials, paid/authenticated provider, or D: source was touched. The plan checkbox was not changed.

