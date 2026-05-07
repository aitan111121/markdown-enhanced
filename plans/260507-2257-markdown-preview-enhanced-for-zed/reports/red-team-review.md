# Red Team Review Summary

## Status

DONE_WITH_CONCERNS. Plan direction is correct, but implementation gates needed to move earlier.

## High Severity Findings

- Security was planned too late. Crossnote execution, exports, custom parser hooks, and copied HTML need safe defaults before server/browser work depends on them.
- Live preview was overpromised. File watchers see saved files, not unsaved Zed buffers. MVP must be save-based unless a Zed API proof says otherwise.
- Zed integration is a blocker. Task-based UX is reliable; richer extension command UX needs proof before relying on it.
- Localhost auth was underspecified. Token handling, Host/Origin validation, CORS, WebSocket CSRF, and token replay need explicit tests.

## Medium Severity Findings

- Path safety must cover Windows drives, case, symlinks, junctions, UNC paths, URL-encoded traversal, and Crossnote asset resolution.
- Parallel dependencies were too loose. Phase 0 and Phase 1 must freeze launch path, threat model, distribution, and contracts first.
- MVP was too broad. PDF, trusted code chunk execution, custom parser/head JS, PlantUML/GraphViz, and advanced exports should move after the rich-copy MVP.
- Packaging strategy must be decided before implementation because it affects capabilities and install flow.
- Tests need lifecycle, cross-platform launch, auth, path traversal, stale render, large file, malicious Markdown, and paste destination coverage.

## Plan Edits Applied

- Added Phase 0 for feasibility, security, and distribution gates.
- Clarified MVP preview updates saved files unless unsaved-buffer streaming is proven.
- Moved security defaults into Phase 1/2 contracts.
- Narrowed MVP feature scope around rich preview, rich copy, safe GFM/math/Mermaid, and HTML export.
- Moved PDF, trusted code chunks, arbitrary head/parser JS, and advanced diagrams to post-MVP.
- Expanded localhost auth, path safety, and test matrices.
