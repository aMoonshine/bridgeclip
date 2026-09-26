const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadMain, tempDir, fakeElectron } = require('../zernio/support/load-main.cjs')

const STORE = "export { loadSettings, saveSettings, savePublicSettings, publicSettings, getSettingsForBridge } from './src/main/settings-store'"

function withStore(run) {
  const { dir, cleanup } = tempDir()
  try {
    const { electron } = fakeElectron(dir)
    return run(loadMain(STORE, { electron }))
  } finally { cleanup() }
}

test('source quality defaults to the source resolution and only accepts documented ceilings', () => {
  withStore((store) => {
    const fresh = store.publicSettings(store.loadSettings())
    assert.equal(fresh.downloadResolution, 'source', 'an untouched install must keep the source resolution')

    for (const value of ['2160', '1440', '1080', '720', 'source']) {
      store.savePublicSettings({ downloadResolution: value })
      assert.equal(store.loadSettings().downloadResolution, value)
    }
    // Anything else falls back rather than being forwarded to yt-dlp.
    for (const value of ['', '4320', '8k', '1080; rm -rf /', 'null']) {
      store.savePublicSettings({ downloadResolution: value })
      assert.equal(store.loadSettings().downloadResolution, 'source', value)
    }
  })
})

test('the chosen source ceiling reaches the engine', () => {
  withStore((store) => {
    store.savePublicSettings({ downloadResolution: '1080' })
    const env = store.getSettingsForBridge(store.loadSettings())
    assert.equal(env.DOWNLOAD_RESOLUTION, '1080')
  })
})

test('the encoder choice is limited to the three documented values', () => {
  withStore((store) => {
    const fresh = store.publicSettings(store.loadSettings())
    assert.equal(fresh.videoEncoder, 'cpu', 'encoding stays on the processor until asked otherwise')

    for (const value of ['cpu', 'nvenc', 'auto']) {
      store.savePublicSettings({ videoEncoder: value })
      assert.equal(store.loadSettings().videoEncoder, value)
    }
    for (const value of ['', 'videotoolbox', 'qsv', 'h264_nvenc; calc']) {
      store.savePublicSettings({ videoEncoder: value })
      assert.equal(store.loadSettings().videoEncoder, 'cpu', value)
    }
  })
})

test('the encoder choice reaches the engine', () => {
  withStore((store) => {
    store.savePublicSettings({ videoEncoder: 'nvenc' })
    assert.equal(store.getSettingsForBridge(store.loadSettings()).VIDEO_ENCODER, 'nvenc')
  })
})

test('clip concurrency defaults to automatic and is clamped to a sane range', () => {
  withStore((store) => {
    const fresh = store.publicSettings(store.loadSettings())
    assert.equal(fresh.renderConcurrency, 0, '0 means the engine derives it from the core count')

    for (const value of [1, 2, 4, 6, 8]) {
      store.savePublicSettings({ renderConcurrency: value })
      assert.equal(store.loadSettings().renderConcurrency, value)
    }
    // Too high, negative and non-numeric all mean automatic rather than a
    // value that would flood the provider with requests.
    for (const value of [9, 1000, -3, 2.5, 'many', NaN]) {
      store.savePublicSettings({ renderConcurrency: value })
      const stored = store.loadSettings().renderConcurrency
      assert.ok(stored >= 0 && stored <= 8, `${value} produced ${stored}`)
      if (value === 9 || value === 1000) assert.equal(stored, 8, 'a high number clamps to the maximum')
    }
  })
})

test('the concurrency override reaches the engine as a string', () => {
  withStore((store) => {
    assert.equal(store.getSettingsForBridge(store.loadSettings()).RENDER_CONCURRENCY, '0')
    store.savePublicSettings({ renderConcurrency: 6 })
    assert.equal(store.getSettingsForBridge(store.loadSettings()).RENDER_CONCURRENCY, '6')
  })
})

