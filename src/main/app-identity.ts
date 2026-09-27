import { app } from 'electron'
import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, constants } from 'fs'

if (process.env.BRIDGECLIP_E2E !== '1') {
  const root = join(app.getPath('appData'), 'BridgeClip Codex')
  const original = join(app.getPath('appData'), 'BridgeClip', 'settings.json')
  mkdirSync(root, { recursive: true, mode: 0o700 })
  // Bootstrap only once. Original settings, history and running jobs are untouched.
  const settingsPath = join(root, 'settings.json')
  if (!existsSync(settingsPath) && existsSync(original)) {
    try {
      const settings = JSON.parse(readFileSync(original, 'utf8'))
      settings.outputDirectory = join(app.getPath('home'), 'BridgeClip Codex')
      settings.pythonPath = process.env.BRIDGECLIP_PYTHON || settings.pythonPath
      settings.codexModel = 'gpt-6-luna'
      // Secret ciphertext is bound to the original Chromium profile.
      // Each app saves its own keys through the normal Settings flow.
      settings.openrouterApiKey = ''
      settings.zernioApiKey = ''
      writeFileSync(settingsPath, JSON.stringify(settings, null, 2), { flag: 'wx', mode: 0o600 })
    } catch { /* First-run Settings can be configured manually. */ }
  }
  const codexHome = join(root, 'codex')
  mkdirSync(codexHome, { recursive: true, mode: 0o700 })
  const auth = join(process.env.CODEX_HOME || join(app.getPath('home'), '.codex'), 'auth.json')
  const target = join(codexHome, 'auth.json')
  if (!existsSync(target) && existsSync(auth)) {
    try { copyFileSync(auth, target, constants.COPYFILE_EXCL) }
    catch { /* The user can sign in from Settings. */ }
  }
  app.setName('BridgeClip Codex')
  app.setPath('userData', root)
  app.setAppLogsPath(join(root, 'logs'))
}
