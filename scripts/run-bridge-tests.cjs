'use strict'

const { existsSync } = require('node:fs')
const { join, delimiter } = require('node:path')
const { spawnSync } = require('node:child_process')

const root = join(__dirname, '..')
const bin = process.platform === 'win32' ? 'Scripts' : 'bin'
const python = join(root, 'engine', '.venv', bin, process.platform === 'win32' ? 'python.exe' : 'python')

/** Fall back to a system interpreter only when the project venv is missing. */
function bridgeTestCommand(platform = process.platform, venvPython = python) {
  const system = platform === 'win32' ? 'python' : 'python3'
  return {
    command: existsSync(venvPython) ? venvPython : system,
    args: ['-m', 'unittest', 'discover', '-s', 'bridge', '-p', 'test_*.py']
  }
}

function main() {
  const { command, args } = bridgeTestCommand()
  const env = {
    ...process.env,
    PYTHONPATH: join(root, 'engine'),
    PATH: [join(root, 'engine-bin'), join(root, 'engine', '.venv', bin), process.env.PATH || ''].join(delimiter)
  }
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', windowsHide: true })
  if (result.error) {
    process.stderr.write(`Could not start Python bridge tests: ${result.error.message}\n`)
    process.exitCode = 1
  } else {
    process.exitCode = result.status ?? 1
  }
}

if (require.main === module) main()

module.exports = { bridgeTestCommand }
