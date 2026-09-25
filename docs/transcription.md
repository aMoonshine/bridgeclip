# Transcription

## Current verified state

The canonical Windows source checkout defaults to local transcription with `nvidia/nemotron-3.5-asr-streaming-0.6b` through NeMo-Speech.cpp `0.1.0`. The runtime and existing GGUF model are under `engine-bin/`; the launcher uses:

```text
engine-bin\nemo-speech\bin\nemo-speech.exe
engine-bin\models\nemotron-3.5-asr-streaming-0.6b.q8_0.gguf
```

For the current default path, FFmpeg extracts 16 kHz mono WAV and BridgeClip invokes:

```text
nemo-speech transcribe <audio.wav> --model <model.gguf> --language <locale> --format json
```

The command does not currently select CUDA or Vulkan. A local check at this baseline reported:

```text
accelerator_available=false
accelerator_compiled=false
backend_cuda=false
backend_vulkan=false
```

The current bundle is therefore **CPU-only and not GPU-complete**. A CPU transcription can be useful for diagnostics, but it is not GPU acceptance. For the local backend, audio and the resulting transcript remain on the computer.

Long recordings are split into five-minute chunks with one second of overlap. Word midpoints assign overlap words to one chunk, and timestamps are shifted back to the source-video timeline. A requested source range adds bounded context at each edge. Word timestamps are required for captions. The local model does not provide diarization in the current configuration.

Automatic posting metadata also transcribes locally with the same NeMo executable and model, then sends only the resulting transcript to OpenRouter for GLM copy generation. It is currently CPU-only for the same reason.

The engine retains a separate `TRANSCRIPTION_BACKEND=openrouter` implementation. When explicitly selected outside the current UI, it uploads audio chunks to OpenRouter, may use MAI or Whisper recovery models, and can incur OpenRouter charges. It is not the default and must not be described as an automatic local fallback.

Quality and Economy currently both use local Nemotron for transcription. Quality can request GLM layout vision; Economy disables that optional request. Clip planning remains hardcoded to OpenRouter GLM in the current bridge.

## Owner decisions

- GPU-capable local ASR is mandatory. CPU-only output cannot close Todo 6 or a release gate.
- Accept only a compiled CUDA or Vulkan backend plus a real local fixture that returns text and monotonic word timestamps.
- Do not download or replace the existing model during runtime staging or acceptance.
- Codex/ChatGPT-plan access is not assumed to provide ASR. Codex is a separate provider with explicit role discovery.
- OpenRouter remote transcription, if retained, must be an explicit user choice with clear audio egress and billing disclosure. It must not be a silent fallback.

## Planned / not yet implemented

The target acceptance commands are:

```powershell
& "Y:\ProjectsAI\bridgeclip\engine-bin\nemo-speech\bin\nemo-speech.exe" doctor --json
& "Y:\ProjectsAI\bridgeclip\engine-bin\nemo-speech\bin\nemo-speech.exe" transcribe "Y:\ProjectsAI\bridgeclip\engine\tests\fixtures\nemo-jfk.wav" --model "Y:\ProjectsAI\bridgeclip\engine-bin\models\nemotron-3.5-asr-streaming-0.6b.q8_0.gguf" --language en-US --device cuda:0 --format json
```

The fixture path and GPU runtime are not yet present as verified acceptance assets. The GPU command must not be reported as passed until the doctor reports a compiled accelerator and the fixture output contains the expected text, a non-empty `words` array, and monotonic timestamps. A Vulkan device may replace `cuda:0` only when recorded as the verified equivalent.

No live provider request is part of this documentation baseline. See [Providers](PROVIDERS.md) and [Project status](PROJECT_STATUS.md).
