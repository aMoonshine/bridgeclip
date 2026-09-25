<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="resources/bridgeclip-logo.svg" />
    <img src="resources/bridgeclip-logo-light.svg" alt="BridgeClip" height="56" />
  </picture>
</p>

<h3 align="center">Turn long videos into captioned short-form clips, on your own computer.</h3>

<p align="center">
  An open-source AI clipping app from <a href="https://www.bridgemind.ai">BridgeMind</a>.
  Drop in a podcast, stream, YouTube link or Twitch VOD link, and BridgeClip finds the strongest moments,
  cuts them to 9:16 or 16:9, and burns in word-by-word captions.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://github.com/bridge-mind/bridgeclip/releases"><img src="https://img.shields.io/badge/GitHub-v/release/bridge-mind/bridgeclip?label=download" alt="Latest release" /></a>
  <a href="https://www.bridgemind.ai/discord"><img src="https://img.shields.io/badge/Discord-builders-5865F2?logo=discord&logoColor=white" alt="Discord" /></a>
</p>

---

## Why BridgeClip?

- **Runs on your computer.** The current source checkout transcribes locally with NVIDIA Nemotron and calls OpenRouter for GLM clip planning, optional frame analysis, and AI metadata. The bundled NeMo runtime runs on the GPU through Vulkan.
- **Explicit provider costs.** Local GPU transcription has no API charge. Current OpenRouter requests bill the user's OpenRouter account. Codex/ChatGPT-plan access is planned, not implemented, and is not covered by an OpenAI API key.
- **Captions that look native.** Nine styles (Viral, Hormozi, Bold, Clean, Minimal, Fire, Glow, Neon, Karaoke), each with a live preview before you render.
- **MIT licensed.** Fork it, change it, ship it.

## How it works

```
 Source video ──▶ Download ──▶ Transcribe ──▶ Find moments ──▶ Render
 (file or link)    yt-dlp      Local Nemotron    GLM 5.3 Flash     FFmpeg
                               (local, GPU)      via OpenRouter    crop, captions
```

Every run gets its own folder. The **Library** shows completed clips with virality scores, timecodes and tags. **Jobs** shows what is running or queued right now and earlier runs. Completed runs open their clips, and some failed runs can run again. You can optionally connect social accounts through Zernio to publish or schedule a selected clip.

## Download and release status

No macOS or Windows release is approved by this documentation baseline. macOS packaging configuration exists but still requires release qualification. The canonical Windows source checkout is verified for development startup; Windows installer, updater, GPU-runtime, and portable-state readiness are not complete. Use the development setup below until the release gates pass.

The current desktop flow requires an OpenRouter key because clip planning is hardcoded to OpenRouter GLM. Codex login and provider/model selectors are planned and are not current UI features.

