# Task 1 Relocation Evidence

- Status: `DONE` (reconstructed canonical receipt)
- Recorded: 2026-09-25
- Canonical checkout: `Y:\ProjectsAI\bridgeclip`
- Rollback source: `D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip`
- Evidence provenance: the original dedicated Todo 1 artifact was not present in the canonical evidence directory; this receipt reconstructs only facts already recorded in the canonical start-work ledger and corroborated by the Todo 2/3 evidence.

## Copy operation

The recorded non-destructive copy command was:

```powershell
robocopy "D:\!!!\Documents\ChatGPT\LinkedIn\bridgeclip" "Y:\ProjectsAI\bridgeclip" /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /XJ
```

The recorded list-only follow-up found no outstanding files or bytes. No `/MIR`, source deletion, `git clean`, junction following, or source repair was used.

## Repository identity

The canonical ledger and Todo 2/3 evidence record matching source and target identity:

```text
Branch: main
HEAD: 6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5
origin: https://github.com/aMoonshine/bridgeclip.git
upstream: https://github.com/bridge-mind/bridgeclip.git
Target top-level: Y:/ProjectsAI/bridgeclip
```

The target contains its own `.git` directory and the project-local runtime/model directories. The D: checkout remains the rollback source.

## Artifact hash verification

The following source/target pairs were rechecked on 2026-09-25 with SHA-256:

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `engine-bin/models/nemotron-3.5-asr-streaming-0.6b.q8_0.gguf` | 742090464 | `3FC991D3BADAD7277C11030A7519832CDDAF2057AAFED6D4B25147E953A070B1` |
| `engine-bin/nemo-speech/bin/nemo-speech.exe` | 1261056 | `1E2110E2A39C789F0C3BD49EEA7898DFE62591D4DBEBB73F4CB549A5B516A8E5` |
| `engine-bin/ffmpeg.exe` | 135416832 | `2E00E43AEB1929D19763ED3CA1E226B3BC81CB50F6B0B04709F1EE504657E2C5` |

Each source and target pair had the same size and digest.

## Source preservation

Todo 2 and Todo 3 read-only checks recorded the D: source at the same HEAD, with clean tracked/index state and unchanged remotes. Later target-only runtime repair removed stale target caches and did not mutate the D: checkout.

## Limitations

- The original worker did not leave a dedicated `task-1-relocation.md`; this file is a transparent canonical receipt, not a claim that the missing raw worker log still exists.
- Detailed command-by-command relocation logs remain in `.omo/start-work/ledger.jsonl` and `.omo/evidence/bridgeclip-ssd-portable-ai/task-2-runtime.md`.
