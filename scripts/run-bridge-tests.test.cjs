'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { bridgeTestCommand } = require('./run-bridge-tests.cjs')

const missingVenv = join_missing()

function join_missing() {
  // A path that cannot exist, so the system-interpreter fallback is exercised.
  return require('node:path').join(__dirname, 'no-such-venv', 'python')
}

test('bridge tests prefer the project virtual environment when it exists', () => {
  const { command, args } = bridgeTestCommand('win32', missingVenv)
  // The venv is absent, so the platform's own interpreter is used.
  assert.equal(command, 'python')
  assert.deepEqual(args, ['-m', 'unittest', 'discover', '-s', 'bridge', '-p', 'test_*.py'])
  assert.equal(bridgeTestCommand('darwin', missingVenv).command, 'python3')
  assert.equal(bridgeTestCommand('linux', missingVenv).command, 'python3')
})

test('bridge tests fall back to the system interpreter without a shell', () => {
  const real = require('node:path').join(__dirname, '..', 'engine', '.venv',
    process.platform === 'win32' ? 'Scripts' : 'bin',
    process.platform === 'win32' ? 'python.exe' : 'python')
  const { command } = bridgeTestCommand(process.platform, real)
  // Either the venv interpreter, or the system one when the venv is missing.
  const acceptable = new Set([real, process.platform === 'win32' ? 'python' : 'python3'])
  assert.ok(acceptable.has(command), `unexpected interpreter: ${command}`)
  assert.ok(!/^.*\s/.test(command), 'the command must not embed a shell invocation')
})
