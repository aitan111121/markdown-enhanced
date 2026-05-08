# Phase 02: Crossnote Preview Server Core

## Context Links

- [Markdown Preview Enhanced report](./reports/researcher-mpe-analysis.md)
- [Research synthesis](./research/research-synthesis.md)
- [Repository Contracts and Scaffold](./phase-01-repository-contracts-and-scaffold.md)

## Overview

- Priority: P1
- Status: Complete
- Goal: implement the Node CLI server that owns saved-file watching, secure Crossnote rendering, sessions, and browser delivery.

## Key Insights

- Crossnote is the best reuse point. It powers MPE and exposes `Notebook.init`, `getNoteMarkdownEngine`, `openInBrowser`, `htmlExport`, `chromeExport`, and `markdownExport`.
- Crossnote's direct ESM entry currently fails under Node because one dependency imports `bit-field/lib/render` without an extension; the server loads Crossnote through `createRequire()` while keeping the surrounding package ESM.
- Phase 2 initializes Crossnote from a server-owned temporary notebook root so untrusted workspace `.crossnote/config.js` cannot override safe defaults. Phase 5/6 can add explicit safe subsets for `.crossnote/style.less` and config.
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
- Ignore workspace `.crossnote/config.js` during Phase 2 rendering; local config support requires a later whitelist.
- Disable Crossnote `@import` expansion during Phase 2 so imports cannot read outside the workspace or fetch remote content before the server validates paths.
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
7. Watch the active saved file; defer safe `.crossnote/config.js` subset and `.crossnote/style.less` support to Phase 5/6, and continue deferring `head.html` scripts and `parser.js`.
8. Push render results to browser clients using WebSocket.
9. Add stale render guards so slow renders cannot overwrite newer renders.

## Todo List

### Completed (MVP Server Core)
- [x] Implement CLI server startup.
- [x] Implement workspace path validation (realpath + size caps).
- [x] Add safe Crossnote config wrapper (script execution disabled, safe defaults enforced).
- [x] Implement WebSocket update channel (token-gated, Host/Origin validated).
- [x] Add debounced file watch refresh (300ms debounce, stale render suppression).
- [x] Add fixture tests (49 server tests passing: path safety, safe config, Crossnote render, saved files, large files, file watch, server reuse, server contract).
- [x] Basic Markdown rendering via the `crossnote-renderer.ts` markdown-it fallback adapter.
- [x] Host/Origin validation, single-use bootstrap token, non-cacheable preview HTML.
- [x] Error handling with safe browser error display.
- [x] Integrate Crossnote `Notebook.init()` for full engine initialization.
- [x] Integrate `getNoteMarkdownEngine()` for engine instance reuse.
- [x] Support Crossnote notebook-level features (math, Mermaid, front matter extraction, TOC generation).
- [x] Ignore hostile workspace `.crossnote/config.js` in Phase 2 so it cannot re-enable HTML5 embed or HTTP media fetches.
- [x] Disable Crossnote `@import` expansion for local and remote imports until a contained resource resolver exists.
- [x] Post-filter preview HTML to remove scripts, styles, iframes, object/embed/applet containers, inline event handlers, and executable URL attributes.

### Remaining
- [ ] Phase 5 adds export routes and broader MPE tier-one rendering parity on top of this bridge.

## Success Criteria

- [x] `zed-mpe preview --workspace ... --file ... --port 0` starts a server and returns a preview URL.
- [x] Saving a Markdown file causes a render update within the debounce window.
- [x] Requests outside workspace root are rejected.
- [x] Server can render Markdown headings and TOC through the safe adapter.
- [x] Server can render front matter, math, and Mermaid fixtures through true Crossnote integration.
- [x] Code chunks and custom parser JS cannot execute through default render path.

## Risk Assessment

- Risk: Crossnote's ESM package path is not directly importable in Node ESM.
- Mitigation: load Crossnote through `createRequire()` and keep the adapter boundary isolated.
- Risk: Crossnote assumes VS Code webview resources in some preview paths.
- Mitigation: use Crossnote export/browser-oriented APIs and wrap resource resolution in the adapter.
- Risk: Crossnote currently pulls `markdown-it-html5-embed`, which includes a nested vulnerable `markdown-it@8.4.2` with no npm audit fix available.
- Mitigation: initialize Crossnote from a server-owned temporary notebook root, keep script execution, code chunks, custom parser hooks, custom head/global CSS, HTML5 embed, remote diagram services, and `@import` expansion disabled by default, and re-evaluate dependency replacement or patching in Phase 6/7.

## Security Considerations

- Bind to `127.0.0.1` by default.
- Use one-time bootstrap token and session cookie/token for browser URLs and WebSocket connections.
- Never execute code chunks unless Phase 6 trust state is enabled.
- Validate Host and Origin against localhost values only.
- Sanitize errors sent to browser; avoid leaking environment variables.

## Next Steps

- Start Phase 5 rendering/export parity on top of the completed Crossnote bridge.
- Phase 4 launches this CLI and the completed Phase 3 browser client from Zed tasks/extension wiring.
