# Fork decisions, changes and backlog

Authoritative handover document for the work carried out on top of `bridge-mind/bridgeclip`.
Written 2026-09-26 at a deliberate pause in development. Everything below is a record of
what was decided, what was built, what was fixed, and what is still broken.

Resumed 2026-09-26 on `ours/ui-overhaul`: the 48-file working tree was saved in local commit
`27fd4da`. B1-B3 were fixed there. Current integration work is on `ours/upstream-overlay`, based
on upstream v0.1.18, with `ours/ui-overhaul` preserved as the rollback point.

If this file and another document disagree, this file wins for fork-specific decisions and
`docs/UPSTREAM_SYNC.md` wins for remote and push policy.

## 1. Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Use cloud transcription only.** Remove local ASR models and their runtime path. | The local path added model downloads, setup, and maintenance. OpenRouter transcription is inexpensive for the observed workload; the measured run cost was about $0.0484. |
| D2 | **Do not add local diarization.** | Speaker labels are not currently consumed by framing. Revisit speaker-aware framing only if two-person crop work shows that visual tracking alone is insufficient. |
| D3 | **No direct OpenAI OAuth.** | Owner decision. OpenAI models remain reachable through OpenRouter. |
| D4 | **Keep the small user-facing overlay.** Reusable source-video cache and folder picker, download-resolution cap, output-folder control, optional OpenRouter model selection, render concurrency, 24-hour time, and title-card removal. Drop local ASR/diarization and GPU encoder selection. | Owner releases are the product baseline. Carry only controls and workflow improvements that remain useful alongside upstream. |
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

The current application branch is `ours/upstream-overlay`, based on upstream
v0.1.18. `ours/ui-overhaul` is the preserved rollback branch, not the active
application branch. Our changes are saved as commits above the upstream base.

Local `main` mirrors the fetched upstream base. The previous main is preserved
as `codex/archive-main-2026-09-26`; remote `origin/main` still has legacy fork
history and must not be force-pushed.

For each upstream update, create a new `codex/overlay-<version>` branch from the
current overlay, rebase its fork commits onto the new upstream SHA, review the
range-diff and test it. Publish the new branch normally and retain the previous
published overlay for rollback. Published history is never rewritten. Verified
builds can receive immutable tags; no separate `ours/release` branch is needed yet.

See `docs/UPSTREAM_SYNC.md` for the exact update and feature-verification procedure.

**Known cost of this model:** because of D6, upstream fixes never come back automatically. Review
upstream changes to framing and rendering when rebasing B4, and keep the local crop fix only if
the upstream implementation does not resolve the observed case.

### Upstream review, 2026-09-26