test('the three performance settings survive a save and reload together', () => {
  withStore((store) => {
    store.savePublicSettings({
      downloadResolution: '1440',
      videoEncoder: 'auto',
      renderConcurrency: 4
    })
    const reloaded = store.publicSettings(store.loadSettings())
    assert.equal(reloaded.downloadResolution, '1440')
    assert.equal(reloaded.videoEncoder, 'auto')
    assert.equal(reloaded.renderConcurrency, 4)

    const env = store.getSettingsForBridge(store.loadSettings())
    assert.deepEqual(
      { r: env.DOWNLOAD_RESOLUTION, e: env.VIDEO_ENCODER, c: env.RENDER_CONCURRENCY },
      { r: '1440', e: 'auto', c: '4' }
    )
  })
})

test('the engine is told where to keep downloaded sources', () => {
  withStore((store) => {
    const env = store.getSettingsForBridge(store.loadSettings())
    assert.ok(env.BRIDGECLIP_SOURCE_CACHE, 'the engine needs a cache directory to reuse sources')
    assert.equal(env.SOURCE_CACHE_BUDGET_BYTES, String(20 * 1000 ** 3))
  })
})

test('the source cache sits beside the work root, not inside it', () => {
  withStore((store) => {
    const env = store.getSettingsForBridge(store.loadSettings())
    // Startup cleanup removes every directory under the work root that is not an
    // active job, so a cache inside it would be deleted on the next launch.
    assert.ok(!/[\\/]work[\\/]/.test(env.BRIDGECLIP_SOURCE_CACHE), env.BRIDGECLIP_SOURCE_CACHE)
    assert.ok(/[\\/]sources$/.test(env.BRIDGECLIP_SOURCE_CACHE), env.BRIDGECLIP_SOURCE_CACHE)
  })
})

test('the sources folder can be pointed at any absolute path', () => {
  withStore((store) => {
    for (const dir of ['Y:\\cache', 'Y:\\cache\\sources', 'D:\\Media\\bridgeclip', '/mnt/media/bridgeclip']) {
      store.savePublicSettings({ sourceCacheDirectory: dir })
      assert.equal(store.loadSettings().sourceCacheDirectory, dir)
      assert.equal(store.getSettingsForBridge(store.loadSettings()).BRIDGECLIP_SOURCE_CACHE, dir)
    }
  })
})

test('a relative sources folder is refused', () => {
  withStore((store) => {
    for (const dir of ['cache', 'sources\\videos', '..\\cache', '']) {
      if (dir === '') {
        // Blank means "not chosen" and falls back to the default.
        store.savePublicSettings({ sourceCacheDirectory: dir })
        assert.ok(store.loadSettings().sourceCacheDirectory)
        continue
      }
      assert.throws(() => store.savePublicSettings({ sourceCacheDirectory: dir }), dir)
    }
  })
})

test('a sources folder inside the work root is refused', () => {
  const { dir, cleanup } = tempDir()
  try {
    const { electron } = fakeElectron(dir)
    const store = loadMain(STORE, { electron })
    // The default lives at <userData>/sources, so the work root is its parent.
    const current = store.loadSettings().sourceCacheDirectory
    const userData = current.replace(/[\\/]sources$/, '')
    const workRoot = `${userData}\\work`

    // Anything under <userData>/work would be removed by startup cleanup, which
    // would silently take the downloaded sources with it.
    for (const dir of [workRoot, `${workRoot}\\sources`, `${workRoot}\\a\\b`]) {
      assert.throws(() => store.savePublicSettings({ sourceCacheDirectory: dir }), dir)
    }
    // A sibling whose name merely starts the same way is fine.
    store.savePublicSettings({ sourceCacheDirectory: `${workRoot}-elsewhere` })
    assert.equal(store.loadSettings().sourceCacheDirectory, `${workRoot}-elsewhere`)
  } finally { cleanup() }
})
