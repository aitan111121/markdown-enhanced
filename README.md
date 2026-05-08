# Markdown Preview Enhanced for Zed

This repository is building a secure Zed workflow for opening the current saved Markdown file in an external browser preview. The MVP uses a thin Zed task plus a local Node server because Zed does not provide VS Code-style webviews.

## Current Scope

- Zed task/keybinding launch with `$ZED_FILE` and `$ZED_WORKTREE_ROOT`.
- Save-based preview semantics through `save: "current"`.
- Localhost-only preview server bound to `127.0.0.1`.
- Tokenized preview URL and WebSocket session bootstrap.
- Per-workspace server reuse for repeated current-file launches.
- Safe markdown-it renderer with escape validation and secure defaults; Crossnote Notebook.init integration pending.

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