'use strict'

/**
 * Run the offline test suites with the project's pinned Node.
 *
 * The product is built and packaged against the Node that ships in
 * `engine-bin/node/`. Running the suites on whatever `node` happens to be first
 * on PATH is not equivalent: a newer major can change behaviour the tests rely
 * on, which shows up as failures that do not exist in the shipped runtime. This
 * runner prefers the bundled interpreter and falls back to the current one.
 */

const { existsSync, readdirSync } = require('node:fs')
const { join, delimiter } = require('node:path')
const { spawnSync } = require('node:child_process')

const root = join(__dirname, '..')

/** The bundled interpreter, or null when this checkout has no engine-bin runtime. */
function pinnedNode() {
  const dir = join(root, 'engine-bin', 'node')
  if (!existsSync(dir)) return null
  const candidates = readdirSync(dir)
    .filter((name) => /^node-v\d+/.test(name))
    .sort()
    .reverse()
    .map((name) => join(dir, name, process.platform === 'win32' ? 'node.exe' : 'bin', process.platform === 'win32' ? '' : 'node'))
    .filter((candidate) => existsSync(candidate))
  return candidates[0] ?? null
}

function nodeTestCommand() {
  return { command: pinnedNode() ?? process.execPath, args: ['--test'] }
}

function main() {
  const { command, args } = nodeTestCommand()
  const extra = process.argv.slice(2)
  if (!extra.length) {
    process.stderr.write('usage: node scripts/run-node-tests.cjs <file-or-glob> [...]\n')
    process.exit(2)
  }
  const result = spawnSync(command, [...args, ...extra], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env, PATH: [join(root, 'engine-bin'), process.env.PATH || ''].join(delimiter) }
  })
  if (result.error) {
    process.stderr.write(`Could not start Node tests: ${result.error.message}\n`)
    process.exitCode = 1
  } else {
    process.exitCode = result.status ?? 1
  }
}

if (require.main === module) main()

module.exports = { pinnedNode, nodeTestCommand }
