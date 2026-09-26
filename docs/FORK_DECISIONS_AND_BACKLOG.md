# Fork decisions, changes and backlog

Authoritative handover document for the work carried out on top of `bridge-mind/bridgeclip`.
Written 2026-09-26 at a deliberate pause in development. Everything below is a record of
what was decided, what was built, what was fixed, and what is still broken.

If this file and another document disagree, this file wins for fork-specific decisions and
`docs/UPSTREAM_SYNC.md` wins for remote and push policy.

## 1. Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Drop local GPU transcription.** Cloud transcription only. | Measured ~4 minutes for a 40-minute video (~10x realtime) on an RTX 3090 via the Vulkan NeMo path. Verified the audio pipeline is already correct (16 kHz mono PCM), so this is genuine runtime speed, not misconfiguration. The hosted Nemotron model costs cents. Not worth maintaining a 741 MB model plus a GPU runtime. |
| D2 | **Drop local diarization (Sortformer).** | Same runtime cost problem as D1. Speaker labels are not consumed by the layout analyzer anyway, so the feature produced no user-visible benefit. Deferred, not rejected — see section 7. |
| D3 | **No direct OpenAI OAuth.** | Owner decision. OpenAI models remain reachable through OpenRouter. |
| D4 | **Keep the fork's UI and settings work.** Source cache, cache folder selection, model pickers in all modes, video resolution/encoder/concurrency settings, 24-hour time format, title-card removal. | These are the features the owner actually values and they are independent of the transcription backend. |
| D5 | **`main` mirrors upstream.** Fork features live in a long-lived overlay branch that is rebased, not merged. | Upstream updates frequently. A pure mirror keeps upstream adoption cheap and conflict-free. See section 2. |
| D6 | **No upstream PRs.** | `CONTRIBUTING.md` restricts PRs to collaborators. This was confirmed against the live repository, not assumed. |

### Consequence of D1 and D2 that still needs action

`origin/feat/local-gpu-transcription` and upstream issue
`https://github.com/bridge-mind/bridgeclip/issues/54` were created to propose local GPU
transcription. **D1 and D2 retract that proposal.** The issue text and the remote branch now
describe work we no longer want. Decide explicitly whether to close the issue with a note, or
repurpose it to propose only the non-ASR parts (cache, settings, model selection). Do not leave
it open describing an abandoned approach.

## 2. Branch strategy

Three roles, deliberately separated:

- `main` — a mirror of `upstream/main`. Our commits never land here. Update with
  `git fetch upstream && git reset --hard upstream/main`. Never push force to `origin`.
- `ours/ui-overhaul` — the long-lived overlay holding every fork feature. It is **rebased** onto
  a fresh `upstream/main`, never merged. Rebasing surfaces conflicts once, at the moment upstream
  lands, instead of letting them accumulate for a quarterly merge.
- `ours/release` — the tagged build line. Merge `ours/ui-overhaul` here to cut a release.

This replaces the older `sync/upstream-YYYYMMDD` merge-branch policy in `docs/UPSTREAM_SYNC.md`.
That document's fetch/compare/review/test discipline still applies; only the branch topology
changed.

**Known cost of this model:** because of D6, upstream fixes never come back automatically. The
`two_shot` misclassification in section 6 is the kind of defect that upstream may fix, and it
will have to be pulled across by hand.

## 3. Repository state at pause

- Canonical checkout: `Y:\ProjectsAI\bridgeclip`
- `origin` = `aMoonshine/bridgeclip`, `upstream` = `bridge-mind/bridgeclip`
- HEAD `a217f87`; `upstream/main` `f6c7226` (v0.1.18); local is **4 behind / 9 ahead**
- **45 uncommitted entries** (34 modified, 11 untracked). Nothing from this session is committed
  or pushed. The only untracked source files that matter are listed in section 4.
- A foreign `stash@{0}` exists, touching `src/main/pipeline-runner.ts`. It is not ours and was
  never inspected. Do not drop it.
- Never create directory junctions inside this checkout. A previous session lost
  `engine-bin/`, `.venv/` and `node_modules/` to a junction/`Remove-Item -Recurse` interaction.
  Section 5 exists because that happened.

## 4. What the fork adds relative to upstream

New files:

- `engine/clip_engine/services/source_cache.py` — media reuse: URL keying, duration/height
  validation, integrity checks, hardlinks, sidecar JSON, LRU eviction, 20 GB budget, CLI
  list/delete.
- `src/main/source-cache.ts`, `src/shared/source-cache.ts`,
  `src/renderer/components/SourceCacheSettings.tsx` — cache folder picker, entry list, delete,
  and open-folder in **Settings → System check → Downloaded sources**.
- `src/renderer/components/VideoSettings.tsx` — download resolution, video encoder, render
  concurrency.
