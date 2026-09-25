'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { existsSync } = require('node:fs')
const { pinnedNode, nodeTestCommand } = require('./run-node-tests.cjs')

test('the test runner prefers the pinned project Node when one is bundled', () => {
  const pinned = pinnedNode()
  if (pinned === null) {
    // No engine-bin runtime in this checkout; falling back is the contract.
    assert.equal(nodeTestCommand().command, process.execPath)
    return
  }
  assert.ok(existsSync(pinned), `pinned interpreter is missing: ${pinned}`)
  assert.match(pinned, /node-v\d+/, 'the pinned interpreter must come from engine-bin/node')
  assert.equal(nodeTestCommand().command, pinned)
})

test('the test runner always requests the node test runner', () => {
  assert.deepEqual(nodeTestCommand().args, ['--test'])
})
