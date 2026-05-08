# Markdown Preview Enhanced for Zed

This repository is building a secure Zed workflow for opening the current saved Markdown file in an external browser preview. The MVP uses a thin Zed task plus a local Node server because Zed does not provide VS Code-style webviews.

## Current Scope

- Zed task launch with `$ZED_FILE` and `$ZED_WORKTREE_ROOT`.
- Save-based preview semantics through `save: "current"`.
- Localhost-only preview server bound to `127.0.0.1`.
- Tokenized preview URL and WebSocket session bootstrap.
- Placeholder saved-file render path until Crossnote is integrated in Phase 2.

## Development

```bash
npm install
npm run build:node
npm run test --workspaces --if-present
```

Run the preview task from Zed after building the Node packages, or from a terminal:

```bash
npm run zed-mpe -- preview --workspace . --file README.md --port 0 --open --save-mode filesystem
```

See [docs/usage.md](docs/usage.md) for Zed task details and [docs/threat-model.md](docs/threat-model.md) for the security baseline.