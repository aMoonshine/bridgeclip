# BridgeClip Codex ? experimental parallel application

## Start on this machine

Checkout: `Y:\ProjectsAI\bridgeclip-codex`
Branch: `codex/codex-provider`, based on dynamic framing commit `b339988`.
Run `start-codex-windows.cmd`. It builds the UI and opens a separate Electron app.

- Profile and logs: `%APPDATA%\BridgeClip Codex`.
- Output on this machine: `C:\Users\sanma\BridgeClip Codex`.
- Existing source and transcript cache on this machine: `Y:\cache\bridge`.
- Settings > Codex connection > Check connection lists account models.
- Default: `gpt-6-luna`. Quality uses it for planning and Vision; Economy
  uses it for planning and keeps Vision off. Advanced explicitly uses OpenRouter.
- Enter an OpenRouter key once in Settings for Whisper transcription. Keys
  encrypted by the original Chromium profile cannot simply be copied to this
  one. The original profile and keys are never rewritten.
- A fresh app copies non-secret settings once, with a separate output folder.
  Existing Codex file authentication is seeded into a dedicated Codex profile
  once when available; otherwise Sign in with ChatGPT opens Codex's official
  browser login. No Codex credentials are returned to the renderer.

The original `Y:\ProjectsAI\bridgeclip` checkout remains on
`codex/dynamic-framing`. Both apps can run concurrently, with separate work
folders, history and single-instance locks. The source cache is shared: avoid
manually deleting sources while either app is processing them.

The Node dependencies are physically copied, with no junctions. The launcher
reads Python/FFmpeg/Node runtimes from the original checkout by default;
`-RuntimeRoot <path>` or `BRIDGECLIP_RUNTIME_ROOT` selects another installation.
Do not remove that runtime installation while this launcher uses it. This is a
local development build, not a standalone packaged installer.

## Integration and failure behavior

`codex_provider.py` speaks JSON lines to an owned `codex app-server --stdio`
process. Each inference gets an ephemeral thread, an isolated temporary cwd,
read-only sandbox, disabled shell/search, supplied JSON schema, and the selected reasoning level (Low by default). Images are temporary local JPEGs. The
original Codex project's configuration, plugins and instructions are not copied.
The app discovers available models using model/list and requires a ChatGPT
account rather than API-key billing. Model errors do not select another model
or fall back to OpenRouter. Inference has a 180-second timeout, interrupts on
cancellation and closes the child process. Up to two analysis requests overlap per engine job. Multiple jobs still share the account's subscription limits.

Subscription usage is not an OpenRouter dollar charge: Codex planning records
provider=codex and zero additional API cost. This does not mean unlimited usage
or include the price of the subscription. Word-timed transcription continues
through existing Whisper/cache code. Runtime failure displays codex.unavailable
with a connection/model/limits hint; other clips may finish if a run is partial.

## Verification ? 2026-09-27

- 94 Python tests passed: adapter transport, timeout, cancellation, malformed
  results, model availability, no OpenRouter fallback, layout and planner.
- 19 bridge tests and 39 subtests passed.
- 11 settings tests and 15 create-form tests passed; Electron UI test passed for connection display,
  model filtering, selection and persistence; TypeScript typecheck and build passed.
- Real ChatGPT-authenticated model/list included GPT-6 Luna with image support.
- A live structured text request returned the expected interval.
- The real BridgeClip planner selected one clip at 1381850?1425770ms from a
  cached transcript. Provider metadata correctly reported codex / gpt-6-luna.
- Luna classified a close-up as talking_head and a wide shot as two_shot.
- All seven shots of the problematic 62.42-second source window were analyzed
  with Luna and rendered into `.pytest_cache/codex-preview/preview.mp4`.
  Wide shots now receive two people, but visible crop errors remain in some
  panels. Integrating another model does not by itself solve all geometry errors.
- Actual app launch verified its separate profile, successful Codex connection,
  all required runtime tools and unchanged original settings file hash.
- No new Whisper charge or YouTube download was made. A full job from the UI
  with a newly entered OpenRouter key has not been run. Browser sign-in is
  implemented; live testing used existing auth rather than repeating login.

Official protocol references checked during implementation:
https://learn.chatgpt.com/docs/app-server
https://learn.chatgpt.com/docs/auth
The installed CLI JSON schema was also used to validate parameter names.

## Location correction

The Codex edition is now a standalone clone under `Y:\ProjectsAI\bridgeclip-codex`,
with its own `.git` directory and physically copied Node dependencies. It is not
a managed Codex worktree. The application launches without the Codex desktop UI;
its model requests still use the installed Codex executable and ChatGPT login.


## Model controls, faster shot checks and output folders (2026-09-27)

Quality/Economy now show the selected Codex model and reasoning next to the
clipping mode, with selectors populated from model/list. Default stays Luna / Low.
The catalog currently offers no None/Instant level for Luna. The chosen model
and effort are captured when a job is queued and forwarded to planning and Vision.
Existing queued jobs are not reconfigured by changing Settings.

