# Markdown Preview Enhanced for Zed

This repository provides a secure Zed workflow for opening the current saved Markdown file in an external browser preview. The MVP uses a thin Zed task plus a local Node server because Zed does not provide VS Code-style webviews.

## Current Scope

- Zed task/keybinding launch with `$ZED_FILE` and `$ZED_WORKTREE_ROOT`.
- Save-based preview semantics through `save: "current"`.
- Localhost-only preview server bound to `127.0.0.1`.
- Tokenized preview URL and WebSocket session bootstrap.
- Per-workspace server reuse for repeated current-file launches.
- Crossnote-backed renderer with safe defaults, markdown-it fallback, custom CSS subset support, session-token HTML export, passive code-chunk blocking, and release packaging smoke coverage.

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

## Release Smoke

```bash
npm run smoke:package
```

The smoke script builds a package tarball, installs it into a temporary project, launches `zed-mpe preview`, and checks the local `/health` endpoint.

## Security

This tool runs a local preview server bound to `127.0.0.1`. Markdown and `.crossnote` files are treated as untrusted input. Code chunks, script execution, parser JavaScript, remote diagram services, public bind, and arbitrary Crossnote config are disabled in `0.1.0`.

See [docs/usage.md](docs/usage.md) for Zed task details, [docs/security.md](docs/security.md) for the release security model, [docs/threat-model.md](docs/threat-model.md) for implementation controls, and [docs/feature-parity.md](docs/feature-parity.md) for supported/deferred MPE features.