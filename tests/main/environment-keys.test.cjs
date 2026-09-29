const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path')
const {loadMain,tempDir,fakeElectron}=require('../zernio/support/load-main.cjs')
test('saved secrets take priority; missing secrets fall back to local env without leaking to public settings',()=>{
 const {dir,cleanup}=tempDir()
 const old={OPENROUTER_API_KEY:process.env.OPENROUTER_API_KEY,ZERNIO_API_KEY:process.env.ZERNIO_API_KEY}
 delete process.env.OPENROUTER_API_KEY;delete process.env.ZERNIO_API_KEY
 try {
  const {electron}=fakeElectron(dir)
  fs.writeFileSync(path.join(dir,'.env'),'ZERNIO_API_KEY="fixture-zernio"\nOPENROUTER_API_KEY=fixture-openrouter\n')
  const store=loadMain("export * from './src/main/settings-store'",{electron})
  let settings=store.loadSettings()
  assert.equal(settings.zernioApiKey,'fixture-zernio')
  assert.equal(settings.openrouterApiKey,'fixture-openrouter')
  assert.equal(store.publicSettings(settings).zernioConfigured,true)
  assert.ok(!JSON.stringify(store.publicSettings(settings)).includes('fixture-'))
  store.saveSettings({...settings,zernioApiKey:'saved-secret'})
  process.env.ZERNIO_API_KEY='process-secret'
  assert.equal(store.loadSettings().zernioApiKey,'saved-secret')
  store.saveSettings({...settings,zernioApiKey:''})
  assert.equal(store.loadSettings().zernioApiKey,'process-secret')
  delete process.env.ZERNIO_API_KEY
  assert.equal(store.loadSettings().zernioApiKey,'fixture-zernio')
  const disk=JSON.parse(fs.readFileSync(path.join(dir,'userData','settings.json'),'utf8'))
  assert.equal(disk.openrouterApiKey.scheme,'safeStorage')
 } finally {for(const [key,value] of Object.entries(old)){if(value===undefined)delete process.env[key];else process.env[key]=value}cleanup()}
})
