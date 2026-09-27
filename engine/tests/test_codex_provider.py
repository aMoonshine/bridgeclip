"""Exercise the JSON-lines transport against a real local fake server process."""
import asyncio
import base64
import json
import sys
from unittest.mock import AsyncMock

import pytest
from clip_engine.services import codex_provider as module

FAKE = r'''import json,sys
from pathlib import Path
mode=sys.argv[1]
def send(value):
 print(json.dumps(value),flush=True)
for line in sys.stdin:
 request=json.loads(line)
 method=request['method']; params=request.get('params',{}); result={}
 if method=='initialize': result={}
 elif method=='account/read':
  assert params['refreshToken'] is False
  result={'account':None if mode=='logout' else {'type':'chatgpt'}}
 elif method=='model/list': result={'data':[{'id':'gpt-6-luna','model':'gpt-6-luna','displayName':'Luna','inputModalities':['text','image'],'supportedReasoningEfforts':[{'reasoningEffort':'low'},{'reasoningEffort':'high'}]}]}
 elif method=='thread/start':
  assert params['ephemeral'] is True and params['sandbox']=='read-only'
  result={'thread':{'id':'thread1'}}
 elif method=='turn/start':
  assert params['outputSchema']['type']=='object'
  assert params['effort']==('high' if mode=='high' else 'low')
  for item in params['input']:
   if item['type']=='localImage': assert Path(item['path']).read_bytes()==b'jpeg bytes'
  result={'turn':{'id':'turn1'}}
 elif method=='turn/interrupt': result={}
 if 'id' in request: send({'id':request['id'],'result':result})
 if method=='turn/start' and mode!='hang':
  if mode=='exit': sys.exit(0)
  send({'method':'item/completed','params':{'threadId':'thread1','turnId':'turn1','item':{'type':'agentMessage','phase':'commentary','text':'working'}}})
  send({'method':'thread/tokenUsage/updated','params':{'threadId':'thread1','tokenUsage':{'last':{'inputTokens':8,'outputTokens':4,'totalTokens':12}}}})
  send({'method':'item/completed','params':{'threadId':'thread1','turnId':'turn1','item':{'type':'agentMessage','phase':'final_answer','text':'invalid' if mode=='invalid' else '{"answer":42}'}}})
  send({'method':'turn/completed','params':{'threadId':'thread1','turn':{'id':'turn1','status':'failed' if mode=='failed' else 'completed'}}})
'''
SCHEMA={'type':'object','properties':{'answer':{'type':'integer'}},'required':['answer'],'additionalProperties':False}

@pytest.fixture
def fake(monkeypatch,tmp_path):
 script=tmp_path/'fake.py';script.write_text(FAKE,encoding='utf-8')
 monkeypatch.setenv('BRIDGECLIP_CODEX_HOME',str(tmp_path/'profile'))
 monkeypatch.setattr(module,'executable',lambda:sys.executable)
 real=asyncio.create_subprocess_exec
 children=[]
 def setup(mode):
  async def spawn(*args,**kwargs):
   child=await real(sys.executable,str(script),mode,**kwargs)
   children.append(child)
   return child
  monkeypatch.setattr(module.asyncio,'create_subprocess_exec',spawn)
 return setup,children

def test_completion_with_images_and_usage(fake):
 setup,children=fake;setup('ok')
 async def run():
  async with module.CodexSession() as client:
   response,usage=await client.complete([{'role':'user','content':[{'type':'text','text':'analyze'},{'type':'image_url','image_url':{'url':'data:image/jpeg;base64,'+base64.b64encode(b'jpeg bytes').decode()}}]}],SCHEMA,'gpt-6-luna')
   assert json.loads(response['choices'][0]['message']['content'])=={'answer':42}
   assert usage['total_tokens']==12 and usage['cost']==0
 asyncio.run(run())
 assert all(p.returncode is not None for p in children)

