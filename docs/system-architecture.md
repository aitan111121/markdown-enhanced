# System Architecture

## Overview

Markdown Preview Enhanced for Zed uses an external browser preview because Zed extensions do not expose VS Code-style webviews. The first release path is:

```text
Zed keybinding/task -> Node CLI -> reused or new localhost server -> browser preview
```

## Components

- `extension.toml`, `Cargo.toml`, `src/lib.rs`: minimal Zed extension shell for future capability probes.
- `.zed/tasks.json`: primary MVP launch surface.
- `packages/server`: Node CLI, local HTTP server, per-workspace reuse state, session store, path validation, Crossnote rendering bridge, and safe markdown-it fallback.
- `packages/browser-preview`: browser WebSocket client, preview shell assets, diagnostics display, and clipboard sanitization.
- `docs`: contracts, threat model, distribution strategy, usage, and project standards.

## CLI Contract

```bash
zed-mpe preview --workspace <path> --file <path> --port <number|0> --open --save-mode filesystem
```

- `--workspace`: absolute workspace root from `ZED_WORKTREE_ROOT`.
- `--file`: absolute current file path from `ZED_FILE`.
- `--port 0`: request an available local port.
- `--open`: open the default browser.
- `--save-mode filesystem`: preview saved file contents only.
- `--port 0`: reuse the workspace server when possible; otherwise start a new localhost server.

## HTTP Contract

- `GET /health`: server readiness and active session count.
- `GET /preview/:sessionId?token=...`: browser preview shell (one-time bootstrap token, non-cacheable).
- `POST /sessions`: control-token endpoint for CLI-only reuse of an existing workspace server.
- `GET /assets/browser-preview.js`: browser client WebSocket lifecycle and event handling.
- `GET /assets/render-preview.js`: browser render replacement logic (scroll-preserving DOM updates).
- `GET /assets/preview.css`: preview stylesheet.
- `POST /api/export/html`: session-token HTML export for the current saved preview.

PDF export and direct Crossnote export APIs are deferred.

## Render Pipeline

- The server creates one Crossnote notebook per workspace cache entry, but points Crossnote at a server-owned temporary notebook root so workspace `.crossnote/config.js` is ignored in Phase 2.
- Saved Markdown files render through `getNoteMarkdownEngine(filePath).parseMD(...)` with `runAllCodeChunks: false`.
- Crossnote is loaded through Node `createRequire()` because its direct ESM import path currently fails on an extensionless transitive import.
- If Crossnote initialization or rendering fails, the server renders through the safe markdown-it fallback and reports diagnostics in the payload.
- Crossnote render calls are serialized per notebook cache entry before clearing shared engine caches.
- Crossnote `@import` directives are escaped before parsing in Phase 2; contained import/resource support is deferred until a validated resolver exists.
- Rendered preview HTML is post-filtered to remove active containers and executable attributes before wrapping in the browser payload.
- Runnable code chunk fences are detected before render and reported as diagnostics while execution remains disabled.
- The server optionally attaches sanitized `.crossnote/style.less` CSS to render payloads. The browser applies it with a CSP nonce and removes it when absent.
- HTML exports reuse the sanitized render payload and inline base preview CSS plus any sanitized custom CSS.

## WebSocket Contract

- `GET /ws/:sessionId?token=...`: browser update channel with Host/Origin validation.
- `preview:status`: connection and lifecycle status messages.
- `preview:update`: rendered preview HTML payload.
- `preview:error`: non-destructive render error (preserves last good preview).

## Browser Client Capabilities

- WebSocket lifecycle management with a reconnect control.
- Scroll-preserving preview updates on saved-file changes.
- Rich copy: selection as text/html + text/plain.
- Rich copy: full document as text/html + text/plain.
- HTML export from the current authenticated preview session.
- Clipboard sanitization stripping scripts and event handlers.
- Error display without destroying current preview state.

## Security Defaults

- Bind to `127.0.0.1` by default.
- Require one-time preview bootstrap tokens and separate WebSocket tokens.
- Validate target files with realpath containment inside the workspace.
- Reject UNC-style paths, malformed percent encoding, encoded traversal characters, and symlink escapes outside the workspace.
- Enforce source file size caps at path resolution and render time.
- Keep script execution, custom parser JavaScript, public bind, and run-all-code-chunks disabled by default.
- Keep Crossnote custom header/global CSS empty until Phase 5/6 safe subsets are implemented.
- Allow only the Phase 5 CSS-only `.crossnote/style.less` subset; keep `.crossnote/config.js`, `head.html`, and parser JS ignored.
- Ignore workspace `.crossnote/config.js` until Phase 5/6 implements explicit whitelists.
- Keep Crossnote imports disabled until resource reads and remote fetches are routed through explicit policy checks.

## Release Packaging

- Root npm package exposes `zed-mpe` as the CLI binary.
- `npm run smoke:package` packs the root package, installs it into a temporary project, launches the preview CLI, and checks `/health`.
- Zed registry publishing requires a public repository, accepted root license, matching `extension.toml` version, and a PR to `zed-industries/extensions`.