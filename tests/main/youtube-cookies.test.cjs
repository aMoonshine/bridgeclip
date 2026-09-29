const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const {loadMain,tempDir,fakeElectron}=require('../zernio/support/load-main.cjs')
const {parseYouTubeCookies:parse}=loadMain("export * from './src/main/youtube-cookies'",{})
const exportText='# Netscape HTTP Cookie File\n#HttpOnly_.youtube.com\tTRUE\t/\tTRUE\t2000000000\tSID\tfixture-secret\n.other.test\tTRUE\t/\tTRUE\t2000000000\tSID\texcluded'
test('Netscape import preserves HttpOnly and excludes other sites',()=>{
 const cookies=parse(exportText,1000);assert.equal(cookies.length,1);assert.equal(cookies[0].httpOnly,true);assert.equal(cookies[0].value,'fixture-secret')
})
test('JSON import supports browser arrays, wrapped arrays and session cookies',()=>{
 const cookie={domain:'.youtube.com',name:'SID',value:'fixture',path:'/',session:true}
 assert.equal(parse(JSON.stringify([cookie]))[0].session,true)
 assert.equal(parse(JSON.stringify({cookies:[cookie]}))[0].name,'SID')
})
test('malformed, expired and non-YouTube exports are rejected without echoing values',()=>{
 for(const input of ['bad secret','{bad',JSON.stringify([{domain:'.youtube.com',name:'SID',value:'secret',expirationDate:1}]),JSON.stringify([{domain:'youtube.com.evil.test',name:'SID',value:'secret'}]),'x'.repeat(1024*1024+1)]){
  assert.throws(()=>parse(input),e=>!e.message.includes('secret'))
 }
})
test('import writes session and preserves it on cancellation or invalid input',async()=>{
 const {dir,cleanup}=tempDir();try{
  const {electron}=fakeElectron(dir);const file=path.join(dir,'cookies.txt');fs.writeFileSync(file,exportText)
  let canceled=false;electron.dialog={showOpenDialog:async()=>({canceled,filePaths:[file]})}
  const mod=loadMain("export * from './src/main/youtube-session'",{electron})
  assert.equal(await mod.importYouTubeCookies(null),true)
  const before=mod.savedYouTubeSession();assert.equal(JSON.parse(before).cookies[0].name,'SID')
  fs.writeFileSync(file,'invalid');await assert.rejects(mod.importYouTubeCookies(null));assert.equal(mod.savedYouTubeSession(),before)
  canceled=true;assert.equal(await mod.importYouTubeCookies(null),false);assert.equal(mod.savedYouTubeSession(),before)
 }finally{cleanup()}
})
