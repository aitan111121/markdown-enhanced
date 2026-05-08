# Implementation Contracts

## Phase 0 Decisions

- Launch path: Zed project task is the MVP path.
- Preview semantics: saved file only through task `save: "current"`.
- Distribution: npm CLI package first; Zed extension-assisted install later.
- Browser surface: external localhost preview.
- Daily workflow target: one configured Zed keybinding/action opens or reuses preview; task picker and terminal launch are fallback/debug paths.

## CLI

```bash
zed-mpe preview --workspace <path> --file <path> --port <number|0> --open --save-mode filesystem
```

Required invariants:

- `--workspace` must be the active worktree root.
- `--file` must resolve inside the workspace root.
- `--save-mode filesystem` is the only MVP mode.
- `--port 0` asks the OS for an available localhost port.
- With `--port 0`, the CLI first attempts to reuse the workspace server state and request a fresh one-time preview URL from the existing localhost server.

## HTTP

- `GET /health`: returns readiness and active session count.
- `GET /preview/:sessionId?token=...`: consumes the one-time preview bootstrap token and serves the preview shell (non-cacheable, Host/Origin validated).
- `POST /sessions`: local control-token endpoint used by the CLI to create a fresh preview session on an existing per-workspace server.
- `GET /assets/browser-preview.js`: serves the browser client (WebSocket lifecycle and event handling).
- `GET /assets/render-preview.js`: serves the render replacement logic (scroll-preserving DOM updates).
- `GET /assets/preview.css`: serves preview styles.

Phase 5+ will add stable render/export routes.

## WebSocket

- `GET /ws/:sessionId?token=...`: opens a token-gated browser channel with Host/Origin validation; uses the browser token embedded in the preview shell.
- `preview:status`: lifecycle status (e.g., connected, file changed).
- `preview:update`: rendered HTML payload.
- `preview:error`: render error while preserving previous preview state.

Rich copy operations (selection and full document as text/html + text/plain) are handled client-side with clipboard sanitization.

## Security Defaults

- Bind to `127.0.0.1`.
- Use high-entropy one-time preview tokens plus separate browser WebSocket tokens.
- Store per-workspace reuse state in the user's temp directory with a control token; never expose the control token through `/health` or browser HTML.
- Validate source paths with `realpath` containment.
- Reject files above the source size cap.
- Enforce a strict preview-shell Content Security Policy with no inline script.
- Keep script execution, custom parser JavaScript, public bind, and run-all-code-chunks disabled by default.
- Initialize Crossnote through the safe adapter only: server-owned temporary notebook root, disabled script execution, disabled render-time code chunks, inert parser hooks, disabled HTML5 embed, disabled remote diagram services, escaped `@import` directives, post-render preview HTML hardening, empty custom header/global CSS, and markdown-it fallback diagnostics on render failure.