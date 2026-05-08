# Phase 02: Crossnote Preview Server Core

## Context Links

- [Markdown Preview Enhanced report](./reports/researcher-mpe-analysis.md)
- [Research synthesis](./research/research-synthesis.md)
- [Repository Contracts and Scaffold](./phase-01-repository-contracts-and-scaffold.md)

## Overview

- Priority: P1
- Status: In Progress (MVP server core complete; Crossnote notebook integration pending)
- Goal: implement the Node CLI server that owns saved-file watching, secure Crossnote rendering, sessions, and browser delivery.

## Key Insights

- Crossnote is the best reuse point. It powers MPE and exposes `Notebook.init`, `getNoteMarkdownEngine`, `openInBrowser`, `htmlExport`, `chromeExport`, and `markdownExport`.
- The server should be reusable outside Zed later, but MVP should not build a general editor platform.
- File access and rendering belong in the Node process, not the Zed WASM extension.
- MVP preview updates from saved filesystem changes unless Phase 0 proves safe unsaved-buffer streaming.

## Requirements

- Start a local server bound to `127.0.0.1` by default.
- Accept workspace root and active Markdown file from CLI.
- Validate all requested files stay inside the workspace root.
- Initialize one Crossnote notebook per workspace.
- Render Markdown to preview HTML and metadata.
- Watch saved file changes with debounce.
- Push updates to browser clients over WebSocket.
- Expose health and session lifecycle routes.
- Force safe Crossnote defaults: no code chunk execution, no custom parser JS, no export-time `runAllCodeChunks`.
- Enforce realpath containment and file size caps for source files and resources.

## Architecture

Server modules:

- `cli.ts`: parse args, locate port, start server, optionally open browser.
- `server.ts`: HTTP routes, WebSocket upgrade, lifecycle.
- `workspace-session-store.ts`: workspace sessions and active files.
- `crossnote-renderer.ts`: Crossnote adapter and render cache.
- `safe-crossnote-config.ts`: force safe Crossnote defaults.
- `file-watch-service.ts`: chokidar watcher with debounce.
- `path-safety.ts`: root-constrained path validation.
- `preview-url.ts`: tokenized localhost URLs.

Render flow:

```text
CLI args -> session -> path validation -> Crossnote engine -> render payload -> WebSocket -> browser
```

## Related Code Files

- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\cli.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\server.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\workspace-session-store.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\crossnote-renderer.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\safe-crossnote-config.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\file-watch-service.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\path-safety.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\preview-url.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\test\server-fixtures.test.ts`.

## Implementation Steps

1. Implement CLI argument parsing and validation.
2. Bind server to localhost with dynamic port fallback when requested port is busy.
3. Add session creation for workspace/file pairs.
4. Implement Crossnote notebook initialization and engine caching.
5. Add render endpoint returning HTML, TOC, front matter, diagnostics, and source line anchors when available.
6. Add safe Crossnote config wrapper that disables execution and custom parser hooks by default.
7. Add chokidar watch for active file plus safe `.crossnote/config.js` subset and `.crossnote/style.less`; defer `head.html` scripts and `parser.js`.
8. Push render results to browser clients using WebSocket.
9. Add stale render guards so slow renders cannot overwrite newer renders.

## Todo List

### Completed (MVP Server Core)
- [x] Implement CLI server startup.
- [x] Implement workspace path validation (realpath + size caps).
- [x] Add safe Crossnote config wrapper (script execution disabled, safe defaults enforced).
- [x] Implement WebSocket update channel (token-gated, Host/Origin validated).
- [x] Add debounced file watch refresh (300ms debounce, stale render suppression).
- [x] Add fixture tests (38 server tests passing: path safety, safe config, render, large files, file watch, server contract).
- [x] Basic Markdown rendering via the `crossnote-renderer.ts` markdown-it adapter.
- [x] Host/Origin validation, single-use bootstrap token, non-cacheable preview HTML.
- [x] Error handling with safe browser error display.

### Remaining (Crossnote Integration Gap)
- [ ] Integrate Crossnote `Notebook.init()` for full engine initialization (currently using adapter wrapper only).
- [ ] Integrate `getNoteMarkdownEngine()` for engine instance reuse.
- [ ] Support Crossnote notebook-level features (math, Mermaid, front matter extraction, TOC generation).

## Success Criteria

- [x] `zed-mpe preview --workspace ... --file ... --port 0` starts a server and returns a preview URL.
- [x] Saving a Markdown file causes a render update within the debounce window.
- [x] Requests outside workspace root are rejected.
- [x] Server can render Markdown headings and TOC through the safe adapter.
- [ ] Server can render front matter, math, and Mermaid fixtures through true Crossnote integration.
- [x] Code chunks and custom parser JS cannot execute through default render path.

## Risk Assessment

- Risk: Crossnote `Notebook.init()` integration is not complete; current adapter is a safe markdown-it bridge.
- Mitigation: keep Phase 2 in progress and finish the Crossnote adapter before claiming full Crossnote parity.
- Risk: Crossnote assumes VS Code webview resources in some preview paths.
- Mitigation: use Crossnote export/browser-oriented APIs and wrap resource resolution in the adapter.
- Risk: dependency size grows quickly.
- Mitigation: keep Puppeteer/Pandoc optional and lazy until Phase 5.

## Security Considerations

- Bind to `127.0.0.1` by default.
- Use one-time bootstrap token and session cookie/token for browser URLs and WebSocket connections.
- Never execute code chunks unless Phase 6 trust state is enabled.
- Validate Host and Origin against localhost values only.
- Sanitize errors sent to browser; avoid leaking environment variables.

## Next Steps

- Finish true Crossnote `Notebook.init()` and `getNoteMarkdownEngine()` integration before closing Phase 2.
- Phase 4 launches this CLI and the completed Phase 3 browser client from Zed tasks/extension wiring.
