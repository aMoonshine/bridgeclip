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


test('saved cookie status reflects replacement and survives module reload without secrets',()=>{
 const {dir,cleanup}=tempDir();try{
  const {electron}=fakeElectron(dir)
  const load=()=>loadMain("export * from './src/main/youtube-session'",{electron})
  const mod=load()
  assert.deepEqual(mod.youtubeSessionStatus(),{saved:false,count:0,savedAt:null})
  const first=mod.savePastedYouTubeCookies(JSON.stringify([{domain:'.youtube.com',name:'SID',value:'first-secret',session:true}]))
  assert.equal(first.saved,true);assert.equal(first.count,1);assert.ok(first.savedAt)
  const second=mod.savePastedYouTubeCookies(JSON.stringify([{domain:'.youtube.com',name:'SID',value:'second-secret',session:true},{domain:'.youtube.com',name:'PREF',value:'fixture',session:true}]))
  assert.equal(second.count,2)
  assert.deepEqual(load().youtubeSessionStatus(),second)
  assert.equal(JSON.parse(load().savedYouTubeSession()).cookies[0].value,'second-secret')
  assert.ok(!JSON.stringify(second).includes('secret'))
 }finally{cleanup()}
})
