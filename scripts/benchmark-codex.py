"""Small reproducible Vision comparison; uses the app's existing Codex login.
Run with PYTHONPATH=engine and BRIDGECLIP_CODEX_HOME set; pass --output and JPEG paths.
No transcription, downloads or rendering. Results do not establish general model accuracy.
"""
import argparse
import asyncio
import base64
import json
from pathlib import Path
from time import perf_counter
from clip_engine.services.codex_provider import completion, CodexError
from clip_engine.services.layout_analyzer import VISION_PROMPT, VISION_SCHEMA

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('frames', nargs='+')
    args = parser.parse_args()
    results = []
    # Sequential: latency comparisons must not compete for the same account capacity.
    for frame in args.frames:
        image = base64.b64encode(Path(frame).read_bytes()).decode()
        messages = [{'role': 'user', 'content': [
            {'type': 'text', 'text': VISION_PROMPT.replace('{faces}', '[]')},
            {'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,' + image}},
        ]}]
        for model, effort in [('gpt-6-luna', 'low'), ('gpt-6-luna', 'high'), ('gpt-6-sol', 'low'), ('gpt-6-sol', 'high')]:
            start = perf_counter()
            result = {'frame': str(Path(frame).name), 'model': model, 'effort': effort}
            try:
                response, usage = await completion(messages, VISION_SCHEMA, model, effort)
                result.update(answer=json.loads(response['choices'][0]['message']['content']), usage=usage)
            except CodexError as error:
                result['error'] = str(error)
            result['seconds'] = round(perf_counter() - start, 3)
            results.append(result)
            Path(args.output).write_text(json.dumps(results, indent=2), encoding='utf-8')
            print(json.dumps(result), flush=True)

if __name__ == '__main__':
    asyncio.run(main())
