param([string]$RuntimeRoot = $env:BRIDGECLIP_RUNTIME_ROOT)
$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
if (-not $RuntimeRoot) {
    if (Test-Path -LiteralPath (Join-Path $project 'engine\.venv\Scripts\python.exe')) { $RuntimeRoot = $project }
    else { $RuntimeRoot = Join-Path (Split-Path $project -Parent) 'bridgeclip' }
}
$RuntimeRoot = (Resolve-Path -LiteralPath $RuntimeRoot).Path
$nodeDir = Join-Path $RuntimeRoot 'engine-bin\node\node-v22.23.3-win-x64'
$pythonDir = Join-Path $RuntimeRoot 'engine\.venv\Scripts'
$env:BRIDGECLIP_PYTHON = Join-Path $pythonDir 'python.exe'
$npm = Join-Path $nodeDir 'npm.cmd'
foreach ($file in @($npm, $env:BRIDGECLIP_PYTHON, (Join-Path $RuntimeRoot 'engine-bin\ffmpeg.exe'), (Join-Path $project 'node_modules\electron\dist\electron.exe'))) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing dependency: $file" }
}
$env:Path = @($nodeDir, $pythonDir, (Join-Path $RuntimeRoot 'engine-bin'), $env:Path) -join [IO.Path]::PathSeparator
$env:PYTHONUTF8 = '1'
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
Set-Location -LiteralPath $project
& $npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& (Join-Path $project 'node_modules\electron\dist\electron.exe') .
exit $LASTEXITCODE
