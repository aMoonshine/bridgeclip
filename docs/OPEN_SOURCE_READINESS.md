# Open-source readiness

## Current verified state

BridgeClip's desktop code, in-repo engine, fonts, tests, and locked Python dependencies are tracked in one repository. Large local runtimes, the Nemotron model, `node_modules\`, and virtual environments are not tracked.

- Canonical product checkout/remote: `Y:\ProjectsAI\bridgeclip` with `origin` = `aMoonshine/bridgeclip`
- Read-only upstream: `bridge-mind/bridgeclip`
- Current source baseline: `6407bf3b89e6d7c6f84e4c5d156adb9f17ac46d5`
- Current public-snapshot approval: **not established by this documentation baseline**
- Current manifest coverage: stale for the new durable documentation files and the tracked Windows launchers; export must fail until they are reviewed and added in the authorized manifest task

Do not treat the existence of the upstream repository, a release page, or a successful local build as proof that the current checkout is the reviewed public snapshot. `scripts/export-public-draft.sh` must produce a new directory from an exact reviewed manifest, and the exported bytes must pass all offline checks and secret scanning.

## Readiness gates

| Order | Gate | Current status | Required evidence |
| --- | --- | --- | --- |
| 1 | Canonical copy and rollback source | Complete | Todo 1 owner confirmation plus reconstructed `.omo/evidence/bridgeclip-ssd-portable-ai/task-1-relocation.md`, corroborated by `task-2-runtime.md` and `task-3-git-security.md`. |
| 2 | Project-local Windows runtime and clean launcher | Complete for development | `.omo/evidence/bridgeclip-ssd-portable-ai/task-2-runtime.md` |
| 3 | Full-history Git integrity and secret inventory | Complete | `.omo/evidence/bridgeclip-ssd-portable-ai/task-3-git-security.md` |
| 4 | Durable current/target documentation | Complete for baseline | `.omo/evidence/bridgeclip-ssd-portable-ai/task-4-docs-baseline.md` |
| 5 | Mandatory local GPU ASR | Blocked | Compiled CUDA/Vulkan doctor result and real fixture evidence from Todo 6 |
| 6 | Explicit provider/auth/model contract | Not implemented | Todo 7-10 offline evidence; no live paid/authenticated calls |
| 7 | Portable state and recovery | Not implemented | Todo 11-12 migration, restart, crash, and non-destructive clear-history evidence |
| 8 | Deterministic resources, manifest, notices, and packaging | Not complete | Todo 13 exact staging, model hash, manifest, Windows unpacked package, and notice checks |
| 9 | Security/egress/provider failure hardening | Not complete | Todo 14 secret, redirect, IPC, process-boundary, and mocked failure evidence |
| 10 | Reviewed public source snapshot | Blocked | Updated manifest, exact export, ownership/licensing review, full offline test/build/audit, and redacted secret scan |
| 11 | Signed/notarized release and clean-machine/update QA | Blocked | Final artifact hashes, signatures, updater metadata, and clean-machine records |

Windows distribution is not ready. The NSIS target in `electron-builder.yml` is configuration only and does not close GPU runtime, resource staging, installer, update, signing, or clean-machine gates.

## Public snapshot procedure

1. Finish and review behavior-changing tasks before final documentation synchronization.
2. Update the exact public-draft manifest only after reviewing every added source, test, and documentation file.
3. Export to a new path with `bash scripts/export-public-draft.sh /path/to/new-draft-directory`.
4. Review ownership and redistribution rights for source, branding, fonts, model assets, and bundled runtimes. Complete `THIRD_PARTY_NOTICES.md`; an MIT license alone does not establish third-party rights.
5. Run typecheck, lint, all offline tests, engine tests, build, packaging/resource checks, GPU fixture, provider mocks, migration/recovery tests, audits, and a redacted secret scan from the exact exported bytes.
6. Keep pre-existing development history and the D: rollback checkout out of any public snapshot and unchanged. Do not create a second repository or publish by changing repository visibility.
7. Publish only after explicit owner approval and all [release gates](RELEASING.md) pass.

## Maintenance after a public snapshot

| Priority | Area | Next change | Acceptance check |
| --- | --- | --- | --- |
| 1 | Provider and auth boundaries | Keep the versioned provider/model contract and main-process secret ownership aligned across TypeScript and Python. | Unknown providers, missing selected credentials, and arbitrary URLs fail before process launch. |
| 2 | Portable state | Version migrations and recovery records remain atomic, bounded, and non-destructive. | Restart/crash fixtures preserve recoverable metadata and output media. |
| 3 | Supply chain | Refresh pinned runtimes, model hashes, manifests, inventories, and notices. | The exact source snapshot and artifacts match recorded hashes and licenses. |
| 4 | Process boundaries | Keep cancellation, malformed-message handling, and child cleanup focused and tested. | Cancellation and failure fixtures leave no stale process or partial output accepted as complete. |
| 5 | Documentation | Update current behavior only after acceptance evidence exists. | Planned features remain labeled planned; historical reports remain historical. |

The [project status](PROJECT_STATUS.md) is the current source of truth. The September 2026 [security review](SECURITY_REVIEW_2026-09-24.md) and [follow-up](SECURITY_FOLLOWUP_2026-09-24.md) are historical records, not current readiness approval.
