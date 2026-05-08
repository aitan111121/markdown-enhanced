# Markdown Preview Enhanced for Zed

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Zed extension](https://img.shields.io/badge/Zed-extension-6b46c1.svg)](extension.toml)
[![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-339933.svg)](package.json)

Markdown Preview Enhanced for Zed brings a secure, browser-based Markdown Preview Enhanced workflow to [Zed](https://zed.dev/). It opens the current saved Markdown file in a local browser preview, refreshes on save, supports rich copy and HTML export, and keeps risky MPE features disabled until they have a clear trust model.

This project is inspired by [Markdown Preview Enhanced](https://github.com/shd101wyy/vscode-markdown-preview-enhanced) and uses [Crossnote](https://github.com/shd101wyy/crossnote) for compatible rendering where it can be used safely. It is not affiliated with the upstream Markdown Preview Enhanced project.

## Contents

- [Why This Exists](#why-this-exists)
- [Features](#features)
- [Install](#install)
- [Daily Usage](#daily-usage)
- [Configuration](#configuration)
- [Feature Parity](#feature-parity)
- [Security Model](#security-model)
- [Docs Teams](#docs-teams)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Why This Exists

Markdown Preview Enhanced is popular in VS Code because it combines practical Markdown preview, diagrams, math, exports, and writing workflows. Zed does not currently provide VS Code-style extension webviews, so this extension uses a small Zed task plus a local Node server to provide the preview in your browser.

The first release focuses on the useful, low-trust parts of that workflow:

- Preview the saved Markdown file you are editing in Zed.
- Refresh open previews after file saves.
- Copy rendered Markdown as rich HTML or plain text.
- Export a sanitized standalone HTML snapshot.
- Keep local command execution, parser hooks, and public serving disabled by default.

## Features

- **Zed task workflow**: launch the current saved file with `$ZED_FILE` and `$ZED_WORKTREE_ROOT` through the bundled CLI.
- **Local browser preview**: opens a tokenized `127.0.0.1` URL instead of embedding a webview.
- **Save-based updates**: watches the saved file and pushes updates to the browser over WebSocket.
- **Crossnote-backed rendering**: supports common MPE-style Markdown output with a safe `markdown-it` fallback.
- **Rich copy**: select rendered content and press `Ctrl+C`/`Cmd+C` to copy HTML plus plain text.
- **HTML export**: download a sanitized standalone HTML file from the browser toolbar.
- **Custom preview CSS**: load a restricted `.crossnote/style.less` CSS subset for workspace styling.
- **Per-workspace server reuse**: repeated launches reuse the existing local preview server when possible.
- **Passive code-chunk diagnostics**: runnable MPE code chunks are detected and shown as blocked, not executed.
- **Contents sidebar**: navigate generated headings from a left or right browser sidebar.
- **Passive link diagnostics**: classify local Markdown/image links without fetching remote URLs.
- **Safe draft editing**: edit a browser draft, preview it, then explicitly apply with stale-source checks and backup creation.

## Install

### Current Status

The supported `0.1.0` preview workflow is source-checkout driven: build this repository, then launch the bundled CLI from a Zed task. The Rust extension package currently provides the Zed registry manifest and extension shell, but it does not yet install a native preview command into arbitrary workspaces.

After the extension is accepted into the Zed extension registry, the listing can be installed from Zed's Extensions page. For actual preview usage in `0.1.0`, keep using one of the task setups below until native Zed command integration lands.

### Source Checkout

Clone and build the project:

```bash
git clone https://github.com/aitan111121/markdown-enhanced.git
cd markdown-enhanced
npm install
npm run build
```

Then in Zed:

1. Open this repository folder.
2. Run `zed: install dev extension` from the command palette if you want to test the extension manifest.
3. Open a saved Markdown file in this repository.
4. Run the repo-local `MPE Preview Current File` task.

### Other Workspaces

To use the preview from a different Markdown workspace today, keep this repository built and add a Zed task in that workspace that calls the built CLI directly. Replace the CLI path with your local checkout path:

```json
[
  {
    "label": "MPE Preview Current File",
    "command": "node",
    "args": [
      "C:/path/to/markdown-enhanced/packages/server/dist/cli.js",
      "preview",
      "--workspace",
      "$ZED_WORKTREE_ROOT",
      "--file",
      "$ZED_FILE",
      "--port",
      "0",
      "--open",
      "--save-mode",
      "filesystem"
    ],
    "cwd": "$ZED_WORKTREE_ROOT",
    "save": "current",
    "use_new_terminal": false,
    "allow_concurrent_runs": true,
    "reveal": "no_focus",
    "hide": "never"
  }
]
```

## Daily Usage

After configuring the task in your workspace, add a keybinding in your Zed `keymap.json`:

```json
{
  "context": "Workspace",
  "bindings": {
    "alt-m": ["task::Spawn", { "task_name": "MPE Preview Current File" }]
  }
}
```

Then use the extension like this:

1. Open a saved Markdown file in Zed.
2. Press your task keybinding, or run `task: spawn` and choose `MPE Preview Current File`.
3. A browser preview opens with a one-time local session token.
4. Save the Markdown file to refresh the preview.
5. Select rendered content and press `Ctrl+C`/`Cmd+C` for rich copy, or use the browser toolbar to export HTML and draft small edits.

The first preview launch starts a small server task for the workspace. Later launches reuse that server and exit quickly after opening a new browser URL. Stop the Zed task terminal to stop the preview server.

You can also launch a preview directly from a terminal:

```bash
npm run zed-mpe -- preview --workspace . --file README.md --port 0 --open --save-mode filesystem
```

Use `--no-open` to print the one-time preview URL without launching your browser. Normal `--open` launches the browser and redacts tokenized URLs in status output.

## Configuration

### Preview CSS

Create `.crossnote/style.less` in your workspace to style the rendered preview. The file is treated as CSS text, not evaluated as Less.

Allowed rules must target `.markdown-preview` or `.preview-root`. The release blocks imports, URLs, CSS escapes, function-like tokens, global selectors, scripts, parser hooks, and `head.html` injection.

### Zed Task Behavior

The preview task uses Zed's `save: "current"` behavior. This means preview updates are based on saved file content, not unsaved editor buffers.

If the preview task reports that the server build is missing, run the `MPE Build Node Packages` task, then retry the preview.

## Feature Parity

The goal is practical MPE compatibility for Zed without copying unsafe assumptions from an editor webview environment.

| Area | Status in `0.1.0` |
|---|---|
| Current-file Markdown preview | Supported through external browser |
| Save-based refresh | Supported |
| GFM tables and task lists | Supported |
| KaTeX math | Supported |
| Front matter and generated metadata | Supported |
| Mermaid | Partial, depends on safe Crossnote output |
| TOC/sidebar navigation | Supported |
| Passive workspace link diagnostics | Supported |
| Rich copy | Supported |
| Standalone HTML export | Supported |
| Browser draft editing | Supported with explicit apply |
| `.crossnote/style.less` | Partial CSS-only subset |
| PDF/Pandoc export | Deferred |
| Code chunk execution | Disabled and blocked |
| Custom parser JavaScript | Disabled |
| Public remote preview | Not supported |

See [docs/feature-parity.md](docs/feature-parity.md) for the full support matrix and post-MVP tracks.

## Security Model

Markdown files, `.crossnote` files, diagrams, links, images, and rendered HTML are treated as untrusted input.

Important defaults:

- The preview server binds to `127.0.0.1` only.
- Preview URLs use one-time bootstrap tokens.
- WebSocket and export calls require a browser session token.
- File access is contained inside the workspace root with realpath checks and traversal rejection.
- Workspace `.crossnote/config.js`, parser JavaScript, imports, script execution, remote diagram services, and public bind are disabled.
- Clipboard and exported HTML strip scripts, event handlers, local file URLs, executable URL schemes, and session tokens.

See [docs/security.md](docs/security.md) and [docs/threat-model.md](docs/threat-model.md) for implementation details.

## Docs Teams

Technical docs team guidance lives in [docs/integration-guide.md](docs/integration-guide.md). The public roadmap is in [docs/roadmap.md](docs/roadmap.md), and the future Zed-native preview path is tracked in [docs/webview-evolution.md](docs/webview-evolution.md).

The short version: keep this tool local, save-based, and explicit. Use the browser review surface for rendered review, rich copy, HTML snapshots, link diagnostics, and small draft edits. Keep the static site generator or publishing pipeline as the source of truth for deployed docs.

## Development

Prerequisites:

- Node.js 20 or newer
- npm
- Rust toolchain through `rustup`

Repository layout:

```text
packages/server/           Local preview server and CLI
packages/browser-preview/  Browser toolbar, rendering, copy, and export UI
src/                       Zed Rust extension entry point
docs/                      Usage, security, release, and parity docs
```

Common commands:

| Command | Purpose |
|---|---|
| `npm install` | Install workspace dependencies |
| `npm run build:node` | Build the Node server and browser preview packages |
| `npm run build` | Build Node packages and run `cargo check` |
| `npm run typecheck` | Type-check TypeScript workspaces |
| `npm run lint` | Current lint gate, backed by TypeScript checks |
| `npm run test` | Run workspace tests and Rust tests |
| `npm run smoke:package` | Build and smoke-test the packaged CLI |
| `npm pack --dry-run` | Inspect release package contents |

Before a release or registry submission, run:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
npm audit --omit=dev
npm pack --dry-run
npm run smoke:package
```

The current `npm audit --omit=dev` baseline is documented in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md): a moderate no-fix Crossnote transitive finding through `markdown-it-html5-embed`, with the affected feature surface disabled in this project.

## Contributing

Issues and pull requests are welcome. Good contributions for the current release line include:

- Rendering compatibility fixes with fixtures.
- Browser preview usability improvements.
- Safer export and copy behavior.
- Documentation improvements.
- Tests for Windows, macOS, and Linux Zed task behavior.

Please keep changes focused, include tests for behavior changes, and call out security implications for anything touching rendering, file access, clipboard, export, local server behavior, or future execution workflows.

Do not enable code chunks, parser JavaScript, remote preview, or credential-bearing image workflows without a separate design and security review.

## Roadmap

Post-MVP work is tracked in [docs/feature-parity.md](docs/feature-parity.md) and [docs/development-roadmap.md](docs/development-roadmap.md). The major tracks are:

- Knowledge-base features: wikilinks, backlinks, tags, graph view.
- Export features: PDF, Pandoc, citations, eBook formats.
- Diagram features: PlantUML, GraphViz, Kroki, WaveDrom, Vega.
- Presentation features: Reveal.js browser route.

## Acknowledgements

- [Markdown Preview Enhanced](https://github.com/shd101wyy/vscode-markdown-preview-enhanced) for the original editor workflow and feature set.
- [Crossnote](https://github.com/shd101wyy/crossnote) for Markdown Preview Enhanced compatible rendering internals.
- [Zed](https://zed.dev/) for the editor extension platform.

## License

This project is licensed under the [MIT License](LICENSE). Dependency notices are listed in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).