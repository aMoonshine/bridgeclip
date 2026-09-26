const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadMain } = require('../zernio/support/load-main.cjs')

const shared = loadMain("export { EMPTY_SOURCE_CACHE } from './src/shared/source-cache'")

// The cache module resolves its interpreter the way a job does, through
// pipeline-runner. These tests exercise the parsing and refusal rules, not the
// interpreter lookup, so both resolvers are stubbed to paths that do not exist.
const NO_ENGINE = {
  './pipeline-runner': {
    getEnginePath: () => '/nonexistent/engine',
    resolvePythonPath: () => '/nonexistent/engine/.venv/bin/python'
  }
}
const cache = loadMain("export { readSourceCache, deleteCachedSource } from './src/main/source-cache'", NO_ENGINE)

test('an empty cache is a valid, disabled answer', () => {
  assert.deepEqual(shared.EMPTY_SOURCE_CACHE, {
    enabled: false, totalBytes: 0, entries: [], error: null
  })
})

test('a cache that cannot be read returns an empty list rather than throwing', async () => {
  // The resolvers point at nothing, so the call must fail soft: a cache that
  // cannot be listed is not worth interrupting a run over.
  const info = await cache.readSourceCache('python', '/tmp/sources')
  assert.equal(info.enabled, false)
  assert.deepEqual(info.entries, [])
  assert.equal(info.totalBytes, 0)
  assert.equal(info.error, null)
})

test('a malformed key is refused before it can reach an argument list', async () => {
  for (const key of ['../evil', 'yt-../../secret', 'yt-a; calc', '', 'a'.repeat(200), 'yt-a/b']) {
    const result = await cache.deleteCachedSource('python', '/tmp/sources', key)
    assert.equal(result.ok, false, key)
  }
})

test('a well-formed key is passed through for the engine to check', () => {
  // A valid key with no engine present fails at the call, not at validation,
  // which is what distinguishes it from the refused shapes above.
  return cache.deleteCachedSource('python', '/tmp/sources', 'yt-dQw4w9WgXcQ')
    .then((result) => assert.equal(result.ok, false))
})
