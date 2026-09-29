const test=require('node:test'),assert=require('node:assert/strict')
const {loadMain,tempDir,fakeElectron}=require('../zernio/support/load-main.cjs')
test('YouTube module import and empty session lookup create no browser or Codex process',async()=>{
 const {dir,cleanup}=tempDir();try{
  const {electron}=fakeElectron(dir)
  electron.BrowserWindow=class {constructor(){throw new Error('Unexpected browser startup')}}
  electron.session={fromPartition(){throw new Error('Unexpected browser session startup')}}
  const mod=loadMain("export * from './src/main/youtube-session'",{electron})
  assert.equal(mod.savedYouTubeSession(),undefined)

 }finally{cleanup()}
})
