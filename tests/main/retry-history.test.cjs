const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs')
const {loadMain,tempDir,fakeElectron}=require('../zernio/support/load-main.cjs')
test('failed run retains validated settings on disk and history after module reload',async()=>{
 const {dir,cleanup}=tempDir();try{
 const {electron}=fakeElectron(dir)
 const entry="export * from './src/main/run-history';export {getJobHistory} from './src/main/file-manager'"
 const mod=loadMain(entry,{electron}),id='12345678-1234-1234-1234-123456789012'
 const request={videoUrl:'https://www.youtube.com/watch?v=abcdefghijk',clippingMode:'economy',maxClips:8,autoClipCount:false,durationRanges:['short'],aspectRatio:'9:16',layoutStyle:'fit',layoutVision:false,pacing:'natural',videoSpeed:1.5,includeCaptions:false,captionPreset:'pop',startTimeSeconds:12,endTimeSeconds:95,bannerPlatform:null,bannerChannelUrl:null}
 mod.createRunRecord(dir,id,request.videoUrl,{...request,unwanted:'must-not-be-saved'})
 mod.finishRunRecord(dir,id,'failed','test failure')
 const reopened=loadMain(entry,{electron})
 assert.deepEqual(reopened.readRunRecord(dir,id).request,request)
 assert.deepEqual((await reopened.getJobHistory(dir))[0].request,request)
 assert.ok(!fs.readFileSync(path.join(dir,id,'run-history.json'),'utf8').includes('must-not-be-saved'))
 }finally{cleanup()}
})
