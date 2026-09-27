# BridgeClip Codex ? experimental parallel application

## Start on this machine

Checkout: `Y:\AI\Codex\bridgeclip-codex\bridgeclip`
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
read-only sandbox, disabled shell/search, supplied JSON schema, and low reasoning
when the selected model supports it. Images are temporary local JPEGs. The
original Codex project's configuration, plugins and instructions are not copied.
The app discovers available models using model/list and requires a ChatGPT
account rather than API-key billing. Model errors do not select another model
or fall back to OpenRouter. Inference has a 180-second timeout, interrupts on
cancellation and closes the child process. Vision requests are serialized per
engine job. Multiple jobs still share the account's subscription limits.

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
