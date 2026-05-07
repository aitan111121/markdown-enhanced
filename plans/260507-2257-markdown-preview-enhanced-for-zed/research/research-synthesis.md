# Research Synthesis

## Summary

The project should not try to recreate VS Code's webview model in Zed. Zed extension docs and source indicate a Rust/WASM extension model with capabilities such as process execution, npm install, download, HTTP client, language servers, context servers, slash commands, and tasks, but no general custom rich UI or webview. The correct product shape is therefore a local browser preview.

## Recommended Direction

- Build a Node CLI preview server using Crossnote.
- Use Zed task/process integration to pass the active file and workspace root.
- Serve a browser preview page over localhost with WebSocket updates from saved file changes.
- Implement rich copy in the browser through Clipboard API using both `text/html` and `text/plain`.
- Keep code chunk execution disabled by default and require trusted workspace opt-in.

## Feature Priority

MVP:

- Current-file browser preview from Zed.
- Live reload on save. Unsaved-buffer streaming only if Phase 0 proves a safe Zed API path.
- Rich copy selection and whole document.
- Math, Mermaid, TOC, front matter, core GFM rendering.
- HTML export.
- Trusted code chunk execution gate designed early; actual execution can ship after MVP.

Post-MVP:

- Wikilinks, backlinks, tags, graph view.
- Reveal.js presentations.
- Pandoc/eBook/Prince exports.
- Advanced diagrams and image helper workflows.

## Main Constraints

- No inline rich editor preview in Zed today.
- No VS Code-style webview panel.
- Browser-to-Zed navigation is limited; preview can open files through external `zed` CLI patterns only after testing.
- Zed command UX may need tasks as the primary launch surface.
- Rich copy behavior varies by browser and paste target.

## Chosen Assumptions

- Node CLI server with Crossnote is the fastest route to MPE parity.
- Server is per workspace, not per file, with multiple file sessions possible later.
- Server binds to localhost and uses session tokens.
- Chrome/Puppeteer and Pandoc are optional, not bundled in MVP.
- Code chunk execution requires explicit trust and user action.

## Sources

- Markdown Preview Enhanced repo: https://github.com/shd101wyy/vscode-markdown-preview-enhanced
- Crossnote repo/API: https://github.com/shd101wyy/crossnote
- MPE docs: https://shd101wyy.github.io/markdown-preview-enhanced/#/
- Zed extension docs: https://zed.dev/docs/extensions/developing-extensions
- Zed capabilities docs: https://zed.dev/docs/extensions/capabilities
- Zed tasks docs: https://zed.dev/docs/tasks

## Unresolved Questions

- Exact Zed user action surface beyond tasks needs a Phase 0 prototype.
- Exact browser launch behavior on Windows/macOS/Linux needs validation.
- Rich copy fidelity must be tested against target apps such as Word, Google Docs, Notion, Gmail, and browser editors.
- Localhost auth, path realpath containment, and server distribution must be frozen before implementation.