Codex Quality uses the existing cut detector and YuNet face tracks. A persistent
single large face (every sample has exactly one face, height >=22%, one track)
can use local framing. Other shots retain Vision, in labelled batches of up to
six separate images. Coordinates are relative to each image, not a collage.
Every reply must contain all frame IDs exactly once. Shot boundaries and local
tracking remain per shot. Two requests may overlap; each clip begins encoding
when its own layout is ready. General semantic correctness is not guaranteed:
a large face within screen content can still fool the local shortcut, and the
heuristics for small corner faces remain imperfect. Economy remains local only.

The finished 28-clip run a46a8001-99e2-439c-b826-565a320c282a took 1587.169s:
planning 49.306s, rendering stage 1537.635s. The saved layout metrics contain 197 shots;
individual encoding completions followed layout completion by roughly 6-23s in
sampled log entries. Thus 27 minutes was not pure FFmpeg encoding time.
The speed chip now says playback speed: 1.5x controls video/audio playback.

Changing the output folder retains earlier user-selected libraries for history,
thumbnails, playback and export. Arbitrary outside files are still rejected.
An Electron regression reproduced HTTP403 after folder change, then passed with
the fix. The actual clip_00.mp4 was opened through Electron (1080x1920,11.608s)
and its thumbnail was generated. Existing MP4s do not need rerendering.

Account status no longer forces a token refresh for every inference. During
this investigation ordinary account/read and login status saw the ChatGPT login,
while refreshToken=true returned null. Inference succeeds with the ordinary read.

### Small Vision comparison, not a model ranking

Same two 640x360 JPEGs and production single-frame prompt; one call per setting:

| Model / reasoning | Close-up seconds | Wide shot seconds | Observation |
|---|---:|---:|---|
| Luna Low | 4.596 | 5.665 | Correct layout/count on both |
| Luna High | 11.065 | 7.444 | Correct layout/count on both |
| Sol Low | 7.303 | 4.947 | Wide-shot boxes returned in pixels, violating 0-1000 instructions |
| Sol High | 7.057 | 8.994 | Correct layout/count on both |

All eight classified the correct number of people; box precision varied.
This is too small to conclude equal quality or compare clip-selection quality.
Keep Luna Low as the practical default; High/Sol remain selectable for comparison.
Reproduce with scripts/benchmark-codex.py, PYTHONPATH=engine and the app's
BRIDGECLIP_CODEX_HOME; the script requires local JPEGs and an output JSON path.

Local YuNet inference on four real JPEGs took 12-23ms/image and returned correct
face counts. Cached detections across the 62.42s example found both faces even
on wide shots that the heuristic mislabeled talking_head: one face was treated
as a corner webcam. Replacing the detector would not fix that classifier error.
The hybrid check used local tracking for 3 close-ups and one batched request for
4 uncertain shots. Analysis of the cached samples took 9.217s, all 7 intervals
were retained. This excludes initial video decoding and is not a full-run speed
benchmark. A separate four-image batch took 8.907s with correct layout/count.


A control render of the 62.42s interval completed in 29.9s (cached detection,
new Luna batch and FFmpeg; no captions, no pacing cuts). Output was 1080x1920,
62.42s, all 7 shot intervals, render_fallback=null. This is not directly comparable
to the 28-clip full run: captions, source decoding and clip distribution differ.


Raw single-image comparison responses and token counts:
[evidence/codex-vision-2026-09-27.json](evidence/codex-vision-2026-09-27.json).
Validation for this update: 76 layout/transport Python tests; 52 settings, form
and security tests; Electron model/reasoning and Advanced-mode flows; Electron
media access across output-folder change. TypeScript checks and build passed.


## Login persistence and ongoing development

The user accepted the improved dynamic framing on 2026-09-27. Commit `8ff370c`
is the tested framing baseline, preserved as `codex-framing-2026-09-27`.
The independent checkout remains `Y:\ProjectsAI\bridgeclip-codex`, on
`codex/codex-provider`; the launcher and separate profile remain the entry points.

The reported repeated login was reproduced as an interface/control-flow bug:
Settings did not check saved login on mount, and the login action always started
OAuth even for an authenticated account. Three fresh real App Server processes
all recognized the same saved session without a browser. Settings now checks
on mount, only offers sign-in after a confirmed logged-out result, and keeps
connection errors distinct from being logged out. The login action first reads
the saved account and returns it immediately when already authenticated.
Credentials remain in the dedicated app profile, outside the repository. No
application can promise an indefinite session after server revocation/expiry;
this fix removes the unnecessary login on ordinary reopen.

Upstream updates use the process in FORK_DECISIONS_AND_BACKLOG.md section 2:
snapshot the accepted overlay, fetch upstream, rebase on a candidate branch,
resolve conflicts, test the app-specific seams, then adopt the tested candidate.
Do not rewrite the working checkout while a clip job is using its engine files.
