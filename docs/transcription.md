# Transcription

This Windows source checkout transcribes clips locally with `nvidia/nemotron-3.5-asr-streaming-0.6b` through NeMo-Speech.cpp. The runtime and official GGUF model live under `engine-bin/`; `start-windows.cmd` adds local media tools to the process path. Audio and the resulting words stay on the computer during transcription. OpenRouter is used for GLM clip planning, frame analysis, and automatic posting metadata.

The clipping engine feeds 16 kHz mono WAV audio to `nemo-speech transcribe --format json` and requires word timestamps for captions. Long recordings use five-minute chunks with one second of overlap. Word midpoints assign overlap words to one chunk; timestamps are shifted to the original video timeline. A requested start/end range extracts only that part of the source with five seconds of context at each edge. A valid empty transcript can use visual-only planning. This model does not provide speaker diarization by itself, so speaker labels are absent unless a separate diarization model is configured later. Local inference has no provider charge.

Automatic posting metadata also uses local Nemotron for transcription. It converts each clip to bounded WAV chunks, joins their text, and sends the transcript to GLM through OpenRouter to write platform-specific metadata. AI-written posts may contain errors and can publish automatically when enabled.

Quality and Economy both use GLM 5.3 Flash for planning and local Nemotron for transcription. Quality includes optional AI layout vision; Economy skips those checks. The OpenRouter account still needs a key for planning, visual analysis, and metadata writing.

The clipping engine retains an optional `TRANSCRIPTION_BACKEND=openrouter` path for installations that explicitly select it. Quality prefers `microsoft/mai-transcribe-2`; Economy prefers `openai/whisper-large-v3-turbo`. On recoverable errors, it retries each remote model once and can fall back across Whisper Large V3 and MAI. Authentication and credit failures stop immediately. This path sends audio to OpenRouter and requests word timestamps; it is not used by the default Windows launcher or automatic posting metadata. Remote transcription may incur provider charges.

Offline tests cover the local response adapter, command construction, word timing, chunk offsets, errors, and the retained OpenRouter recovery path. A live GLM request remains to be validated with an OpenRouter key.
