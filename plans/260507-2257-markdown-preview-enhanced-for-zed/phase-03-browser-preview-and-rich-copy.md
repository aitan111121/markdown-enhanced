# Phase 03: Browser Preview and Rich Copy

## Context Links

- [Markdown Preview Enhanced report](./reports/researcher-mpe-analysis.md)
- [Crossnote Preview Server Core](./phase-02-crossnote-preview-server-core.md)

## Overview

- Priority: P1
- Status: Complete
- Goal: create the external browser preview experience and make rich formatted copy the strongest MVP feature.

## Key Insights

- Browser is the only viable rich rendering surface because Zed has no webview equivalent.
- Rich copy is not a documented MPE command; this project can improve on MPE by intentionally writing `text/html` plus `text/plain`.
- Clipboard behavior varies by browser and destination app, so fallback paths matter.

## Requirements

- Render Markdown HTML from server payloads and update when the saved file changes.
- Preserve scroll position across updates.
- Provide copy selection as rich text.
- Provide copy whole document as rich text.
- Provide plain text fallback when Clipboard API permission fails.
- Keep toolbar compact and usable in browser, without pretending it is an editor pane.
- Show render errors without breaking the previous good preview.

## Architecture

Browser modules:

- `index.ts`: app bootstrap and WebSocket lifecycle.
- `render-preview.ts`: safely replace rendered document region.
- `rich-copy.ts`: clone selected rendered DOM and write ClipboardItem.
- `plain-text-copy.ts`: fallback extraction.
- `scroll-state.ts`: preserve scroll and optional source-line anchor scroll.
- `preview-toolbar.ts`: actions for copy now; refresh/export actions stay in later phases once reloadable session behavior exists.
- `preview.css`: readable themes matching Crossnote themes.

Rich copy flow:

```text
User selection -> clone rendered DOM fragment -> inline/retain required styles -> sanitize -> ClipboardItem text/html + text/plain
```

## Related Code Files

- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\index.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\render-preview.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\rich-copy.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\plain-text-copy.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\scroll-state.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\preview-toolbar.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\preview.css`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\test\rich-copy.test.ts`.

## Implementation Steps

1. Build static preview shell served by the Node server.
2. Connect browser client to session WebSocket.
3. Render initial HTML and replace only the preview region on saved-file updates.
4. Preserve scroll on rerender and support manual line anchor scroll.
5. Implement copy selection as `text/html` and `text/plain`.
6. Implement copy full document as `text/html` and `text/plain`.
7. Add visible success/failure status for copy actions.
8. Add fallback using `navigator.clipboard.writeText` and manual selection guidance.

## Todo List

- [x] Build preview shell and WebSocket client.
- [x] Implement stable render replacement.
- [x] Implement rich copy selection.
- [x] Implement rich copy full document.
- [x] Add copy fallbacks and deterministic browser-client tests.
- [x] Add error display that preserves last good render.

**Note:** Manual browser destination compatibility testing (e.g., Google Docs, Word, Slack) deferred to Phase 7 integration testing.

## Success Criteria

- Browser opens a rendered Markdown page for the active file.
- Saved edits update without full page reload.
- Copying rendered content preserves headings, lists, tables, links, inline code, and code blocks in HTML-aware paste targets.
- Plain text fallback is available.
- Render error state is understandable and non-destructive.

## Risk Assessment

- Risk: Clipboard API requires secure context or user gesture.
- Mitigation: localhost is treated as secure in modern browsers; trigger copy from explicit button/keyboard action.
- Risk: copied styles are lost in apps like Google Docs or Word.
- Mitigation: include semantic HTML, minimal inline styles for code/table formatting, and test common destinations.

## Security Considerations

- Sanitize copied HTML.
- Strip scripts and event handlers from copied fragments.
- Do not expose local file paths in copied HTML unless links are intentionally copied.
- Test malicious Markdown HTML and ensure copy output excludes executable attributes.

## Next Steps

- Phase 4 launches this browser client from Zed tasks/extension wiring.
- Phase 5 expands renderer feature coverage (tables, footnotes, KaTeX, Mermaid enhancements).
- Phase 7 includes manual browser destination compatibility testing (Google Docs, Word, Slack, notion, etc.).
