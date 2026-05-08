# Phase 00: Feasibility Security and Distribution Gates

## Context Links

- [Zed extension constraints report](./reports/researcher-001-zed-extension-architecture.md)
- [Red team review](./reports/red-team-review.md)
- [Research synthesis](./research/research-synthesis.md)

## Overview

- Priority: P1
- Status: In Progress
- Goal: prove risky assumptions before building the server and browser surface.

## Key Insights

- Zed task variables are documented; arbitrary extension command UX is not guaranteed.
- A file watcher sees saved files, not unsaved editor buffers.
- Crossnote can execute code chunks and load custom parser hooks if configured carelessly.
- Localhost servers need auth and path controls even when bound to loopback.

## Requirements

- Prove exact Zed launch surface: task-only, extension-assisted task, slash command, or another supported API.
- Decide MVP update semantics: saved-file only unless a safe unsaved-buffer path is proven.
- Decide server distribution path: workspace package, npm package, or Zed `npm:install` flow.
- Freeze security baseline before Phase 2: script execution off, code chunks off, custom parser JS off, exports never pass `runAllCodeChunks: true` by default.
- Freeze localhost auth baseline: high-entropy session, one-time bootstrap token, strict host/origin checks, no public bind.
- Freeze path safety baseline: `realpath` containment, no symlink/junction escape, file size cap.

## Architecture

Gate sequence:

```text
Zed launch proof -> distribution proof -> saved/unsaved update decision -> threat model -> contracts
```

If Zed cannot expose a dedicated extension command, MVP becomes:

```text
Zed task/keybinding -> Node CLI server -> browser preview
```

## Related Code Files

- Create disposable prototype files under `F:\Windows\Study\Selfhost\zed-extension\prototypes\zed-launch-smoke\` during implementation.
- Create or update `F:\Windows\Study\Selfhost\zed-extension\.zed\tasks.json` after proof.
- Create `F:\Windows\Study\Selfhost\zed-extension\docs\threat-model.md`.
- Create `F:\Windows\Study\Selfhost\zed-extension\docs\distribution-strategy.md`.

## Implementation Steps

1. Build a minimal Zed dev extension or task smoke test that receives `$ZED_FILE` and `$ZED_WORKTREE_ROOT`.
2. Test whether extension APIs can provide a usable command/slash/action path. Record result.
3. Test whether unsaved buffer content can be streamed safely. If not, define MVP as save-based preview.
4. Set `.zed/tasks.json` preview task to save the current file before launching or rerunning.
5. Choose server install path and write the clean-install smoke test.
6. Write threat model covering Markdown input, Crossnote hooks, code chunks, local server auth, path traversal, and browser copy.
7. Convert threat model into checklist items that Phases 1 to 7 must satisfy.

## Todo List

- [ ] Prove Zed launch path inside Zed with the smoke task.
- [x] Decide saved-file vs unsaved-buffer preview semantics.
- [x] Decide server distribution strategy.
- [x] Write threat model.
- [x] Define localhost auth and path safety baseline.
- [x] Add Phase 1 contract updates from proof results.

## Implementation Notes

- MVP update semantics are save-based through `.zed/tasks.json` using `save: "current"`.
- Distribution starts as an npm workspace/package CLI launched from a Zed task.
- The local CLI smoke passed against `README.md`; manual in-Zed task execution remains pending.
- Rust extension validation passed with `cargo check` and `cargo test` after adding the installed Cargo binary to the session PATH.

## Success Criteria

- Plan has an exact MVP launch path and fallback.
- MVP does not claim live-as-you-type unless proven.
- Server install path is chosen and testable.
- Security baseline is documented before server implementation starts.

## Risk Assessment

- Risk: no satisfying extension UX exists today.
- Mitigation: task/keybinding workflow is accepted as MVP, with docs and clear naming.
- Risk: unsaved-buffer preview is impossible.
- Mitigation: use save-based preview and make `save: "current"` part of task contract.

## Security Considerations

- Do not let Phase 2 enable Crossnote code execution, custom parser JS, public bind, or unvalidated file access.
- Treat token-in-URL as bootstrap only; prefer strict cookie/session after first browser load.

## Next Steps

- Phase 1 consumes gate decisions and freezes contracts.
