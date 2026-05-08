# Project Changelog

## 2026-05-08 Phase 6-8 Release Readiness

- Added token helper functions with fixed-time comparison and moved Host/Origin validation into a dedicated localhost-only policy module.
- Hardened path input handling for UNC-style paths, malformed percent encoding, encoded traversal, and symlink escapes outside the workspace.
- Added passive trusted-workspace policy and code-chunk gate modules; runnable code chunks now produce diagnostics and remain blocked in `0.1.0`.
- Added security audit logging for blocked requests and invalid preview, WebSocket, export, and control tokens without logging token values.
- Moved browser clipboard HTML sanitization into a focused `safe-html` module and strips diagnostic banners from copied fragments.
- Added root npm package release metadata, `zed-mpe` binary mapping, package file allowlist, MIT license, third-party notices, release smoke script, and Zed release checklist.
- Added `docs/security.md` and `docs/feature-parity.md` to document the release security model and post-MVP MPE parity tracks.

## 2026-05-08 Phase 5 Tier One Rendering and Export

- Added a Tier 1 Markdown fixture covering front matter, TOC headings, tables, task lists, footnotes, KaTeX, Mermaid, and code blocks.
- Added a conservative `.crossnote/style.less` CSS-only subset with path containment, a 64 KiB size cap, preview-scoped selectors, and rejection for imports, URL fetches, executable CSS patterns, and global selectors.
- Added browser CSP nonce plumbing for dynamic custom preview styles.
- Added `POST /api/export/html`, protected by the browser session token, to export the current saved preview as standalone sanitized HTML without accepting browser-provided file paths.
- Added a browser toolbar `Export HTML` action with download and failure feedback.
- Documented that PDF export, direct Crossnote export APIs, arbitrary `.crossnote/config.js`, `head.html`, parser hooks, PlantUML/GraphViz, and code chunks remain deferred.

## 2026-05-08 Phase 2 Crossnote Bridge

- Added `crossnote@0.9.24` to the server package.
- Replaced the markdown-it-only primary render path with real Crossnote notebook initialization via `Notebook.init()` and `getNoteMarkdownEngine()`.
- Kept markdown-it as a safe fallback if Crossnote initialization or rendering fails.
- Added safe Crossnote defaults for KaTeX math, front matter table rendering, Mermaid theme selection, disabled script execution, disabled code chunks, inert parser hooks, and empty custom header/global CSS.
- Initialized Crossnote from a server-owned temporary notebook root so workspace `.crossnote/config.js` cannot override Phase 2 safety defaults.
- Disabled Crossnote `@import` expansion in the Phase 2 preview path to prevent unvalidated local file reads and remote fetches.
- Added post-render preview HTML hardening for scripts, styles, iframes, object/embed/applet containers, inline event handlers, and executable URL attributes.
- Added renderer and saved-file tests for front matter metadata, KaTeX math, Mermaid preview blocks, script stripping, Crossnote heading IDs, TOC extraction, hostile `.crossnote/config.js` isolation, disabled imports, and active HTML stripping.
- Verified the full server suite at 55 passing tests after the bridge and import hardening.
- Security note: npm audit still reports 3 moderate Crossnote transitive findings through `markdown-it-html5-embed` -> nested `markdown-it@8.4.2`; no upstream fix is available, and Phase 2 keeps the affected feature surface disabled by default, unreachable from workspace config, and insulated from Crossnote `@import` expansion.

## 2026-05-08 Phase 4 Zed Launch Integration

- Documented the Zed `task::Spawn` keybinding path for `MPE Preview Current File`.
- Updated the preview task to save the current file, launch without stealing focus, and allow repeated launch attempts.
- Added `MPE Build Node Packages` task for missing build diagnostics.
- Added per-workspace server reuse: repeated CLI launches request a fresh one-time preview URL from the existing localhost server.
- Added a control-token `POST /sessions` route for local CLI reuse without exposing control tokens in browser HTML or `/health`.
- Added server tests for reuse, stale state cleanup, and control endpoint authorization.
- Stabilized Windows watcher debounce testing under full-suite load and recorded the lesson in repository instructions.

## 2026-05-08 Phase 2/3 Implementation

**Server Core (Phase 2)**
- Implemented safe markdown-it renderer adapter with path containment, size validation, and escape security.
- Added workspace session store for file/workspace tracking.
- Implemented debounced file watcher with stale render suppression.
- Added WebSocket preview update channel with Host/Origin validation and token authentication.
- Implemented single-use preview bootstrap token plus separate WebSocket session tokens.
- Added error handling with safe error messages (no environment/path leaks).
- Built 35+ server unit tests covering path safety, safe render defaults, large files, and file watch semantics.
- Verified npm build, typecheck, and test suite success (38 server tests).
- Note: Crossnote `Notebook.init()` integration deferred; current adapter uses markdown-it for safe rendering.

**Browser Client (Phase 3)**
- Implemented modular browser preview client with WebSocket lifecycle.
- Added scroll-preserving preview updates on saved-file changes.
- Implemented rich copy for selection (text/html + text/plain).
- Implemented rich copy for full document (text/html + text/plain).
- Added clipboard sanitization stripping scripts and event handlers.
- Built preview toolbar with copy and error state UX.
- Implemented plain-text fallback for copy operations.
- Built 20 browser client unit tests.
- Verified browser smoke tests (preview 200, assets 200, bad Origin 403).

## 2026-05-08 Phase 0/1 Initial Scaffold

- Added Phase 0/1 repository scaffold for the Zed Markdown Preview Enhanced MVP.
- Documented task-based launch, saved-file update semantics, npm CLI distribution, and initial threat model.
- Added localhost-only server skeleton with tokenized preview URLs and WebSocket bootstrap.
- Added initial Zed task templates and Rust extension skeleton.
- Hardened the scaffold with one-time preview bootstrap tokens, separate WebSocket tokens, CSP/no-store preview shell headers, public-bind rejection, generic HTTP 500 responses, guarded WebSocket upgrade parsing, and bounded render-time file reads.
- Added server tests for path containment, render escaping, render-time size caps, public-bind rejection, health token non-exposure, preview token replay, and preview shell security headers.
- Validated the Rust extension scaffold with `cargo check` and `cargo test`, and ignored generated Rust build output.
- Closed Phase 0 after the in-Zed smoke tasks passed, moved Phase 2 to active, and tightened Phase 4 around a one-action daily preview workflow.