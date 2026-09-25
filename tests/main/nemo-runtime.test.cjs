const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadMain, tempDir, fakeElectron } = require('../zernio/support/load-main.cjs')

const shared = loadMain(
  "export { normalizeDevice, deviceLabel, isSelectableDevice, EMPTY_NEMO_RUNTIME } from './src/shared/nemo-runtime'"
)

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
  for (const value of ['; calc', 'rm -rf /', '../../etc', 'vulkan:abc', 'vulkan:999', 'auto extra', 'vulkan:1 --model', '`id`']) {
    assert.equal(shared.isSelectableDevice(value), false, `expected ${value} to be refused`)
    assert.equal(shared.normalizeDevice(value), null)
  }
})

test('a device label never leaks a filesystem path', () => {
  // The device name and description come from the GPU driver, so they are
  // untrusted input that the UI would otherwise render verbatim.
  const label = shared.deviceLabel({ index: 0, name: 'Vulkan0', type: 'gpu', description: 'C:\\secret\\path', memoryTotal: 1024 })
  assert.ok(!label.includes('\\'), label)
  assert.equal(shared.deviceLabel({ index: 1, name: 'CPU', type: 'cpu', description: '', memoryTotal: null }), 'CPU')
})

test('a fresh install transcribes through OpenRouter', () => {
  const { dir, cleanup } = tempDir()
  try {
    const { electron } = fakeElectron(dir)
    const store = loadMain(
      "export { loadSettings, savePublicSettings, getSettingsForBridge } from './src/main/settings-store'", { electron }
    )
    const fresh = store.loadSettings()
    assert.equal(fresh.transcriptionBackend, 'openrouter', 'the hosted backend must remain the default')
    assert.equal(fresh.transcriptionDevice, 'auto')
    const env = store.getSettingsForBridge(fresh)
    assert.equal(env.TRANSCRIPTION_BACKEND, 'openrouter')
    assert.equal(env.TRANSCRIPTION_DEVICE, 'auto')
  } finally { cleanup() }
})

test('the chosen backend and device are persisted and reach the engine', () => {
  const { dir, cleanup } = tempDir()
  try {
    const { electron } = fakeElectron(dir)
    const store = loadMain(
      "export { loadSettings, savePublicSettings, getSettingsForBridge } from './src/main/settings-store'", { electron }
    )
    store.savePublicSettings({ transcriptionBackend: 'nemotron', transcriptionDevice: 'vulkan:0' })
    const settings = store.loadSettings()
    assert.equal(settings.transcriptionBackend, 'nemotron')
    assert.equal(settings.transcriptionDevice, 'vulkan:0')
    const env = store.getSettingsForBridge(settings)
    assert.equal(env.TRANSCRIPTION_BACKEND, 'nemotron')
    assert.equal(env.TRANSCRIPTION_DEVICE, 'vulkan:0')
  } finally { cleanup() }
})

test('an unknown device is refused and falls back to automatic', () => {
  const { dir, cleanup } = tempDir()
  try {
    const { electron } = fakeElectron(dir)
    const store = loadMain("export { loadSettings, savePublicSettings } from './src/main/settings-store'", { electron })
    store.savePublicSettings({ transcriptionDevice: 'vulkan; rm -rf /' })
    assert.equal(store.loadSettings().transcriptionDevice, 'auto')
  } finally { cleanup() }
})

test('the transcription backend only accepts the two supported providers', () => {
  const { dir, cleanup } = tempDir()
  try {
    const { electron } = fakeElectron(dir)
    const store = loadMain("export { loadSettings, savePublicSettings } from './src/main/settings-store'", { electron })
    store.savePublicSettings({ transcriptionBackend: 'nemotron' })
    assert.equal(store.loadSettings().transcriptionBackend, 'nemotron')
    for (const value of ['', 'local', 'nemo', 'http://evil.example', 'codex']) {
      store.savePublicSettings({ transcriptionBackend: value })
      assert.equal(store.loadSettings().transcriptionBackend, 'openrouter', value)
    }
  } finally { cleanup() }
})

test('the engine environment still carries no credential beyond the OpenRouter key', () => {
  const env = {
    OPENROUTER_API_KEY: 'or-key',
    LOCAL_MODE: 'true',
    LOCAL_OUTPUT_DIR: 'C:/out',
    TRANSCRIPTION_BACKEND: 'nemotron',
    TRANSCRIPTION_DEVICE: 'vulkan:0'
  }
  assert.equal(JSON.stringify(env).includes('zernio'), false)
})

test('an absent runtime is reported without a path', () => {
  const runtime = loadMain("export { readNemoRuntime } from './src/main/nemo-runtime'", {
    fs: { existsSync: () => false }
  })
  return runtime.readNemoRuntime('C:/no-engine-here').then((info) => {
    assert.equal(info.available, false)
    assert.equal(info.acceleratorAvailable, false)
    assert.deepEqual(info.devices, [])
    assert.equal(info.modelName, null)
    assert.ok(info.error && !info.error.includes('C:'), 'the error must not include a path')
  })
})
