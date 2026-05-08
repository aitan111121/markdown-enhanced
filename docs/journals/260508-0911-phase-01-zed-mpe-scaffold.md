# Phase 0/1 Zed MPE Scaffold

---
date: 2026-05-08 09:11
status: validated
component: zed task, rust extension shell, typescript preview server, browser preview shell
---

## Context

User ran `/ck:cook --parallel` on `plans/260507-2257-markdown-preview-enhanced-for-zed/plan.md` with strict repository instruction compliance. Goal: create the first safe scaffold for a Zed Markdown Preview Enhanced workflow.

## What Happened

- Added a minimal Zed extension shell with `extension.toml`, `Cargo.toml`, and `src/lib.rs`.
- Added npm workspaces for `packages/server` and `packages/browser-preview`.
- Added `zed-mpe preview` CLI contract for saved-file preview from Zed tasks.
- Added `.zed/tasks.json` with current-file preview and task variable smoke checks.
- Added a local HTTP/WebSocket preview server with `/health`, tokenized preview shell, and static assets.
- Added a browser client that connects over WebSocket and renders escaped placeholder HTML.
- Added docs for architecture, contracts, threat model, usage, distribution, code standards, roadmap, and changelog.
- Added tests for path containment, render escaping, file size caps, public-bind rejection, token replay, health token non-exposure, and preview shell headers.

## Decisions

- External browser preview is the MVP surface because Zed has no VS Code-style webviews.
- MVP update semantics are saved-file only through `save: "current"`.
- Server binds to `127.0.0.1`; public bind disabled by default.
- One-time preview bootstrap token and separate WebSocket token protect browser sessions.
- Preview shell uses external script, CSP, and `Cache-Control: no-store` for token-bearing HTML.
- Source paths use `realpath` containment and bounded render reads.
- Crossnote code execution, custom parser JavaScript, public bind, and `runAllCodeChunks` stay off by default.

## Validation

- `npm run build:node` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test --workspaces --if-present` passed with 10 server tests.
- `cargo check` passed after adding the installed Cargo binary to the session PATH.
- `cargo test` passed.
- CLI health smoke passed against `README.md`; `/health` returned `ok: true`.
- VS Code diagnostics found no errors.

## Gaps

- Manual in-Zed task smoke remains pending: run `MPE Smoke: Print Zed File Context` and `MPE Preview Current File` inside Zed.
- Phase 2 Crossnote rendering should wait until the Zed task smoke is accepted or explicitly deferred.

## Next

- Push the Phase 0/1 scaffold branch.
- Open PR with validation results, Rust note, CLI smoke result, and the remaining manual Zed smoke gap.