@pytest.mark.parametrize('mode,match',[('logout','Sign in'),('invalid','invalid analysis'),('failed','could not finish'),('exit','closed'),('hang','timed out')])
def test_errors_close_child(fake,mode,match):
 setup,children=fake;setup(mode)
 async def run():
  async with module.CodexSession(timeout=1) as client:
   await client.complete([{'role':'user','content':'analyze'}],SCHEMA,'gpt-6-luna')
 with pytest.raises(module.CodexError,match=match): asyncio.run(run())
 assert all(p.returncode is not None for p in children)

def test_cancel_closes_child(fake):
 setup,children=fake;setup('hang')
 async def run():
  async def work():
   async with module.CodexSession() as client:
    await client.complete([{'role':'user','content':'analyze'}],SCHEMA,'gpt-6-luna')
  task=asyncio.create_task(work())
  await asyncio.sleep(.3)
  task.cancel()
  with pytest.raises(asyncio.CancelledError): await task
 asyncio.run(run())
 assert all(p.returncode is not None for p in children)

def test_unavailable_model_does_not_fallback(fake):
 setup,_=fake;setup('ok')
 async def run():
  async with module.CodexSession() as client:
   await client.complete([],SCHEMA,'unknown')
 with pytest.raises(module.CodexError,match='unavailable'): asyncio.run(run())

def test_planner_routes_codex_without_openrouter(monkeypatch):
 from clip_engine.config import Settings
 from clip_engine.services.intelligence_planner import IntelligencePlannerService, IntelligencePlanningError
 planner=IntelligencePlannerService()
 planner.settings=Settings(_env_file=None,analysis_provider='codex',codex_model='gpt-6-luna')
 planner._get_client=AsyncMock(side_effect=AssertionError('OpenRouter called'))
 answer=({'choices':[]},{'cost':0})
 completion=AsyncMock(return_value=answer)
 monkeypatch.setattr(module,'completion',completion)
 assert asyncio.run(planner._call_openrouter('irrelevant',[{'role':'user','content':'hello'}]))==answer
 assert completion.call_args.args[2]=='gpt-6-luna'
 completion.side_effect=module.CodexError('Sign in')
 with pytest.raises(IntelligencePlanningError) as error:
  asyncio.run(planner._call_openrouter('irrelevant',[]))
 assert error.value.retryable is False and error.value.reason=='codex'


def test_selected_reasoning_reaches_server(fake):
 setup,_=fake;setup('high')
 async def run():
  async with module.CodexSession() as client:
   await client.complete([],SCHEMA,'gpt-6-luna','high')
 asyncio.run(run())


def test_unsupported_reasoning_is_rejected(fake):
 setup,_=fake;setup('ok')
 async def run():
  async with module.CodexSession() as client:
   await client.complete([],SCHEMA,'gpt-6-luna','none')
 with pytest.raises(module.CodexError,match='reasoning level'): asyncio.run(run())


def test_vision_queue_overlaps_two_requests_and_remains_bounded(monkeypatch):
 active=0
 peak=0
 release=asyncio.Event()
 both=asyncio.Event()
 class Session:
  async def __aenter__(self): return self
  async def __aexit__(self,*args): pass
  async def complete(self,*args):
   nonlocal active,peak
   active+=1;peak=max(peak,active)
   if active==2: both.set()
   try: await release.wait()
   finally: active-=1
   return {},{}
 monkeypatch.setattr(module,'CodexSession',Session)
 async def run():
  tasks=[asyncio.create_task(module.completion([],SCHEMA,'gpt-6-luna')) for _ in range(5)]
  try:
   await asyncio.wait_for(both.wait(),1)
   assert active==2
   release.set()
   await asyncio.gather(*tasks)
   assert peak==2
  finally:
   for task in tasks: task.cancel()
   await asyncio.gather(*tasks,return_exceptions=True)
 asyncio.run(run())
