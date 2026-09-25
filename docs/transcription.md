# Transcription

## Current verified state

The canonical Windows source checkout defaults to local transcription with `nvidia/nemotron-3.5-asr-streaming-0.6b` through NeMo-Speech.cpp `0.1.0`. The runtime and existing GGUF model are under `engine-bin/`; the launcher uses:

```text
engine-bin\nemo-speech\bin\nemo-speech.exe
engine-bin\models\nemotron-3.5-asr-streaming-0.6b.q8_0.gguf
```

For the current default path, FFmpeg extracts 16 kHz mono WAV and BridgeClip invokes:

```text
nemo-speech transcribe <audio.wav> --model <model.gguf> --language <locale> --format json --device auto
```

`--device` was added with the GPU runtime and is now explicit. `auto`, the default, lets the runtime pick the best compiled backend, which is the GPU when a Vulkan or CUDA build is installed. `TRANSCRIPTION_DEVICE` may pin `cpu`, `vulkan:0`, or `cuda:0`; any value outside that documented set is rejected in settings, because it reaches a subprocess argv.

The installed runtime is the official Vulkan archive, and the local check reports:

```text
accelerator_available=true
accelerator_compiled=true
backend_cuda=false
backend_vulkan=true
devices[0] = Vulkan0 / NVIDIA GeForce RTX 3090 / type gpu
```

GPU transcription is verified on the local fixture, and `auto` resolves to `Vulkan0`:

```text
[asr] model=nemotron-3.5-asr-streaming-0.6b_q8_0 head=rnnt backend=Vulkan0
text = "And so my fellow Americans ask not what your country can do for you. Ask what you can do for your country."
```

The fixture returns 22 word objects with monotonic start and end values. The same 11-second clip took 1.95 s on `Vulkan0` against 3.38 s on `cpu` on this machine; the gap widens on longer audio because the encoder is compute-bound. CPU remains available as a diagnostic and as a fallback, but it is no longer the default path.

The model is unchanged by the runtime swap. `engine-bin\models\nemotron-3.5-asr-streaming-0.6b.q8_0.gguf` hashes to `3FC991D3BADAD7277C11030A7519832CDDAF2057AAFED6D4B25147E953A070B1` before and after, and no model was downloaded.

Long recordings are split into five-minute chunks with one second of overlap. Word midpoints assign overlap words to one chunk, and timestamps are shifted back to the source-video timeline. A requested source range adds bounded context at each edge. Word timestamps are required for captions. The local model does not provide diarization in the current configuration.

Automatic posting metadata also transcribes locally with the same NeMo executable and model, then sends only the resulting transcript to OpenRouter for GLM copy generation. It forwards the same validated device value and therefore also runs on the GPU.

The engine retains a separate `TRANSCRIPTION_BACKEND=openrouter` implementation. When explicitly selected outside the current UI, it uploads audio chunks to OpenRouter, may use MAI or Whisper recovery models, and can incur OpenRouter charges. It is not the default and must not be described as an automatic local fallback.

Quality and Economy currently both use local Nemotron for transcription. Quality can request GLM layout vision; Economy disables that optional request. Clip planning remains hardcoded to OpenRouter GLM in the current bridge.

## Owner decisions

- GPU-capable local ASR is mandatory. CPU-only output cannot close Todo 6 or a release gate.
- Accept only a compiled CUDA or Vulkan backend plus a real local fixture that returns text and monotonic word timestamps.
- Do not download or replace the existing model during runtime staging or acceptance.
- Codex/ChatGPT-plan access is not assumed to provide ASR. Codex is a separate provider with explicit role discovery.
- OpenRouter remote transcription, if retained, must be an explicit user choice with clear audio egress and billing disclosure. It must not be a silent fallback.

## Verified acceptance

The acceptance commands that were previously listed as pending are now run and passing:

```powershell
& "Y:\ProjectsAI\bridgeclip\engine-bin\nemo-speech\bin\nemo-speech.exe" doctor --json
& "Y:\ProjectsAI\bridgeclip\engine-bin\nemo-speech\bin\nemo-speech.exe" transcribe "Y:\ProjectsAI\bridgeclip\engine\tests\fixtures\nemo-jfk.wav" --model "Y:\ProjectsAI\bridgeclip\engine-bin\models\nemotron-3.5-asr-streaming-0.6b.q8_0.gguf" --language en-US --device vulkan:0 --format json
```

`vulkan:0` is the recorded equivalent of the planned `cuda:0` for this machine, which has the Vulkan runtime and driver but no CUDA archive. Acceptance is met on three points: the doctor reports a compiled accelerator, the transcript contains the expected text, and `words` is non-empty with monotonic timestamps.

## Runtime provenance

The installed bundle is the official `nemo-speech-0.1.0-windows-x86_64-vulkan.zip` from `NVIDIA/NeMo-Speech.cpp` release `v0.1.0`, verified against the published digest:

```text
size   21967184
sha256 b5e7b04a637da4eb25a60253e2db65774998e8dfb48c08b4db763009b82ac7ac
```

A Vulkan backend DLL taken from an unrelated application cannot be substituted. The loader in this ggml generation resolves a different set of backend symbols than the bundles produced by the other application on this machine, and the official archive's own `ggml.dll` differs from the CPU-only archive's, so backends must come from the matching official archive rather than be mixed. The archive and the previous CPU bundle were removed after verification; reinstall by repeating this download and digest check.

No live provider request is part of this documentation baseline. See [Providers](PROVIDERS.md) and [Project status](PROJECT_STATUS.md).
