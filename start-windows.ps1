$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
$nodeDir = Join-Path $project 'engine-bin\node\node-v22.23.3-win-x64'
$npm = Join-Path $nodeDir 'npm.cmd'
$pythonDir = Join-Path $project 'engine\.venv\Scripts'
$python = Join-Path $pythonDir 'python.exe'
$ytdlp = Join-Path $pythonDir 'yt-dlp.exe'
$ffmpeg = Join-Path $project 'engine-bin\ffmpeg.exe'
$ffprobe = Join-Path $project 'engine-bin\ffprobe.exe'
$nemo = Join-Path $project 'engine-bin\nemo-speech\bin\nemo-speech.exe'
$model = Join-Path $project 'engine-bin\models\nemotron-3.5-asr-streaming-0.6b.q8_0.gguf'
$electron = Join-Path $project 'node_modules\electron\dist\electron.exe'

foreach ($item in @($npm, $python, $ytdlp, $ffmpeg, $ffprobe, $nemo, $model, $electron)) {
    if (-not (Test-Path -LiteralPath $item -PathType Leaf)) {
        throw "Missing local dependency: $item"
    }
}
if (-not (Test-Path -LiteralPath (Join-Path $project 'node_modules\.bin\electron-vite.cmd') -PathType Leaf)) {
    throw 'Missing project Node dependencies. Run npm install using the local Node runtime.'
}

# Keep application tools inside this folder. Windows system directories supply only OS utilities.
$env:Path = (@($nodeDir, $pythonDir, (Join-Path $project 'engine-bin'),
    (Join-Path $env:SystemRoot 'System32'), $env:SystemRoot) -join [IO.Path]::PathSeparator)
$env:BRIDGECLIP_LOCAL_RUNTIME = '1'
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
Set-Location -LiteralPath $project
& $npm run dev
exit $LASTEXITCODE
