# Phase 01: Repository Contracts and Scaffold

## Context Links

- [Research synthesis](./research/research-synthesis.md)
- [Zed extension constraints report](./reports/researcher-001-zed-extension-architecture.md)
- [Workspace scout report](./reports/scout-report.md)

## Overview

- Priority: P1
- Status: Pending
- Goal: create the project skeleton and freeze the contracts between Zed, the Node server, and the browser preview before deeper work begins.

## Key Insights

- Workspace is empty, so all project structure is new.
- Zed extensions do not expose VS Code webviews; task/process/browser flow is the core constraint.
- Contract-first prevents the extension, server, and browser UI from drifting while implemented in parallel.
- Phase 0 decisions are required inputs, not optional research.

## Requirements

- Define monorepo layout for Zed extension, Node server, browser client, tests, and docs.
- Define CLI contract for current-file preview.
- Define HTTP and WebSocket contracts.
- Define configuration names and defaults.
- Include threat model gates in contracts: no code execution by default, save-based preview unless proven otherwise, localhost-only server, realpath containment.
- Lock distribution strategy chosen in Phase 0.
- Keep file names kebab-case and self-descriptive.

## Architecture

Initial project shape:

```text
extension.toml
Cargo.toml
src/lib.rs
packages/server/package.json
packages/server/src/cli.ts
packages/server/src/server.ts
packages/server/src/crossnote-renderer.ts
packages/browser-preview/src/index.ts
packages/browser-preview/src/preview.css
docs/system-architecture.md
docs/code-standards.md
.zed/tasks.json
```

Contracts:

- CLI: `zed-mpe preview --workspace <path> --file <path> --port <number|0> --open --save-mode filesystem`
- Health: `GET /health`
- Session create: `POST /api/sessions`
- Render: `POST /api/render`
- Export: `POST /api/export/html`, later `POST /api/export/pdf`
- Browser page: `GET /preview/:sessionId`
- WebSocket events: `preview:update`, `preview:error`, `preview:status`, `preview:scroll-to-line`
- Security defaults: `enableScriptExecution=false`, `allowCustomParser=false`, `allowPublicBind=false`, `runAllCodeChunks=false`.

## Related Code Files

- Create `F:\Windows\Study\Selfhost\zed-extension\extension.toml`.
- Create `F:\Windows\Study\Selfhost\zed-extension\Cargo.toml`.
- Create `F:\Windows\Study\Selfhost\zed-extension\src\lib.rs`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\package.json`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\cli.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\server.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\index.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\.zed\tasks.json`.
- Create `F:\Windows\Study\Selfhost\zed-extension\docs\system-architecture.md`.
- Create `F:\Windows\Study\Selfhost\zed-extension\docs\code-standards.md`.

## Implementation Steps

1. Initialize repository manifests for Rust extension and Node packages.
2. Add root scripts for `build`, `test`, `lint`, and `dev` without overbuilding CI yet.
3. Add shared contract document for CLI flags, routes, WebSocket events, config keys, distribution path, and security gates.
4. Create stub server that returns health and static preview shell.
5. Create stub browser client that connects to WebSocket and renders placeholder content.
6. Create stub Zed extension entry point with minimal capability declarations.
7. Add `.zed/tasks.json` with a preview task using `$ZED_FILE` and `$ZED_WORKTREE_ROOT`.

## Todo List

- [ ] Create repository scaffold.
- [ ] Define CLI, HTTP, WebSocket contracts.
- [ ] Import Phase 0 launch, distribution, and threat model decisions.
- [ ] Add Zed task template for current file preview.
- [ ] Add initial docs with architecture and standards.
- [ ] Verify scaffold builds or fails only on known missing implementation.

## Success Criteria

- A developer can identify where extension, server, browser, tests, and docs live.
- `zed-mpe preview` contract is documented before implementation.
- Zed task flow is documented with current file and worktree variables.
- No phase after this needs to invent a competing API contract.
- The plan explicitly says preview updates saved file contents unless an unsaved-buffer path was proven in Phase 0.

## Risk Assessment

- Risk: Zed cannot expose general command palette commands for this use case.
- Mitigation: treat `.zed/tasks.json` as primary MVP UX and extension command UX as a feasibility probe.

## Security Considerations

- Do not request broad process capabilities until Phase 6 narrows the manifest.
- Default all execution-related settings to off.
- Contract must require workspace-root path validation in server routes.
- Contract must require `realpath` containment for source files, linked assets, and export resources.

## Next Steps

- Phase 2 implements the server core against this contract.
- Phase 3 implements the browser shell against this contract.
- Phase 4 wires Zed launch behavior to this contract.
