'use strict'

const { existsSync } = require('node:fs')
const { join, delimiter } = require('node:path')
const { spawnSync } = require('node:child_process')

const root = join(__dirname, '..')
const bin = process.platform === 'win32' ? 'Scripts' : 'bin'
const python = join(root, 'engine', '.venv', bin, process.platform === 'win32' ? 'python.exe' : 'python')
const selectedPython = existsSync(python) ? python : process.platform === 'win32' ? 'python' : 'python3'
const env = {
  ...process.env,
  PYTHONPATH: join(root, 'engine'),
  PATH: [join(root, 'engine-bin'), join(root, 'engine', '.venv', bin), process.env.PATH || ''].join(delimiter)
}
const result = spawnSync(selectedPython, ['-m', 'unittest', 'discover', '-s', 'bridge', '-p', 'test_*.py'], {
  cwd: root, env, stdio: 'inherit'
})
if (result.error) {
  process.stderr.write(`Could not start Python bridge tests: ${result.error.message}\n`)
  process.exit(1)
}
process.exit(result.status ?? 1)
