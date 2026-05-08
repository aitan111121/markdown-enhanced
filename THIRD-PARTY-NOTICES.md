# Third-Party Notices

This project includes or depends on open source packages through npm and Cargo. The extension code in this repository is licensed under MIT; dependency licenses remain with their authors.

## Runtime Dependencies

| Package | License | Purpose |
|---|---|---|
| `crossnote` | NCSA | Markdown Preview Enhanced compatible rendering engine. |
| `markdown-it` | MIT | Safe fallback Markdown rendering. |
| `chokidar` | MIT | Saved-file watching for browser preview updates. |
| `ws` | MIT | Local browser WebSocket update channel. |
| `zed_extension_api` | Apache-2.0 | Zed Rust extension API. |

## Transitive Security Note

`npm audit --omit=dev` currently reports a moderate no-fix finding through `crossnote` -> `markdown-it-html5-embed` -> nested `markdown-it@8.4.2`. The affected HTML5 embed surface is disabled by this project through safe Crossnote config, server-owned notebook roots, disabled workspace config, and disabled Crossnote imports. Revisit this dependency chain before enabling any HTML5 embed, parser hook, or trusted execution feature.

## Release Review

Before publishing a new release, refresh this file with:

```bash
npm ls --omit=dev --all
npm view <package> license
```