- `docs/video-performance.md` — measurements and rationale for the above.

Modified behaviour:

- `video_downloader.py` — `DOWNLOAD_RESOLUTION` ladder (`source`/`2160`/`1440`/`1080`/`720`),
  cache lookup before download, accurate HTTP 403 classification.
- `config.py` — the new video settings and the source-cache settings.
- `rendering_service.py`, `layout_renderer.py`, `ai_clipping_pipeline.py` — video encoder
  selection; title card removed.
- `bridge_runner.py` — accepts transcription model fields in **every** clipping mode, not only
  Advanced.
- `JobForm.tsx`, `use-draft-store.ts`, `ModelPicker.tsx`, `openrouter-models.ts` — model pickers
  in all modes, local-model option, persisted selection, reasoning-model warning.
- `utils.ts`, `RunStats.tsx`, `PostDialog.tsx` — 24-hour time (`hour12: false`).

## 5. Environment restore

The working tree is intact, but the toolchain lives outside version control and was destroyed
once. Restore it as follows after any machine-level cleanup:

- Node `22.23.3` → `engine-bin/node/node-v22.23.3-win-x64`
- Python `3.12.14` → `engine-bin/python/cpython-3.12.14-windows-x86_64-none`
- Virtualenv → `engine/.venv` (`python -m venv`, then install from the lockfile; verify with
  `pip check`)
- FFmpeg `9.0.2` → `engine-bin/ffmpeg.exe`, `engine-bin/ffprobe.exe`, SHA-256
  `60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba`. Must expose the `ass`
  filter. This is **newer than the recorded 6.1.1**; owner approved the upgrade.
- OpenRouter and YouTube credentials live in `comp2.conf` (gitignored). Never commit it.

Retired with D1/D2, safe to delete once the tree is clean: `engine-bin/nemo-speech/`,
`engine-bin/models/nemotron-3.5-asr-streaming-0.6b.q8_0.gguf`, and
`engine-bin/models/nvidia/diar_streaming_sortformer_4spk-v2/`. Total reclaimable ≈ 880 MB.
Deleting them is **not** required — nothing loads them once the cloud path is the only path — but
leaving them costs disk and invites confusion.

For reference, the model digests in case they must be re-fetched: NeMo Vulkan runtime `0.1.0`
SHA-256 `b5e7b04a637da4eb25a60253e2db65774998e8dfb48c08b4db763009b82ac7ac`; Nemotron ASR GGUF
741,548,352 bytes; Sortformer GGUF 140.3 MB.

## 6. Open bugs

Ordered by how much they block the owner. None of these are fixed.

### B1 — Download resolution is ignored (blocking)

`Settings → Video → Download` is set to Full HD (1080p), but the pipeline still downloaded 4K
(observed 2.6 GB for a 39-minute video, and a 4K file on a later run). The setting reaches
`Settings`, but the format selection in `video_downloader.py` does not constrain the chosen
stream. Until fixed, every run pays full bandwidth and disk for 4K. This is our regression, not
an upstream defect.

### B2 — Model pickers are stuck and cannot be changed (blocking)

After selecting an OpenRouter model in Advanced, the model fields stay populated when switching
between Advanced / default modes. Other models cannot be chosen, including the local option. The
stale value is still sent to the engine, which is how a previous run was forced onto a hosted
model and returned HTTP 402. This is a regression from our own `JobForm.tsx` / draft-store
change, and it is the direct cause of at least one wasted run.

### B3 — Pipeline fails after transcription

Job reported `The clipping pipeline failed` *after* successful hosted transcription (about nine
Nemotron 3.5 requests in two minutes, apparently all successful). Failure is downstream of
transcription and the log excerpt available to us did not include the traceback. Needs a fresh
repro with the full log retained.

### B4 — Single speaker misclassified as `two_shot` (framing, blocking)

A one-person landscape interview was rendered as a stacked split: the frame cut the speaker
through the middle and stacked the two halves into a vertical clip. Root cause identified as
**classification, not rendering** — `layout_analyzer.py:9` documents
`two_shot → "two people side by side -> stacked split, one per panel"`, so a single speaker is
being assigned a two-person layout. Independent of the transcription backend: this survives the
move to cloud-only ASR and must be fixed on its own.

### B5 — Dead space above the subject in vertical output

A second clip framed the speaker correctly but left roughly the top half of the vertical frame
empty (a different, unoccupied part of the room). The `top peek` composition is choosing a crop
that does not track the subject.

### B6 — Clips selected on people who are not speaking, or out of frame

Some chosen clips feature a person who is off camera or not talking, and the peak-score clip
picks the wrong moment. Needs a concrete clip id and timecode before any change.

### B7 — Long transcript passages appear truncated

