const assert = require('node:assert/strict')
const { test } = require('node:test')
const path = require('node:path')
const { loadMain, tempDir, fakeElectron } = require('../zernio/support/load-main.cjs')

const shared = loadMain("export { normalizeDevice, deviceLabel, isSelectableDevice } from './src/shared/nemo-runtime'")

test('device selection accepts the documented values', () => {
  for (const value of ['auto', 'cpu', 'cuda', 'vulkan', 'metal', 'gpu', 'cuda:0', 'vulkan:11', 'gpu:1']) {
    assert.ok(shared.isSelectableDevice(value), `expected ${value} to be accepted`)
  }
  assert.equal(shared.normalizeDevice('auto'), 'auto')
  assert.equal(shared.normalizeDevice('CUDA:1'), 'cuda:1')
  assert.equal(shared.normalizeDevice('  vulkan  '), 'vulkan')
  assert.equal(shared.normalizeDevice(''), 'auto', 'blank falls back to automatic selection')
  assert.equal(shared.normalizeDevice(undefined), 'auto')
})

test('device selection refuses anything that could reach a subprocess argv', () => {
  for (const value of ['; calc', 'rm -rf /', '../../etc', 'vulkan:abc', 'vulkan:999', 'auto extra', 'vulkan:1 --model', '`id`', 'vulkan:1;vulkan:2']) {
    assert.equal(shared.isSelectableDevice(value), false, `expected ${value} to be refused`)
    assert.equal(shared.normalizeDevice(value), null)
  }
})

test('a device label never leaks a filesystem path', () => {
  const label = shared.deviceLabel({ index: 0, name: 'Vulkan0', type: 'gpu', description: 'C:\\secret\\path', memoryTotal: 1024 })
  assert.ok(!label.includes('\\'), label)
  assert.equal(shared.deviceLabel({ index: 1, name: 'CPU', type: 'cpu', description: '', memoryTotal: null }), 'CPU')
})

test('settings normalise an unknown device back to automatic', () => {
  const { dir, cleanup } = tempDir()
  try {
    const { electron } = fakeElectron(dir)
    const store = loadMain("export { loadSettings, saveSettings, savePublicSettings, publicSettings, getSettingsForBridge } from './src/main/settings-store'", { electron })

    // Defaults: local, automatic device.
    const fresh = store.publicSettings(store.loadSettings())
    assert.equal(fresh.transcriptionBackend, 'nemotron')
    assert.equal(fresh.transcriptionDevice, 'auto')

    // A documented device is kept and reaches the engine.
    store.savePublicSettings({ transcriptionDevice: 'vulkan:0' })
    const env = store.getSettingsForBridge(store.loadSettings())
    assert.equal(env.TRANSCRIPTION_DEVICE, 'vulkan:0')
    assert.equal(env.TRANSCRIPTION_BACKEND, 'nemotron')

    // A value outside the documented set is refused and replaced with auto.
    store.savePublicSettings({ transcriptionDevice: 'vulkan; rm -rf /' })
    assert.equal(store.loadSettings().transcriptionDevice, 'auto')
  } finally { cleanup() }
})

test('the transcription backend only accepts the two supported providers', () => {
  const { dir, cleanup } = tempDir()
  try {
    const { electron } = fakeElectron(dir)
    const store = loadMain("export { loadSettings, savePublicSettings } from './src/main/settings-store'", { electron })
    store.savePublicSettings({ transcriptionBackend: 'openrouter' })
    assert.equal(store.loadSettings().transcriptionBackend, 'openrouter')
    for (const value of ['', 'nemo', 'local', 'http://evil.example', 'codex']) {
      store.savePublicSettings({ transcriptionBackend: value })
      assert.equal(store.loadSettings().transcriptionBackend, 'nemotron', value)
    }
  } finally { cleanup() }
})

test('the engine environment carries no credential beyond the OpenRouter key', () => {
  const env = {
    OPENROUTER_API_KEY: 'or-key',
    LOCAL_MODE: 'true',
    LOCAL_OUTPUT_DIR: path.join('C:', 'out'),
    TRANSCRIPTION_BACKEND: 'nemotron',
    TRANSCRIPTION_DEVICE: 'vulkan:0'
  }
  const serialized = JSON.stringify(env)
  assert.equal(serialized.includes('zernio'), false, 'the Zernio key must not reach the engine')
  assert.ok(env.TRANSCRIPTION_DEVICE)
})
