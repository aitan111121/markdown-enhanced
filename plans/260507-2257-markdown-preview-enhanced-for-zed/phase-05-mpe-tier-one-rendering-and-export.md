# Phase 05: MPE Tier One Rendering and Export

## Context Links

- [Markdown Preview Enhanced report](./reports/researcher-mpe-analysis.md)
- [Crossnote Preview Server Core](./phase-02-crossnote-preview-server-core.md)
- [Browser Preview and Rich Copy](./phase-03-browser-preview-and-rich-copy.md)

## Overview

- Priority: P1
- Status: Complete
- Goal: deliver the feasible MPE-like rendering features that make the browser preview feel powerful without overloading the first release.

## Key Insights

- Crossnote already supports the desired Tier 1 features, but this project must adapt them to a server/browser workflow.
- HTML export is implemented through the existing sanitized `RenderPayload` path. PDF via Puppeteer remains post-MVP.
- Pandoc, eBook, Prince, D2, and advanced uploaders are not MVP dependencies.

## Requirements

- Support Markdown basics, GFM task lists, tables, footnotes, and front matter display.
- Support TOC and sidebar TOC where Crossnote provides it.
- Support KaTeX by default and MathJax as optional config.
- Support Mermaid by default.
- Support PlantUML/GraphViz only after MVP unless Crossnote enables them without extra local services.
- Support a CSS-only `.crossnote/style.less` subset; defer arbitrary head/script/parser injection.
- Support HTML export.
- Defer PDF export until after HTML export and security gates pass.

## Architecture

Feature adapter modules:

- `safe-custom-style.ts`: load and sanitize `.crossnote/style.less` as a CSS-only preview subset.
- `html-export-service.ts`: standalone HTML export from sanitized render payloads.
- Browser toolbar modules: apply custom styles and trigger HTML export.

Parity tiers:

| Feature | MVP | Notes |
|---|---|---|
| Live preview | Yes | Browser/WebSocket |
| Rich copy | Yes | Project differentiator |
| Math | Yes | KaTeX default |
| Mermaid | Yes | Local/client dependency |
| TOC/front matter | Yes | Crossnote driven |
| HTML export | Yes | Implemented from sanitized RenderPayload |
| PDF export | Later | Chrome required |
| Code chunks | Later/gated | Phase 6 trust model |
| Backlinks/tags/graph | Later | Phase 8 |
| Pandoc/eBook/Prince | Later | Heavy external deps |

## Related Code Files

- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\safe-custom-style.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\html-export-service.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\custom-style.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\html-export.ts`.
- Modify server, saved-file rendering, session contracts, preview shell, and toolbar wiring.
- Create `F:\Windows\Study\Selfhost\zed-extension\fixtures\markdown\tier-one-features.md`.

## Implementation Steps

1. Added fixture coverage for front matter, TOC, tables, task lists, footnotes, math, Mermaid, and code blocks.
2. Loaded safe `.crossnote/style.less` CSS-only customization and refreshed preview on existing style file changes.
3. Added a session-token export route for HTML output.
4. Added browser toolbar action for HTML export while preserving no-refresh behavior for one-time URLs.
5. Documented unsupported PDF, code chunks, PlantUML/GraphViz, and custom parser/head scripts as deferred.

## Todo List

- [x] Implement safe custom style loader.
- [x] Add Tier 1 render fixtures.
- [x] Add HTML export.
- [x] Document PDF export as post-MVP.
- [x] Add preview toolbar export controls.
- [x] Document deferred MPE features.

## Success Criteria

- [x] Tier 1 fixture renders correctly through the preview pipeline.
- [x] HTML export creates a usable standalone file.
- [x] PDF export is deferred with a clear roadmap entry.
- [x] Existing custom CSS changes refresh preview.

## Risk Assessment

- Risk: optional diagram tools create dependency support burden.
- Mitigation: Mermaid first; PlantUML/GraphViz only with clear optional diagnostics.
- Risk: custom parser/head injection bypasses security assumptions.
- Mitigation: defer arbitrary JS hooks; allow CSS-only customization first.

## Security Considerations

- Do not execute scripts from Markdown unless trusted mode is enabled.
- Validate custom head/parser behavior before allowing arbitrary JS hooks.
- Keep external network diagram services opt-in.
- Keep `.crossnote/style.less` CSS-only, preview-scoped, contained, size-capped, and free of CSS escapes, function-like tokens, imports, or URL fetches.

## Next Steps

- Phase 6 hardens execution, dependency audit decisions, and local server boundaries.
- Phase 8 expands beyond Tier 1 after MVP is stable.
