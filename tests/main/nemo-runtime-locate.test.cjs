const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const os = require('node:os')
const { buildSync } = require('esbuild')
const vm = require('node:vm')

function loadApi() {
  const bundle = buildSync({
    stdin: {
      contents: "export { resolveNemoSpeech, readNemoRuntime } from './src/main/nemo-runtime'",
      resolveDir: path.resolve(__dirname, '..', '..'),
      loader: 'ts'
    },
    bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false
  }).outputFiles[0].text
  const sandbox = { exports: {} }
  vm.runInNewContext(bundle, {
    module: sandbox,
    exports: sandbox.exports,
    require,
    process,
    console,
    __dirname: path.resolve(__dirname, '..', '..', 'src', 'main')
  })
  return sandbox.exports
}

test('the project-staged runtime is preferred over any system install', () => {
  const api = loadApi()
  const found = api.resolveNemoSpeech(path.resolve(__dirname, '..', '..', 'engine-bin'))
  // In a checkout without the runtime staged this is allowed to be null; when
  // it is staged it must be the project copy, never a system prefix.
  if (found !== null) {
    assert.ok(found.includes('engine-bin'), `expected the staged copy, got ${found}`)
  }
})

test('an absent runtime is reported without a path', () => {
  const api = loadApi()
  return api.readNemoRuntime(path.join(os.tmpdir(), 'bridgeclip-no-engine-here')).then((info) => {
    assert.equal(info.available, false)
    assert.equal(info.acceleratorAvailable, false)
    // Length, not deepEqual: the value crosses a vm realm, so its array
    // prototype differs and a structural comparison would fail on identity.
    assert.equal(info.devices.length, 0)
    assert.equal(info.modelName, null)
    assert.ok(info.error && !info.error.includes(os.tmpdir()), 'the error must not include a path')
  })
})
