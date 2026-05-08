# Project Changelog

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
- Built 17+ browser client unit tests.
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