# Video and performance settings

These three settings trade against each other on purpose. A lower source ceiling
makes the download faster but softens a crop into a face. Encoding on the
graphics card frees the processor, which only pays off once several clips run at
once. A higher clip count shortens the run but sends more requests to the AI
provider at the same moment.

All three default to the behaviour BridgeClip had before they existed, so an
untouched install renders exactly what it always did.

## Source quality — `DOWNLOAD_RESOLUTION`

Where the download is capped, in **Settings → Video and performance → Source
quality**.

| Value | Selector rung | Notes |
| --- | --- | --- |
| `source` (default) | none | Keeps the host's own resolution, including 4K. |
| `2160` | `<=2160` | 4K when the source offers it. |
| `1440` | `<=1440` | Noticeably smaller download. |
| `1080` | `<=1080` | Matches the 1080×1920 output. |
| `720` | `<=720` | Smallest download. |

A cap is applied as a **fallback ladder** rather than a filter, because yt-dlp has
no "at most" height filter. The ladder walks down one codec before switching
codec, so a host that publishes 4K only as VP9 still yields a capped VP9 file
instead of jumping straight to H.264. The ladder stops at 720p and never falls
through to an uncapped selector: a host that publishes nothing at or below the
requested height fails visibly rather than quietly downloading a 4K file the user
asked not to have.

**Why the default is uncapped.** Smart framing can crop hard into a face. When it
does, the extra source pixels are the difference between a sharp face and a
soft one, and the output is only 1080×1920 — so a 4K source carries real detail
that survives the crop. Capping to 1080p is a large win on download time and disk
when the framing stays wide, and a visible loss when it does not.

## Clip encoding — `VIDEO_ENCODER`

Which encoder renders the clips, in **Settings → Video and performance → Encode
clips with**.

| Value | Encoder | Notes |
| --- | --- | --- |
| `cpu` (default) | `libopenh264` where bundled, otherwise `libx264` | Software. Best quality per bit, works without a GPU. |
| `nvenc` | `h264_nvenc` | NVIDIA hardware encoder. **Falls back to the CPU with a warning** if unusable. |
| `auto` | `h264_nvenc` when usable, else CPU | Never fails a run over the encoder. |

### What the measurements actually showed

On an RTX 3090, 1080×1920@30, 20 s of footage, with the app's own `veryfast`
preset and CRF 20:

| Encoder | Time | Speed |
| --- | --- | --- |
| `libx264` CPU (the default path) | 1.59 s | 12.6× realtime |
| `h264_nvenc` | 1.67 s | 12.0× realtime |
| `h264_qsv` | failed, 0 bytes | no Intel iGPU present |

**NVENC was not faster on short clips.** Opening an NVENC session costs about as
much as the throughput it saves, and BridgeClip's clips are 10–60 s. This is why
the option is off by default rather than being what a fresh install does. It pays
off when clips are long, when the processor is already saturated by parallel
work, or on a machine whose CPU encoding is the bottleneck.

`h264_qsv` is not offered: it is not in the value set because Intel Quick Sync
needs an iGPU that most machines BridgeClip runs on do not have.

### How NVENC is chosen

Availability is not taken from `ffmpeg -encoders`. That list reports
`h264_nvenc` even with no usable NVIDIA driver, so the runtime performs **one
real 64×…→320×240 encode** at startup and remembers the result. The probe uses an
ordinary frame size on purpose: NVENC rejects very small inputs outright, so a
tiny probe would report a working GPU as unusable.

NVENC is constant-quality rather than CRF, so `-cq` carries the value the CPU
path expresses as `-crf`, with `-b:v 0` letting FFmpeg derive the bitrate from it
instead of capping it.

## Clips at a time — `RENDER_CONCURRENCY`

How many clips are worked on simultaneously, in **Settings → Video and
performance → Clips at a time**.

`0` (default) derives the value from the core count, at most 4 — the behaviour
that shipped before the setting existed. A number from 1 to 8 overrides it.

This is one knob rather than two on purpose. Each clip holds both a render and its
layout-vision request, so the same counter governs how many provider calls
overlap. Two separate settings would let them disagree, and the vision requests
are what actually run into the provider's rate limit: a 27-clip run on a
43-minute source produced 20 vision round-trips and one HTTP 429 when run
serially.

Raising it trades a higher chance of being rate-limited for a shorter run. If
runs start failing with provider errors, lower this before changing anything
else.

## Reusing a downloaded source

BridgeClip deletes a job's work directory when the job ends, so the downloaded
source never survived to be reused. Re-running the same video paid the full
download again — for a 43-minute 4K source that was 178 s and 2.6 GB of the
822 s run.

Sources are now kept in a cache you choose, **outside** the work directory:

```text
Settings → System check → Downloaded sources → Change
```

