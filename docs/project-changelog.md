# Project Changelog

## 2026-05-08

- Added Phase 0/1 repository scaffold for the Zed Markdown Preview Enhanced MVP.
- Documented task-based launch, saved-file update semantics, npm CLI distribution, and initial threat model.
- Added localhost-only server skeleton with tokenized preview URLs and WebSocket bootstrap.
- Added initial Zed task templates and Rust extension skeleton.
- Hardened the scaffold with one-time preview bootstrap tokens, separate WebSocket tokens, CSP/no-store preview shell headers, public-bind rejection, generic HTTP 500 responses, guarded WebSocket upgrade parsing, and bounded render-time file reads.
- Added server tests for path containment, render escaping, render-time size caps, public-bind rejection, health token non-exposure, preview token replay, and preview shell security headers.
- Validated the Rust extension scaffold with `cargo check` and `cargo test`, and ignored generated Rust build output.
- Closed Phase 0 after the in-Zed smoke tasks passed, moved Phase 2 to active, and tightened Phase 4 around a one-action daily preview workflow.