| Current provider | Used for | Get a key |
| --- | --- | --- |
| OpenRouter | GLM clip selection, optional frame analysis, and AI metadata | [openrouter.ai](https://openrouter.ai/keys) |

OpenRouter and Zernio keys are encrypted with Electron secure storage. If secure storage is unavailable, BridgeClip asks you to configure or unlock it before saving keys. ElevenLabs is not a current provider.

### What leaves your computer

For a link, the app downloads the source using your network connection. With the current default backend, audio transcription and the resulting transcript stay on the computer. Transcript text for clip planning and sampled frames for optional visual analysis go to OpenRouter. If speech is unavailable, sampled frames can be used for visual-only OpenRouter planning, but those clips have no speech captions.

The engine retains an optional `TRANSCRIPTION_BACKEND=openrouter` implementation. It is not exposed in the current provider UI; when explicitly selected outside that UI, it sends audio to OpenRouter and can incur charges. It is not a silent fallback from local ASR.

If you connect social accounts, BridgeClip sends your Zernio API key to Zernio and receives account/profile metadata; platform sign-in occurs in your browser. When you choose **Post** or **Schedule**, BridgeClip uploads that clip to Zernio's media storage and sends its caption, selected accounts and publishing options to Zernio. Provider accounts, charges, retention and data policies are governed by those services.

### Current local state

Downloads and intermediate media are held in a private `work/` directory under Electron's per-user application-data folder. Settings, logs, thumbnails, automation state, account caches, and posting history also remain there. Rendered clips, transcripts, plans, and `job_output.json` remain in the selected output folder.

A versioned project-local `data\` root, portable drafts, recent projects, crash recovery, and non-destructive history clearing are planned but not implemented. The future portable tree must not contain API keys, raw ChatGPT/Codex tokens, cookies, `auth.json`, or exported Keyring material.

Only download or clip material you have permission to use. Remote sites may limit downloads or change their access rules.

### Clip a Twitch VOD

Paste a public, completed Twitch video link such as `https://www.twitch.tv/videos/1234567890` into Create, then choose your clip settings and generate. BridgeClip downloads the saved video and uses the same transcription, AI moment selection and rendering flow as other sources. Links on `twitch.tv`, `www.twitch.tv`, `m.twitch.tv` and `go.twitch.tv` are accepted and normalized to the canonical video URL.

Live channels, Twitch clips, collections, subscriber-only videos and deleted or expired VODs are not supported. No Twitch login or cookies are used. The original source must be at most six hours and 20 GB. BridgeClip downloads the full source before applying the optional start and end times. Downloads also stop after four hours or when less than 1 GB of free space would remain.

## Develop

### Canonical Windows source checkout

The canonical working checkout is `Y:\ProjectsAI\bridgeclip`. There is no second rollback checkout: the former `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip` was removed, so recovery goes through `origin` = `aMoonshine/bridgeclip`. Start the canonical checkout with `start-windows.cmd`.

The launcher uses project-local Node.js, Python, FFmpeg/ffprobe, yt-dlp, NeMo-Speech.cpp, and the existing model under `engine-bin\`. The engine defaults to local Nemotron transcription, and the installed NeMo bundle reports a compiled Vulkan backend, so inference runs on the GPU. `TRANSCRIPTION_DEVICE` can pin a device; `auto` is the default. Clip planning and optional layout vision remain hardcoded to `z-ai/glm-5.3-flash` through OpenRouter. There is no current Codex adapter or provider/model picker.

The large runtime files, model, `node_modules\`, and Python virtual environment are excluded from Git. Recreate the venv at the canonical path. See [Portable Windows](docs/PORTABLE_WINDOWS.md) for exact recreation, system-check, and rollback commands.

**For a fresh source checkout on another machine:** Node.js 22, Python 3.12, FFmpeg with the libass-backed `ass` filter, NeMo-Speech.cpp, and the Nemotron GGUF model are required. The current source does not make an incomplete local bundle GPU-complete. GPU acceptance requires a separately verified CUDA/Vulkan runtime and real local fixture.

```bash
git clone https://github.com/aMoonshine/bridgeclip
cd bridgeclip
python3.12 -m venv engine/.venv
engine/.venv/bin/pip install --require-hashes -r engine/requirements.lock
npm ci
npm run dev
```

BridgeClip finds its in-repo engine and virtual environment automatically. **Settings → System check** shows Python, yt-dlp, FFmpeg, and engine checks. Use the project-local launcher for the canonical Windows checkout.

On Linux, use system FFmpeg with the libass-backed `ass` filter and Python 3.12. Linux development and tests are supported, but a self-contained Linux package is not available.

Do not publish a release from the current checkout. Resource staging, GPU runtime, manifest coverage, portable data, packaging, and final offline QA remain release blockers. See [Project status](docs/PROJECT_STATUS.md) and [Releasing](docs/RELEASING.md).

### Running behind a VPN

BridgeClip accepts a source URL when the host resolves to at least one publicly routable address, and it prefers IPv4 whenever a name publishes both address families. Downloads pin to a validated address instead of trusting the first DNS answer.

This matters on VPN and split-tunnel setups. A tunnel profile that assigns a ULA IPv6 address (`fd…`) and still routes `::/0` leaves the machine with a default IPv6 route that cannot reach anything, while DNS keeps handing out perfectly valid-looking AAAA records. Requests then stall on the unreachable family instead of failing over. To avoid that, remove the IPv6 address and the `::/0` route from the profile, and keep only the IPv4 DNS server:

```ini
[Interface]
Address = 10.8.0.7/24
DNS = 1.1.1.1

[Peer]
AllowedIPs = 0.0.0.0/0
```

Keep `*.conf` untracked; the repository ignores it because a WireGuard profile contains `PrivateKey` and `PresharedKey`.

If a download still fails, BridgeClip checks whether the host advertises IPv6 that this machine cannot reach and reports that specifically instead of a generic "video could not be downloaded".

### First run and troubleshooting

1. Add your OpenRouter key in the setup card. A saved key is never shown again; paste a new one to replace it or choose **Remove key** in Settings.
2. Run **Settings → System check**. This should report the Vulkan GPU alongside the CPU.
3. Choose a local video or public video link, select clip settings, and start the job. Optional AI vision can add OpenRouter cost.
4. If a run fails, use the in-app error and System check first. Logs intentionally omit raw provider responses and private source details.

| Script | What it does |
| --- | --- |
| `npm run dev` | Run the app with hot reload |
| `npm run typecheck` | Type-check the main process and renderer |
| `npm run lint` | Check TypeScript and JavaScript source with ESLint |
| `npm run build` | Production build into `out/` |
| `npm run test:bridge` | Run Python bridge regression tests |
| `engine/.venv/bin/python -m pytest -q engine/tests` | Run the clipping engine tests after installing pytest |
| `npm run test:release` | Check release metadata and staging regressions |
| `npm run test:renderer` | Check renderer state and parsing regressions |
| `npm run test:main` | Check desktop security and pipeline regressions |
| `npm run test:zernio` | Check social account, upload and posting flows against local mocks |
| `npm run dist:mac` | Package the current Mac architecture; signing credentials are required |
| `npm run dist:win` | Create a Windows package; not release-approved at this baseline |
| `npm run icons` | Regenerate the app icon from `scripts/icon/` (macOS) |

### Project layout

```
src/main/        Electron main process: settings, pipeline runner, IPC, optional Zernio posting
src/preload/     The typed window.bridgeclip API exposed to the renderer
src/renderer/    React UI (Create, Library, Jobs, Accounts, Automations, Settings)
src/shared/      Product constants shared by main and renderer
bridge/          Python worker protocol and network guard
engine/          BridgeClip clipping engine, assets, locked Python dependencies, and tests
engine-bin/      Ignored project-local Node, Python, FFmpeg, NeMo, and model files
scripts/icon/    Icon and logo generators
```

## Documentation

| Document | Purpose |
| --- | --- |
| [Project status](docs/PROJECT_STATUS.md) | Verified Todos, active work, owner decisions, and remaining gates |
| [Architecture](docs/ARCHITECTURE.md) | Current desktop/engine data flow and target boundaries |
| [Transcription](docs/transcription.md) | Local CPU status, optional remote path, and mandatory GPU acceptance |
| [Portable Windows](docs/PORTABLE_WINDOWS.md) | Canonical paths, venv recreation, system checks, and rollback |
| [Providers](docs/PROVIDERS.md) | Local ASR, OpenRouter, and planned Codex/ChatGPT-plan boundaries |
| [Upstream sync](docs/UPSTREAM_SYNC.md) | Feature/sync branch and origin/upstream workflow |
| [Automation metadata](docs/automation-metadata.md) | Current local-ASR-to-OpenRouter metadata flow and platform guidance |
| [Releasing](docs/RELEASING.md) | Blocked release gates and publication order |
| [Open-source readiness](docs/OPEN_SOURCE_READINESS.md) | Public snapshot, manifest, packaging, and maintenance gates |
| [Security policy](SECURITY.md) | Current reporting and secret-handling policy |

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, review expectations and checks. Security reports should follow [SECURITY.md](SECURITY.md), not a public issue. The community guidelines are in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © BridgeMind