The default is `<userData>/sources` (on Windows,
`%APPDATA%\BridgeClip\sources`). Point **Change** at any absolute path — a
second drive, a scratch folder, somewhere you are happy to clear out by hand.
The picked folder is created if it does not exist, and refused if it is a
symlink, because the engine writes into whatever path it is handed.

It **cannot** be placed inside `<userData>/work/`, and the choice is refused at
write time rather than discovered at cleanup time: startup cleanup removes every
directory under the work root that is not an active job, so a cache there would
be deleted on the next launch, silently taking the downloaded sources with it.
That is also why a cache must not be a child of the work root even though a
sibling such as `<userData>/workplace` is fine.

Nothing in a run ever deletes a cached source. Only the per-job working copy
under `work/<job-id>/` is removed when the job ends, and that copy is a hard
link, so removing it frees no real space. Use **Delete** in the panel, or clear
the folder yourself.

### When a stored source is reused

Only when all of these hold. Anything unproven is downloaded again, because
serving the wrong source would silently produce clips from the wrong video.

- **The identity matches.** The key comes from the video id where the host
  publishes one, so a watch link, a `youtu.be` link and a `/shorts/` link share
  one entry. Anything else falls back to a hash of the normalised URL.
- **It is at least as tall as the current ceiling.** A 4K source satisfies a
  1080p request, because a tight crop can still use the detail. A 720p source
  does **not** satisfy a 1080p request, so raising `DOWNLOAD_RESOLUTION` after a
  download correctly triggers a fresh one.
- **The duration still matches** what the host reports, within 2 seconds. This
  is the strongest guard against a different video or an edited re-upload.
- **The file is intact.** A record whose media has vanished or been truncated is
  swept rather than served.

### How it is stored

The downloaded file is **hard-linked** into the cache, so keeping it costs no
extra disk and no copy time, and it survives the work directory being deleted. A
copy is the fallback when the cache and the work directory are on different
volumes. Each entry has a JSON sidecar recording the identity, dimensions,
duration and size.

### Eviction

The cache is bounded by `SOURCE_CACHE_BUDGET_BYTES`, 20 GB by default. Storing
prunes immediately, so the cache never exceeds its budget: least-recently-used
entries are removed until it fits. `0` disables the limit and nothing is evicted.

A cache that cannot be created — an unwritable directory, say — disables itself
and logs a warning. Every run then downloads as it did before, so a cache
failure never fails a run.

### Showing the cache in the app

**Settings → System check → Downloaded sources** lists what is on disk: title,
resolution, length, size, and when it was last used, with a total at the top.
Deleting frees the disk immediately; the next run of that video downloads it
again, so the button is a disk decision rather than an undo.

The list is read from the engine by a short `--list` call, in the same way the
NeMo device inventory is read with `doctor --json`. No filesystem path crosses
the process boundary: a record describes a file, it never names one, so a
tampered cache entry cannot turn into an arbitrary read. A cache key is shape-
checked in the renderer-facing module before it is ever placed in an argument
list, and again by the engine before it is used as a filename.

### Cost of downloading versus transcribing

Worth knowing when choosing between this fork and an official build. On a
43.4-minute source, using the prices the engine estimates with:

| Path | Transcription | Planning + layout | Total |
| --- | --- | --- | --- |
| This fork, local Nemotron | $0.000 | $0.0021 | **$0.0021** |
| Upstream, OpenRouter MAI Transcribe 2 at $0.10/h | $0.072 | $0.0021 | **$0.074** |

The engine's own prices are `MAI_PRICE_PER_HOUR = 0.10`,
`WHISPER_TURBO_PRICE_PER_HOUR = 0.0108`, `WHISPER_V3_PRICE_PER_HOUR = 0.0288`,
and transcription falls back across them. Economy mode uses Whisper Turbo.

OpenRouter answering HTTP 402 is reported as "OpenRouter account is out of
credits". A 402 means the account declined the request; a spend limit on the key
is not the same as a remaining balance, so a key showing a limit is not proof
that funds are available for it.

## Where a run's time goes

Measured on a 43.4-minute 4K source producing 27 vertical clips, total 822 s:

| Stage | Time | Share |
| --- | --- | --- |
| Rendering and layout vision | 328.0 s | 39.9% |
| Transcription (local, GPU) | 205.1 s | 24.9% |
| Download | 177.9 s | 21.6% |
| Clip planning (LLM) | 102.1 s | 12.4% |
| Audio extraction | 7.1 s | 0.9% |

Cost for the same run was $0.002127, all of it OpenRouter: planning $0.001098 and
layout vision $0.001029. Transcription was $0.000000 because it ran locally.

Note what this implies. The download was 21.6% of the run and fetched 2.6 GB of
4K for a 1080×1920 output, which is what `DOWNLOAD_RESOLUTION=1080` removes. The
render stage is not dominated by encoding, which is why the encoder setting is
not the first thing to reach for.
