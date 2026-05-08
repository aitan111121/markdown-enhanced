# System Architecture

## Overview

Markdown Preview Enhanced for Zed uses an external browser preview because Zed extensions do not expose VS Code-style webviews. The first release path is:

```text
Zed task -> Node CLI server -> localhost browser preview
```

## Components

- `extension.toml`, `Cargo.toml`, `src/lib.rs`: minimal Zed extension shell for future capability probes.
- `.zed/tasks.json`: primary MVP launch surface.
- `packages/server`: Node CLI, local HTTP server, session store, path validation, and future Crossnote integration.
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

## HTTP Contract

- `GET /health`: server readiness.
- `GET /preview/:sessionId?token=...`: browser preview shell.
- `GET /assets/browser-preview.js`: browser client asset.
- `GET /assets/preview.css`: preview stylesheet.

Phase 2 will add stable `POST /api/sessions`, `POST /api/render`, and export routes.

## WebSocket Contract

- `GET /ws/:sessionId?token=...`: browser update channel.
- `preview:status`: connection and lifecycle status.
- `preview:update`: rendered preview payload.
- `preview:error`: non-destructive render error.

## Security Defaults

- Bind to `127.0.0.1` by default.
- Require one-time preview bootstrap tokens and separate WebSocket tokens.
- Validate target files with realpath containment inside the workspace.
- Enforce source file size caps at path resolution and render time.
- Keep script execution, custom parser JavaScript, public bind, and run-all-code-chunks disabled by default.