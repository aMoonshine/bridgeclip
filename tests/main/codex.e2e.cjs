const test = require('node:test')
const assert = require('node:assert/strict')
const path = process.getBuiltinModule('path')
const { launchApp } = require('../zernio/support/electron-app.cjs')

test('Codex connects only on explicit action and preserves model settings', { timeout: 90000 }, async (t) => {
  const root = path.resolve('.pytest_cache', `codex-ui-${Date.now()}`)
  const { app, page, close } = await launchApp({ appDir: path.resolve('.'), userDataDir: root })
  t.after(close)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await app.evaluate(({ ipcMain }) => {
    global.codexChecks = 0
    ipcMain.removeHandler('codex:status')
    ipcMain.handle('codex:status', () => {
      global.codexChecks++
      if (global.codexReject) throw new Error('Codex rejected the request.')
      return { connected: true, models: [
        { id: 'gpt-6-luna', name: 'GPT-6 Luna', vision: true, reasoningEfforts: ['low', 'high'] },
        { id: 'gpt-6-sol', name: 'GPT-6 Sol', vision: true, reasoningEfforts: ['low', 'high'] },
        { id: 'text-only', name: 'Text only', vision: false }
      ] }
    })
  })
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByLabel('Planning and Vision model').waitFor()
  await page.waitForTimeout(300)
  assert.equal(await app.evaluate(() => global.codexChecks), 0, 'Opening settings must not check Codex')
  await page.getByRole('button', { name: 'Check connection', exact: true }).click()
  await page.getByText('Connected with ChatGPT', { exact: true }).waitFor()
  const picker = page.getByLabel('Planning and Vision model')
  assert.equal(await picker.locator('option').count(), 2)
  await picker.selectOption('gpt-6-sol')
  await page.waitForFunction(async () => (await window.bridgeclip.settings.load()).codexModel === 'gpt-6-sol')
  await page.getByLabel('Reasoning level').selectOption('high')
  await page.waitForFunction(async () => (await window.bridgeclip.settings.load()).codexReasoning === 'high')
  await page.reload()
  await page.getByRole('button', {name:'Settings',exact:true}).click()
  await page.getByLabel('Planning and Vision model').waitFor()
  await page.waitForTimeout(300)
  assert.equal(await app.evaluate(() => global.codexChecks), 1, 'Reload must not check Codex')
  assert.equal(await page.getByLabel('Planning and Vision model').inputValue(), 'gpt-6-sol')
  assert.equal(await page.getByLabel('Reasoning level').inputValue(), 'high')
  // Real import IPC, synthetic credentials and isolated app home only.
  await app.evaluate(({ app }) => {
    const fs = process.getBuiltinModule('fs'), path = process.getBuiltinModule('path')
    process.env.CODEX_HOME = path.join(app.getPath('home'), '.codex')
    fs.mkdirSync(process.env.CODEX_HOME, {recursive:true})
    fs.writeFileSync(path.join(process.env.CODEX_HOME, 'auth.json'), JSON.stringify({tokens:{access_token:'test-access',refresh_token:'test-refresh',id_token:'test-id'}}))
  })
  await page.getByRole('button', {name:'Update sign-in from Codex',exact:true}).click()
  await page.getByText('Sign-in data updated locally. Click Check connection when ready.',{exact:true}).waitFor()
  assert.equal(await app.evaluate(() => global.codexChecks), 1, 'Import must not connect')
  assert.equal(await app.evaluate(({app}) => {
    const fs=process.getBuiltinModule('fs'),path=process.getBuiltinModule('path')
    return fs.readFileSync(path.join(process.env.CODEX_HOME,'auth.json'),'utf8') === fs.readFileSync(path.join(app.getPath('userData'),'codex','auth.json'),'utf8')
  }), true)
  await app.evaluate(() => { global.codexReject = true })
  await page.getByRole('button', {name:'Check connection',exact:true}).click()
  await page.getByRole('alert').waitFor()
  assert.equal(await page.getByRole('button', {name:'Sign in with ChatGPT',exact:true}).isEnabled(),true)
  assert.equal(await page.getByRole('button', {name:'Update sign-in from Codex',exact:true}).isEnabled(),true)
  await app.evaluate(() => process.getBuiltinModule('fs').writeFileSync(process.getBuiltinModule('path').join(process.env.CODEX_HOME,'auth.json'),'{bad'))
  await page.getByRole('button', {name:'Update sign-in from Codex',exact:true}).click()
  await page.getByText(/Codex sign-in file is invalid/).waitFor()
  assert.equal(await app.evaluate(({app}) => JSON.parse(process.getBuiltinModule('fs').readFileSync(process.getBuiltinModule('path').join(app.getPath('userData'),'codex','auth.json'),'utf8')).tokens.access_token), 'test-access')
  assert.equal(await app.evaluate(() => global.codexChecks),2)
  assert.deepEqual(errors, [])
})