Long semantic chunks are cut. Never root-caused. Related open question: per-word confidence from
the local model was hard-coded to `1.0` and then discarded, so word-level quality signals were
never available to help here.

### Fixed during this session, for reference

- **Cache environment variable mismatch.** The app sent `BRIDGECLIP_SOURCE_CACHE`; pydantic read
  `SOURCE_CACHE_DIR`, so the cache directory silently fell back to default and nothing was ever
  written to `Y:\cache`. `Settings.source_cache_dir` now reads the correct variable; regression
  tests added.
- **Planner retried failures that could never succeed.** `_parse_clip_plan_response` ended with
  `except IntelligencePlanningError as e: e.retryable = True`, which overwrote the deliberately
  non-retryable flag. A reasoning model that spent its entire output budget and returned nothing
  was therefore retried up to three times, paying for the same empty answer each time. The flag is
  now set explicitly per raise site: malformed JSON stays retryable, an empty answer does not.
- **Reasoning models gave a useless error.** `finish_reason=length` with no content now reports
  which model, how many tokens were consumed, and what to change. `ModelPicker` warns about
  reasoning models *before* a billed attempt, using a new `supportsReasoning` flag parsed from
  the catalogue's `supported_parameters`.
- **HTTP 403 was misattributed to IPv6/VPN.** YouTube bot checks were reported as network
  failures. Now classified as `youtube_bot_check`.
- **Title card overlay removed** from all layout paths (channel banner retained).
- **Time shown as AM/PM** in three places; now 24-hour.

### Known cosmetic issue

React Fast Refresh warnings in dev: `Could not Fast Refresh ("EMPTY_TIKTOK" / "WIZARD_STEPS" /
"framingProblem" export is incompatible)`. Caused by modules exporting both components and
constants. Harmless at runtime. Fix by moving the constants into their own modules.

## 7. Deferred: recognising who should be framed

D2 removed diarization, so nothing currently tells the layout stage *who* is speaking. B4, B5
and B6 are all downstream of that missing signal.

Options worth evaluating when the backlog is picked up again, in rough order of effort:

1. **Face detection and tracking** (YOLO-family, or a lighter detector such as SCRFD /
   MediaPipe) on sampled frames, then associate detections with the active speaker. This is the
   natural fix for B5 and B6, and would let B4 be decided on evidence instead of a heuristic.
2. **Mouth-motion / audio-energy correlation** as a cheap active-speaker signal that needs no
   identity model at all.
3. **Cloud diarization** through OpenRouter, if a provider offers it, keeping the local runtime
   deleted.

Option 1 is the highest value and the only one that also improves peak-score selection. Do not
start it before B1–B4 are closed; the classifier fix in B4 is much cheaper and may remove the
most visible symptom on its own.

## 8. Cost record

Corrected measurement, because an earlier figure in this session was wrong. A regular expression
truncated scientific notation (`$9.45400e-05` was read as `$9.45`), producing a spurious
"$469 total". The real figures, summed from `usage.cost` reported by OpenRouter across all
engine logs:

| Model | Responses | Charged |
|-------|-----------|---------|
| `z-ai/glm-5.3-flash` | 113 | $0.0314 |
| `qwen/qwen3.8-flash` | 1 (failed) | $0.0170 |
| **Total** | **114** | **$0.0484** |

The single most expensive event was a failed planning attempt: 32,000 completion tokens, all of
them reasoning, zero usable output, 8.5 minutes wall clock, $0.017. There is no spending
problem. The lesson from that run was mechanical, not financial — do not retry a deterministic
failure, and warn before a reasoning model is chosen for planning.

## 9. Test baseline

Green at pause, on the uncommitted tree:

- Python: `545 passed, 3 skipped`
- Node: `test:main` 72, `test:renderer` 30, `test:zernio` 128, `test:bridge` 35, `test:release` 23
- `npm run typecheck`, `npm run lint`, `npm run build` all pass

Two planner tests were added for the retry fix and one existing test
(`test_empty_content_is_retryable`) asserted the *old, wrong* behaviour and was rewritten — see
`test_a_spent_output_budget_is_not_retried`.

## 10. Resuming

1. Read this file, then `docs/UPSTREAM_SYNC.md` for push policy.
2. Commit the current tree on a feature branch before touching anything, so the 45 pending
   entries are not lost. Do not push without owner approval.
3. B1 and B2 first — both are our own regressions and both waste real time and money per run.
4. B3 with a full log capture.
5. B4 on its own, then re-evaluate B5/B6 against the result.
6. Only then implement the D1/D2 code removal in section 5 and the branch model in section 2.
7. Rebase `ours/ui-overhaul` onto a fresh `upstream/main` and re-run the full section 9 matrix.
