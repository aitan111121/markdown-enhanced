# Plan Sync: Phase 2/3

Date: 2026-05-08
Status: done
Phases: 02 Crossnote Preview Server Core, 03 Browser Preview and Rich Copy

## Updates

- plan.md: Phase 3 moved from Pending to Complete; Phase 2 remains In Progress.
- Phase 2: split completed MVP server core work from remaining Crossnote integration work.
- Phase 3: marked browser preview and rich-copy tasks complete; deferred manual paste-destination checks to Phase 7.

## Validation

- npm install: success, 0 vulnerabilities.
- npm run lint: success.
- npm run typecheck: success.
- npm run build: success, including cargo check.
- npm run test: success, 38 server tests, 20 browser tests, and cargo test passing.
- Smoke: preview shell 200, /assets/browser-preview.js 200, /assets/render-preview.js 200, bad Origin 403.
- GitNexus: analyzed and up to date; detect_changes risk is high due expected server/browser/security surface.
- Review: code-reviewer re-review found no blockers after removing reload-based Refresh and adding window-scroll preservation tests.

## Scope Clarity

Phase 2 is not complete. The server now has a safe markdown-it adapter, file watching, token-gated WebSocket updates, Host/Origin validation, and tests. True Crossnote `Notebook.init()` and `getNoteMarkdownEngine()` integration remains pending.

Phase 3 is complete for MVP browser preview and rich copy. Manual paste fidelity checks for Google Docs, Word, Slack, Notion, and similar targets remain Phase 7 work.