Fetched `upstream/main` at `f6c7226` (v0.1.18), four commits beyond the overlay base. The new
product feature is background app updates (#49), with a Settings check, update state in the
sidebar, safer restart behavior during jobs, and platform-aware release-feed selection. The
following commits fix macOS bundle-path handling and update release documentation. Upstream has
also removed the local ASR path and the fork's GPU encoder option. Its branch removes the source
cache and video settings too, so the overlay restores the selected cache, folder, resolution, and
concurrency features, plus existing output-folder control and optional model choices.

## 3. Repository state

- Canonical checkout: `Y:\ProjectsAI\bridgeclip`
- `origin` = `aMoonshine/bridgeclip`, `upstream` = `bridge-mind/bridgeclip`
- Original overlay: `ours/ui-overhaul` at `ce653d5`, based on the preserved local snapshot.
- Integration branch: `ours/upstream-overlay`, based on `upstream/main` `f6c7226` (v0.1.18),
  with the snapshot and B1-B3 fix commits replayed. Selective feature restoration is in progress.
- Integration edits are being saved in thematic commits for publication to `origin`;
  Git refs are the authority for the current local and remote checkpoint.
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
- `src/renderer/components/VideoSettings.tsx` — download resolution and render concurrency.
- `docs/video-performance.md` — current download, cache, and software-rendering settings.

Modified behaviour:

- `video_downloader.py` — `DOWNLOAD_RESOLUTION` ladder (`source`/`2160`/`1440`/`1080`/`720`),
  cache lookup before download, accurate HTTP 403 classification.
- `config.py` — the new video settings and the source-cache settings.
- `rendering_service.py`, `layout_renderer.py`, `ai_clipping_pipeline.py` — title card removed;
  software encoding remains the render path.
- `bridge_runner.py` — accepts transcription model fields in **every** clipping mode, not only
  Advanced.
- `JobForm.tsx`, `use-draft-store.ts`, `ModelPicker.tsx`, `openrouter-models.ts` — optional
  OpenRouter model choices in every mode, persisted selection, reasoning-model warning.
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

## 6. Bug status

Ordered by how much they block the owner. B1-B3 are fixed in the current working tree;
B4-B7 remain open.

### B1 — Download resolution is ignored (fixed locally)

`Settings → Video → Download` is set to Full HD (1080p), but the pipeline still downloaded 4K
(observed 2.6 GB for a 39-minute video, and a 4K file on a later run). The setting reaches
`Settings`, but the format selection in `video_downloader.py` does not constrain the chosen
stream. Until fixed, every run pays full bandwidth and disk for 4K. This is our regression, not
an upstream defect. The saved 2026-09-26 log for job `4e0f36d4` shows a fresh 1080p-capped
selection produced 720p, so the yt-dlp selector itself did apply the ceiling there. The
confirmed hole was the source cache: its lookup used the requested height as a *minimum*, so a
cached 4K file was returned before a capped download. The cache now rejects entries above the
ceiling; Twitch downloads also apply the ceiling. Offline yt-dlp and cache integration tests
cover both paths. The earlier 2.6 GB observation has no saved format trace, so its exact path
cannot be reconstructed.

### B2 — Model pickers are stuck and cannot be changed (fixed locally)

After selecting an OpenRouter model in Advanced, the model fields stay populated when switching
between Advanced / default modes. Other models cannot be chosen, including the local option. The
stale value is still sent to the engine, which is how a previous run was forced onto a hosted
model and returned HTTP 402. This is a regression from our own `JobForm.tsx` / draft-store
change, and it is the direct cause of at least one wasted run. The owner chose to reset model
overrides when the clipping mode changes. The draft store now clears both fields on that
transition, and each picker has a `Use mode default` action. An Electron E2E test changed a
model, switched modes, verified empty overrides, selected fresh models, and checked the final
request. This does not prove why the original picker interaction felt stuck, but it removes the
confirmed stale-model submission path.

### B3 — Pipeline fails after transcription (diagnosed and fixed locally)

Job reported `The clipping pipeline failed` *after* successful hosted transcription (about nine
Nemotron 3.5 requests in two minutes, apparently all successful). Failure is downstream of
transcription and the log excerpt available to us did not include the traceback. The full saved
engine log for job `861ee45e-a912-426b-a2ed-fbc961bcd9d8` was found under the app's
`logs/engine` directory. It records nine successful transcription requests, 308 transcript
segments, then a planning request for `openai/gpt-6-luna` rejected by OpenRouter with HTTP 404.
The exception was handled, so there is no traceback. The failure was a planner model rejection,
not a transcription or rendering failure. HTTP status now survives the planner wrapper and maps
to `planning.model_unavailable` with an actionable UI message. An offline 404 test covers the
provider-to-bridge error path. No paid repro was needed.

### B4 — Two-shot panels crop people at the frame edges (framing, open)

The owner clarified the expected Auto behavior: when two people are in frame, show one in the
upper panel and one in the lower panel, with each person centered and their face kept whole. A
saved source frame confirms two actual people, so that example does not support the earlier
claim that `two_shot` classification itself was wrong. The failure to solve is the positioning
and crop quality.

Before the overlay, the pipeline requested person rectangles from the vision model but converted
any returned rectangles into estimated face boxes. When local face tracking found two people, its
face boxes replaced those estimates. The renderer sized each crop from a face and constrained it
to that face's side of the source. This could explain the clipping, but is not a proven root cause.

The saved results contain 63 vision-classified `two_shot` summaries across five jobs, each with
two final face boxes. They do not contain the provider's raw `people` field. The engine logs also
show only final layout summaries. Therefore we have **not verified** whether the model returned
two person rectangles for the failing video.

The integration branch now requests full visible person rectangles, preserves two valid returned
boxes, and uses them to center the stacked panels. If boxes are missing, it falls back to the old
face crop. This path is unverified until a real response and matching source/output frames are
inspected. Only then can we decide whether a separate detector such as YOLO is needed.

### B5 — Dead space above the subject in vertical output

A second clip framed the speaker correctly but left roughly the top half of the vertical frame
empty (a different, unoccupied part of the room). The `top peek` composition is choosing a crop
that does not track the subject.

### B6 — Clips selected on people who are not speaking, or out of frame

Some chosen clips feature a person who is off camera or not talking, and the peak-score clip
picks the wrong moment. Needs a concrete clip id and timecode before any change.

### B7 — Long transcript passages appear truncated

Long semantic chunks are cut. Never root-caused. Word-level confidence is not currently part of
the hosted transcription contract, so it cannot guide chunk reconstruction.

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

## 7. Framing versus speaker identity

B4 does not need diarization. The requested behavior is visual: detect two people, keep their
left-to-right ordering stable, and place one fully visible person in each stacked panel. The
vision request asks for person rectangles; local YuNet detects and tracks faces. The actual
provider rectangles from earlier jobs were not retained. Verify the new crop path against a real
response and the failing video before choosing another detection model.

B5/B6 may need an active-speaker signal because they concern who is talking or should be selected.
Evaluate mouth-motion against audio energy before adding cloud diarization or another local model.

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

## 9. Verification status

Previously green on the pre-integration tree:

- Python: `545 passed, 3 skipped`
- Node: `test:main` 72, `test:renderer` 30, `test:zernio` 128, `test:bridge` 35, `test:release` 23
- `npm run typecheck`, `npm run lint`, `npm run build` all pass

Two planner tests were added for the retry fix and one existing test
(`test_empty_content_is_retryable`) asserted the *old, wrong* behaviour and was rewritten — see
`test_a_spent_output_budget_is_not_retried`.

For `ours/upstream-overlay`, TypeScript typecheck passes and the edited Python modules compile.
Automated tests have not been run on this integration branch.

## 10. Resuming

1. Read this file, then `docs/UPSTREAM_SYNC.md` for push policy.
2. `ours/ui-overhaul` at `ce653d5` preserves the prior overlay. `ours/upstream-overlay` is based
   on upstream v0.1.18 and contains replayed preservation and B1-B3 fix commits.
3. Cache, folder, resolution, concurrency, optional cloud model selection, and workflow settings
   are being restored selectively. Local ASR and GPU encoding are excluded.
4. Current integration edits are uncommitted. B4 remains open: confirm that a real vision response
   includes two usable person rectangles, then compare the new output with the same source clip.
5. GitHub issue #54 and its remote feature branch still describe local GPU transcription. Decide
   separately whether to close or rewrite them; no GitHub change has been made.
6. Finish review and requested verification before any push. Do not push without owner approval.


### Source-cache reuse fix (2026-09-26)

Confirmed both saved sources in `Y:/cache/bridge`. The downloader previously
requested YouTube metadata before checking the cache, so a bot challenge could
prevent reuse even at the same resolution. It now checks the cache first and
reads duration, dimensions and FPS with local ffprobe. A cached 2160p source is
also reused when 1080p is selected; the download ceiling applies to new downloads.
A cached source below the requested resolution still triggers a new download.
Verified: 23 source-cache tests pass. Real cached files were reused with YouTube
metadata requests explicitly forbidden: 2160p at selections 1080/2160, and 720p
at selection 720. No full transcription/render run was performed for this fix.


### Quality model preset (2026-09-26)

Quality defaults to `qwen/qwen3.8-flash` for clip planning and layout vision,
with low reasoning effort and no automatic model fallback. Economy keeps GLM
5.3 Flash planning (medium effort) and no layout vision. Enable Quality's AI
vision toggle with Smart framing and 9:16. Explicit planner selections override
the preset. Quality transcription remains MAI Transcribe 2. Image input and
structured output: https://openrouter.ai/qwen/qwen3.8-flash . Actual composition
quality with this preset remains unverified; replacement alone is not a framing fix.


### Transcript reuse and revised Quality preset (2026-09-26)

Supersedes the Qwen Quality preset above. Real run `efdc118c-1857-448a-820d-ef9458afe9b5`
spent all 32,000 completion tokens on reasoning at low effort, returned no plan,
and cost $0.01842925 for planning. Quality now uses GLM 5.3 Flash (medium) for
planning and Gemini 3.8 Flash (low) for the separate image layout checks, without
model fallbacks. Explicit planner selections still override the default. Economy
continues to disable layout vision. A spent output budget now has failure code
`planning.output_budget` and a specific UI explanation.

Completed, word-timed transcripts are saved atomically in `<source-folder>/transcripts/`
immediately after transcription, before planning. Reuse skips audio extraction and
provider calls and adds no transcription API cost to the new run. Cache identity
includes source path, size and modification time, language, translation, vocabulary
and selected time range. Mode/planner/transcription-model changes alone reuse the
saved transcript intentionally. Changing the source or those transcription options
creates a new entry. Partial transcripts cannot satisfy a full-source request.
Corrupt/missing cache entries fall back to transcription; write failures do not
fail an otherwise successful run. Deleting the transcripts subfolder forces fresh
transcription. Source-cache video deletion does not currently remove transcript
entries; clearing the whole source folder removes both.

Recovered the 657-segment transcript from the failed run into `Y:/cache/bridge/transcripts`
for the full cached `wiwCiRabml0` source with default language and empty vocabulary.
Original model provenance was unavailable in the artifact and is labelled unknown.
Verified its reuse via the real transcription entry point with audio extraction and
provider calls forbidden. 106 scoped tests plus 39 subtests and TypeScript checks
passed. No new paid provider call or full render was made for this change.


### Vision preset correction (2026-09-27)

Quality uses GLM 5.3 Flash for planning and Qwen3.8 Flash for image layout checks.
The Gemini substitution was not the requested solution and has been reverted.
OpenRouter's live model catalog reports Qwen reasoning as optional and enabled
by default. Vision now explicitly sends `reasoning: {enabled: false}` with the
existing 4,000-token output limit; `low` and `exclude` do not disable reasoning.
No model fallbacks. Request construction is tested offline; actual provider
compliance and composition quality still require a real visual run.
