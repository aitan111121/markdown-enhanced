# Implementation Contracts

## Phase 0 Decisions

- Launch path: Zed project task is the MVP path.
- Preview semantics: saved file only through task `save: "current"`.
- Distribution: npm CLI package first; Zed extension-assisted install later.
- Browser surface: external localhost preview.

## CLI

```bash
zed-mpe preview --workspace <path> --file <path> --port <number|0> --open --save-mode filesystem
```

Required invariants:

- `--workspace` must be the active worktree root.
- `--file` must resolve inside the workspace root.
- `--save-mode filesystem` is the only MVP mode.
- `--port 0` asks the OS for an available localhost port.

## HTTP

- `GET /health`: returns readiness and active session count.
- `GET /preview/:sessionId?token=...`: consumes the one-time preview bootstrap token and serves the preview shell.
- `GET /assets/browser-preview.js`: serves the browser client.
- `GET /assets/preview.css`: serves preview styles.

Phase 2 owns stable render/session/export routes.

## WebSocket

- `GET /ws/:sessionId?token=...`: opens a token-gated browser channel using the browser token embedded in the preview shell.
- `preview:status`: lifecycle status.
- `preview:update`: rendered payload.
- `preview:error`: render error while preserving previous preview state.

## Security Defaults

- Bind to `127.0.0.1`.
- Use high-entropy one-time preview tokens plus separate browser WebSocket tokens.
- Validate source paths with `realpath` containment.
- Reject files above the source size cap.
- Enforce a strict preview-shell Content Security Policy with no inline script.
- Keep script execution, custom parser JavaScript, public bind, and run-all-code-chunks disabled by default.