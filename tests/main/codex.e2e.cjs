const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const { launchApp } = require('../zernio/support/electron-app.cjs')

test('Codex connection and model selection persist in Electron', { timeout: 90000 }, async (t) => {
  const root = path.resolve('.pytest_cache', `codex-ui-${Date.now()}`)
  const session = await launchApp({ appDir: path.resolve('.'), userDataDir: root })
  t.after(() => session.close())
  const { app, page } = session
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await app.evaluate(({ ipcMain }) => {
    ipcMain.removeHandler('codex:status')
    ipcMain.handle('codex:status', () => ({ connected: true, models: [
      { id: 'gpt-6-luna', name: 'GPT-6 Luna', vision: true },
      { id: 'gpt-6-sol', name: 'GPT-6 Sol', vision: true },
      { id: 'text-only', name: 'Text only', vision: false }
    ] }))
  })
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Check connection', exact: true }).click()
  await page.getByText('Connected with ChatGPT', { exact: true }).waitFor()
  const picker = page.getByLabel('Planning and Vision model')
  assert.equal(await picker.inputValue(), 'gpt-6-luna')
  assert.equal(await picker.locator('option').count(), 2)
  await picker.selectOption('gpt-6-sol')
  await page.waitForFunction(async () => (await window.bridgeclip.settings.load()).codexModel === 'gpt-6-sol')
  await page.reload()
  assert.equal((await page.evaluate(() => window.bridgeclip.settings.load())).codexModel, 'gpt-6-sol')
  assert.deepEqual(errors, [])
})
