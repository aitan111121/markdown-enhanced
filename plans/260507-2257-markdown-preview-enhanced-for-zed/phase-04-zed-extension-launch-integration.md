# Phase 04: Zed Extension Launch Integration

## Context Links

- [Zed extension constraints report](./reports/researcher-001-zed-extension-architecture.md)
- [Repository Contracts and Scaffold](./phase-01-repository-contracts-and-scaffold.md)
- [Crossnote Preview Server Core](./phase-02-crossnote-preview-server-core.md)

## Overview

- Priority: P1
- Status: Pending
- Goal: make the Zed-side workflow feel like one action for daily use, even though the preview itself runs in the browser.

## Key Insights

- Zed extensions are Rust/WASM and capability-gated.
- Public docs list extension types, capabilities, tasks, process execution, npm install, and slash/context server APIs, but not VS Code-style arbitrary webviews.
- Phase 0 proved the Zed task path, so Phase 4 should make that path feel like a direct preview action.
- `task: spawn` remains a fallback and diagnostic path, not the recommended daily workflow.

## Requirements

- Provide a current-file preview task using `$ZED_FILE` and `$ZED_WORKTREE_ROOT`.
- Make the recommended daily workflow: open Markdown, press one configured Zed action, browser preview opens or reuses the existing preview.
- Ensure preview task saves the current file before launch/rerun when MVP is save-based.
- Install or locate the Node CLI server predictably.
- Launch or reuse a per-workspace preview server.
- Open the preview URL in the default browser, or copy/show the URL if browser launch fails.
- Keep `task: spawn` and terminal launch documented as fallback/debug flows only.
- Keep capability requests narrow and auditable.
- Provide clear errors for missing Node/npm/server.

## Architecture

Primary UX after Phase 0 proof:

```text
Zed keybinding/action -> MPE Preview Current File task -> Node CLI server reuse -> browser URL
```

Extension responsibilities:

- `extension.toml`: metadata and capability declarations.
- `src/lib.rs`: feasibility path for process/npm/platform checks and optional slash command.
- `.zed/tasks.json`: stable user action path.
- `docs/usage.md`: keybinding and task setup.

Fallback UX:

- User runs `task: spawn` and selects `MPE Preview Current File`.
- Developer runs `npm run zed-mpe -- preview --workspace . --file README.md --open` from a terminal.
- If extension cannot open browser, server prints URL and copies URL when possible.

## Related Code Files

- Create `F:\Windows\Study\Selfhost\zed-extension\extension.toml`.
- Create `F:\Windows\Study\Selfhost\zed-extension\Cargo.toml`.
- Create `F:\Windows\Study\Selfhost\zed-extension\src\lib.rs`.
- Create `F:\Windows\Study\Selfhost\zed-extension\.zed\tasks.json`.
- Create `F:\Windows\Study\Selfhost\zed-extension\docs\usage.md`.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\cli.ts` for Zed task-friendly output.

## Implementation Steps

1. Create minimal Zed extension manifest and Rust entry point.
2. Add capabilities only after concrete calls require them, such as `process:exec` and `npm:install`.
3. Keep `.zed/tasks.json` task for previewing the current file as the stable launch contract.
4. Configure task with `save: "current"` when preview is saved-file based.
5. Verify whether Zed keymaps can bind directly to a named task; if supported, document that as the primary path.
6. If direct named-task binding is unavailable, document the shortest supported keybinding path and keep task picker usage as fallback.
7. Add cross-platform browser launch in the Node CLI using a maintained package or OS-specific command.
8. Add server reuse detection through health endpoint and workspace/session matching.
9. Add URL fallback printing and optional clipboard URL copy.
10. Implement only the extension action surface proven by Phase 0.

## Todo List

- [ ] Build minimal Zed extension scaffold.
- [ ] Keep current-file preview task as stable fallback.
- [ ] Document the shortest supported keybinding workflow.
- [ ] Implement server reuse and browser handoff.
- [ ] Add missing-runtime diagnostics.
- [ ] Document task picker and terminal fallback usage.
- [ ] Apply Phase 0 feasibility outcome for command palette/slash command path.

## Success Criteria

- From Zed, user can preview the current Markdown file with one configured action when supported by Zed keymaps.
- If Zed cannot bind directly to the named task, the documented fallback is the shortest supported task picker flow.
- The preview server starts or reuses an existing per-workspace process.
- Browser opens automatically on Windows, macOS, and Linux, or URL fallback is clear.
- Capability declarations are minimal and explained.

## Risk Assessment

- Risk: Zed does not support the desired custom command UI.
- Mitigation: ship with task-based UX first; keep extension command work behind a feasibility checkpoint.
- Risk: process capability prompts feel scary.
- Mitigation: narrow commands where practical and explain why server launch requires process execution.

## Security Considerations

- Avoid wildcard process capability until proven unavoidable.
- Never pass unsanitized file paths through shell strings; use args arrays where available.
- Do not launch public-network servers from the extension.

## Next Steps

- Phase 7 validates this inside a real Zed dev extension install.
- Phase 8 can improve UX if Zed adds richer extension action APIs.
