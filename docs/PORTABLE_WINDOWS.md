# Portable Windows development checkout

## Current verified state

- Canonical working checkout: `Y:\ProjectsAI\bridgeclip`
- Rollback source: none. The former `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip` checkout was removed by
  owner decision; recover through `origin` = `aMoonshine/bridgeclip` instead.
- Verified source baseline: `main` at `6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5`
- Launcher: `Y:\ProjectsAI\bridgeclip\start-windows.cmd`
- Project-local Python base: `Y:\ProjectsAI\bridgeclip\engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe`
- Project-local venv: `Y:\ProjectsAI\bridgeclip\engine\.venv`
- Project-local Node: `Y:\ProjectsAI\bridgeclip\engine-bin\node\node-v22.23.3-win-x64`
- Project-local media/runtime files: `Y:\ProjectsAI\bridgeclip\engine-bin\`

Todo 2 recreated the venv at the Y: path and verified the real launcher with bounded startup and system checks. `nemo-speech doctor --json` now reports a compiled Vulkan backend and the RTX 3090. The checkout is verified for development startup and local GPU transcription; it is not yet Windows release acceptance, because the GPU archive is still staged by hand rather than by the packaging scripts.

Large runtime files, the model, `node_modules\`, and `engine\.venv\` are ignored by Git. Keep the project at the canonical path after venv creation because Windows activation files and launchers contain absolute paths.

## Recreate the target venv

Run these commands in PowerShell from any directory. They operate only on the canonical Y: checkout.

```powershell
$Project = 'Y:\ProjectsAI\bridgeclip'
$BasePython = Join-Path $Project 'engine-bin\python\cpython-3.12.14-windows-x86_64-none\python.exe'
$VenvPython = Join-Path $Project 'engine\.venv\Scripts\python.exe'
$NodeDir = Join-Path $Project 'engine-bin\node\node-v22.23.3-win-x64'

& $BasePython -m venv (Join-Path $Project 'engine\.venv')
if ($LASTEXITCODE -ne 0) { throw 'Target venv creation failed.' }
& $VenvPython -m pip install --require-hashes -r (Join-Path $Project 'engine\requirements.lock')
if ($LASTEXITCODE -ne 0) { throw 'Locked Python dependency installation failed.' }

$env:Path = "$NodeDir;$env:SystemRoot\System32;$env:SystemRoot"
& (Join-Path $NodeDir 'npm.cmd') ci
if ($LASTEXITCODE -ne 0) { throw 'Project-local npm installation failed.' }
```

Do not copy `engine\.venv` from D:. The copied venv was path-bound. On this HEAD, also verify the Electron executable after `npm ci`; if `node_modules\electron\dist\electron.exe` is absent, stop and use the target-scoped repair recorded in `.omo/evidence/bridgeclip-ssd-portable-ai/task-2-runtime.md`. Do not treat `npm ls electron` as proof that the executable exists.

## Exact system checks

```powershell
$Project = 'Y:\ProjectsAI\bridgeclip'
$Python = Join-Path $Project 'engine\.venv\Scripts\python.exe'
$Node = Join-Path $Project 'engine-bin\node\node-v22.23.3-win-x64\node.exe'
$FFmpeg = Join-Path $Project 'engine-bin\ffmpeg.exe'
$FFprobe = Join-Path $Project 'engine-bin\ffprobe.exe'
$YtDlp = Join-Path $Project 'engine\.venv\Scripts\yt-dlp.exe'
$Nemo = Join-Path $Project 'engine-bin\nemo-speech\bin\nemo-speech.exe'
$Electron = Join-Path $Project 'node_modules\electron\dist\electron.exe'

Test-Path -LiteralPath $Python -PathType Leaf
Test-Path -LiteralPath $FFmpeg -PathType Leaf
Test-Path -LiteralPath $FFprobe -PathType Leaf
Test-Path -LiteralPath $YtDlp -PathType Leaf
Test-Path -LiteralPath $Nemo -PathType Leaf
Test-Path -LiteralPath (Join-Path $Project 'engine-bin\models\nemotron-3.5-asr-streaming-0.6b.q8_0.gguf') -PathType Leaf
Test-Path -LiteralPath $Electron -PathType Leaf
& $Python --version
& $Node --version
& $FFmpeg -version
& $FFprobe -version
& $YtDlp --version
& $Nemo --version
& $Nemo doctor --json
& $Electron --version
& $FFmpeg -hide_banner -filters | findstr /R /C:" ass "
& (Join-Path $Project 'start-windows.ps1')
```

A passing development preflight resolves every local binary and starts the app. GPU acceptance is met on this machine: `doctor --json` reports `backend_vulkan=true` with the RTX 3090, and the local fixture transcribes on the GPU with word timestamps, as described in [Transcription](transcription.md). A machine without a GPU backend may still install a CPU bundle, but that is a diagnostic path and not release acceptance.

## Rollback rule

1. Stop before changing either checkout if a target path, hash, command, or launcher check fails.
2. Preserve the canonical failure output and the D: checkout as rollback evidence.
3. Do not repair, delete, start, or reuse the D: venv/runtime in place.
4. Do not mix D:-bound launchers or caches with the Y: project.
5. Return to the D: source only as an explicit owner rollback decision; it is not a verified portable GPU runtime.

## Owner decisions and planned portable data

A versioned project-local `data\` root is planned. It will hold non-secret settings, logs, thumbnails, work/recovery state, drafts, recent-project metadata, history metadata, and non-secret Codex runtime state after migration is implemented.

Portable data rules:

- Never place API keys, raw ChatGPT/Codex access or refresh tokens, cookies, `auth.json`, or Keyring exports in `data\`.
- Keep Windows Keyring credential ownership outside the portable tree.
- Never perform an automatic model download. Runtime and model staging must be explicit and verified.
- Clear-history behavior must remove index metadata only and never silently delete output media.
- Portable state, draft persistence, recent projects, crash recovery, and history clearing are **planned / not yet implemented**. Current state remains under Electron per-user `userData`.

See [Project status](PROJECT_STATUS.md), [Architecture](ARCHITECTURE.md), and [Providers](PROVIDERS.md).
