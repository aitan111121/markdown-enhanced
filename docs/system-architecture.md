# System Architecture

## Overview

Markdown Preview Enhanced for Zed uses an external browser preview because Zed extensions do not expose VS Code-style webviews. The first release path is:

```text
Zed keybinding/task -> Node CLI -> reused or new localhost server -> browser preview
```

## Components

- `extension.toml`, `Cargo.toml`, `src/lib.rs`: minimal Zed extension shell for future capability probes.
- `.zed/tasks.json`: primary MVP launch surface.
- `packages/server`: Node CLI, local HTTP server, per-workspace reuse state, session store, path validation, and future Crossnote integration.
- `packages/browser-preview`: browser WebSocket client and preview shell assets.
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

Phase 5+ will add stable render/export routes.

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
- Clipboard sanitization stripping scripts and event handlers.
- Error display without destroying current preview state.

## Security Defaults

- Bind to `127.0.0.1` by default.
- Require one-time preview bootstrap tokens and separate WebSocket tokens.
- Validate target files with realpath containment inside the workspace.
- Enforce source file size caps at path resolution and render time.
- Keep script execution, custom parser JavaScript, public bind, and run-all-code-chunks disabled by default.