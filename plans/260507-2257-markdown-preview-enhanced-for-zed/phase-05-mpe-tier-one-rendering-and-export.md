# Phase 05: MPE Tier One Rendering and Export

## Context Links

- [Markdown Preview Enhanced report](./reports/researcher-mpe-analysis.md)
- [Crossnote Preview Server Core](./phase-02-crossnote-preview-server-core.md)
- [Browser Preview and Rich Copy](./phase-03-browser-preview-and-rich-copy.md)

## Overview

- Priority: P1
- Status: Pending
- Goal: deliver the feasible MPE-like rendering features that make the browser preview feel powerful without overloading the first release.

## Key Insights

- Crossnote already supports the desired Tier 1 features, but this project must adapt them to a server/browser workflow.
- HTML export is low friction. PDF via Puppeteer is valuable but should stay optional if Chrome is missing.
- Pandoc, eBook, Prince, D2, and advanced uploaders are not MVP dependencies.

## Requirements

- Support Markdown basics, GFM task lists, tables, footnotes, and front matter display.
- Support TOC and sidebar TOC where Crossnote provides it.
- Support KaTeX by default and MathJax as optional config.
- Support Mermaid by default.
- Support PlantUML/GraphViz only after MVP unless Crossnote enables them without extra local services.
- Support custom CSS through `.crossnote/style.less`; defer arbitrary head/script/parser injection.
- Support HTML export.
- Defer PDF export until after HTML export and security gates pass.

## Architecture

Feature adapter modules:

- `crossnote-config-loader.ts`: load `.crossnote/config.js`, `head.html`, `style.less`.
- `render-feature-flags.ts`: map server config to Crossnote notebook config.
- `export-service.ts`: HTML and optional PDF export.
- `diagram-service.ts`: feature detection and clear diagnostics.
- `theme-service.ts`: preview and code block theme selection.

Parity tiers:

| Feature | MVP | Notes |
|---|---|---|
| Live preview | Yes | Browser/WebSocket |
| Rich copy | Yes | Project differentiator |
| Math | Yes | KaTeX default |
| Mermaid | Yes | Local/client dependency |
| TOC/front matter | Yes | Crossnote driven |
| HTML export | Yes | Low risk |
| PDF export | Later | Chrome required |
| Code chunks | Later/gated | Phase 6 trust model |
| Backlinks/tags/graph | Later | Phase 8 |
| Pandoc/eBook/Prince | Later | Heavy external deps |

## Related Code Files

- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\crossnote-config-loader.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\render-feature-flags.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\export-service.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\diagram-service.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\theme-service.ts`.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\preview-toolbar.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\fixtures\markdown\tier-one-features.md`.

## Implementation Steps

1. Map project settings to Crossnote `NotebookConfig` defaults.
2. Load safe `.crossnote` local customization files and refresh preview on changes.
3. Add fixture coverage for front matter, TOC, tables, task lists, footnotes, math, Mermaid, and code blocks.
4. Add export route for HTML output.
5. Add clear unsupported-feature notices for deferred PDF, code chunks, PlantUML/GraphViz, and custom parser/head scripts.
6. Add browser toolbar actions for refresh, copy, and HTML export.

## Todo List

- [ ] Implement Crossnote config loader.
- [ ] Add Tier 1 render fixtures.
- [ ] Add HTML export.
- [ ] Document PDF export as post-MVP.
- [ ] Add preview toolbar export controls.
- [ ] Document deferred MPE features.

## Success Criteria

- Tier 1 fixture renders correctly in browser preview.
- HTML export creates a usable standalone file.
- PDF export is deferred with a clear roadmap entry.
- Custom CSS changes refresh preview.

## Risk Assessment

- Risk: optional diagram tools create dependency support burden.
- Mitigation: Mermaid first; PlantUML/GraphViz only with clear optional diagnostics.
- Risk: custom parser/head injection bypasses security assumptions.
- Mitigation: defer arbitrary JS hooks; allow CSS-only customization first.

## Security Considerations

- Do not execute scripts from Markdown unless trusted mode is enabled.
- Validate custom head/parser behavior before allowing arbitrary JS hooks.
- Keep external network diagram services opt-in.

## Next Steps

- Phase 6 hardens execution and local server boundaries.
- Phase 8 expands beyond Tier 1 after MVP is stable.
