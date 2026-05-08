# Feature Parity Matrix

This matrix tracks Markdown Preview Enhanced compatibility for the Zed external-browser architecture. `0.1.0` prioritizes secure saved-file preview, rich copy, and HTML export. Advanced features remain demand-driven.

| Feature | MPE Behavior | Zed `0.1.0` Support | Blocker | Security Note | Target |
|---|---|---:|---|---|---|
| Current-file preview | Inline VS Code webview preview. | Supported through external browser. | Zed has no webview API. | Localhost tokenized preview only. | `0.1.0` |
| Save-based updates | Updates from editor content. | Supported from saved file. | Unsaved buffer API not proven. | Avoids exposing editor buffer transport. | `0.1.0` |
| Rich copy | Copy rendered HTML/plain text. | Supported for selection and full document. | Browser Clipboard API permissions. | Sanitizes scripts, events, local URLs, and tokens. | `0.1.0` |
| GFM tables/tasks | Render common Markdown extensions. | Supported through Crossnote/fallback coverage. | None known. | Output post-filtered. | `0.1.0` |
| KaTeX math | Render inline/block math. | Supported. | Crossnote dependency. | Script execution remains off. | `0.1.0` |
| Mermaid | Render Mermaid preview blocks. | Partial. | Browser-side diagram behavior depends on Crossnote output. | Remote diagram services disabled. | `0.1.x` |
| Front matter | Parse/display metadata. | Supported in payload metadata. | UI display is minimal. | No parser JavaScript. | `0.1.0` |
| TOC | Generated headings. | Supported in metadata/rendered output. | Sidebar UI deferred. | Static rendering only. | `0.1.0` |
| `.crossnote/style.less` | User styles and Less features. | Partial CSS-only subset. | Less evaluation is unsafe. | Scoped selectors only, no imports/URLs/functions. | `0.1.0` |
| HTML export | Export rendered document. | Supported as sanitized standalone HTML. | Direct Crossnote export deferred. | No browser-provided paths. | `0.1.0` |
| PDF export | Puppeteer/Chrome export. | Deferred. | Heavy dependency and browser binary support. | Must not run chunks during export. | `0.2.x` |
| Pandoc export | DOCX, RTF, Beamer, citations. | Deferred. | External binary detection and citation config. | File/path and command execution review needed. | `0.3.x` |
| Code chunks | Execute commands from Markdown. | Deferred; detected and blocked. | Requires explicit trust model and UI. | Arbitrary local command execution. | Security review |
| Custom parser JS | User parser hooks. | Deferred. | Arbitrary JavaScript execution. | Disabled by safe config. | Security review |
| `head.html` | User header injection. | Deferred. | Script/style injection risk. | Disabled by safe config. | Security review |
| Crossnote imports | Include local/remote content. | Deferred; import directives escaped. | Resolver policy not implemented. | Prevents file disclosure/remote fetches. | `0.2.x` |
| Wikilinks | Navigate note links. | Deferred. | Needs workspace note index. | Must stay inside workspace. | Knowledge-base track |
| Backlinks/tags | Index references and tags. | Deferred. | Needs indexing service and browser panel. | Size caps and path containment needed. | Knowledge-base track |
| Graph view | Visual note graph. | Deferred. | Browser graph UI and index model. | Static local data only. | Knowledge-base track |
| Reveal.js slides | Presentation mode. | Deferred. | Separate route and asset policy. | No remote scripts by default. | Presentation track |
| PlantUML/GraphViz/Kroki | Advanced diagrams. | Deferred. | External binary/service choices. | Network providers opt-in only. | Diagram track |
| Image helper/upload | Upload or rewrite image assets. | Deferred. | Credentials and file mutation workflow. | Requires separate credential review. | Not scheduled |
| Remote/public preview | Serve beyond localhost. | Not supported. | DNS rebinding and auth redesign. | Public bind disabled. | Not scheduled |

## Post-MVP Tracks

1. Knowledge base: wikilinks, backlinks, tags, graph.
2. Export: PDF, Pandoc, citations, eBook formats.
3. Diagrams: PlantUML, GraphViz, Kroki, WaveDrom, Vega.
4. Presentation: Reveal.js browser route.

Do not start trusted code execution, remote preview, or credential-bearing image workflows without a separate security phase.