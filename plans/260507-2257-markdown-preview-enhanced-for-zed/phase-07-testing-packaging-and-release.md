# Phase 07: Testing Packaging and Release

## Context Links

- [Repository Contracts and Scaffold](./phase-01-repository-contracts-and-scaffold.md)
- [Zed Launch Integration](./phase-04-zed-extension-launch-integration.md)
- [Security Permissions and Trusted Execution](./phase-06-security-permissions-and-trusted-execution.md)

## Overview

- Priority: P1
- Status: Complete
- Goal: prove the MVP works in real Zed workflows and package it so users can install and trust it.

## Key Insights

- The biggest integration risk is not Markdown rendering. It is Zed launch UX, process lifecycle, browser handoff, and dependency install.
- Zed publishing requires accepted extension license and tested dev extension behavior.
- Browser clipboard must be tested in real browsers, not only unit tests.
- Zed registry publishing also requires a PR to `zed-industries/extensions` with an HTTPS submodule and matching `extension.toml` version.

## Requirements

- Add unit tests for server, renderer adapter, path safety, trust policy, and copy helpers.
- Add browser tests for live preview, reconnect, rich copy, and errors.
- Add lifecycle and security matrix tests for port races, multiple workspaces, stale renders, server crash/reconnect, expired tokens, and unsaved-buffer behavior.
- Add fixture Markdown documents covering Tier 1 features.
- Add manual Zed validation checklist.
- Add package scripts for extension build and server build.
- Add README and usage docs.
- Prepare license and third-party notice files.

## Architecture

Validation layers:

```text
Unit tests -> server integration tests -> browser E2E -> Zed dev extension checklist -> package smoke test
```

Packaging layers:

- Rust/WASM extension package.
- Node CLI package or bundled server distribution.
- `.zed/tasks.json` example.
- Docs and release checklist.

## Related Code Files

- Updated `F:\Windows\Study\Selfhost\zed-extension\README.md`.
- Created `F:\Windows\Study\Selfhost\zed-extension\LICENSE`.
- Created `F:\Windows\Study\Selfhost\zed-extension\THIRD-PARTY-NOTICES.md`.
- Updated `F:\Windows\Study\Selfhost\zed-extension\docs\usage.md`.
- Created `F:\Windows\Study\Selfhost\zed-extension\docs\security.md`.
- Created `F:\Windows\Study\Selfhost\zed-extension\docs\feature-parity.md`.
- Created `F:\Windows\Study\Selfhost\zed-extension\docs\release-checklist.md`.
- Added security tests under `F:\Windows\Study\Selfhost\zed-extension\packages\server\test\`.
- Extended browser preview tests under `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\test\`.
- Kept the Phase 5 Tier 1 fixture as the release rendering fixture.

## Implementation Steps

1. Add unit test runner for Node packages.
2. Add Rust extension build check.
3. Add browser E2E tests with a local server and Chromium/Edge.
4. Add Markdown fixture suite for rendering parity.
5. Add security fixtures for malicious Markdown, malicious `.crossnote` files, traversal, symlink/junction escape, Host/Origin failures, and token replay.
6. Add cross-platform task launch tests or manual checklist for Windows, macOS, and Linux shell argument behavior.
7. Add manual rich-copy destination matrix: Word, Google Docs, Notion, Gmail, and browser contenteditable.
8. Add manual Zed dev extension install checklist.
9. Add package smoke test that starts server from installed package.
10. Add README with Zed task usage and first-run flow.
11. Add security docs covering trusted code chunks and local server behavior.
12. Add third-party license notices for Crossnote and core dependencies.

## Todo List

- [x] Add server unit and integration tests.
- [x] Add deterministic browser tests for rich copy and diagnostics.
- [x] Add lifecycle, path safety, auth, and cross-platform launch checklist coverage.
- [x] Add Rust/Zed extension build checks through `npm run build`.
- [x] Add manual Zed validation checklist.
- [x] Add docs and license notices.
- [x] Add package smoke test script.

## Success Criteria

- Full test suite passes locally.
- Zed dev extension install checklist is documented for clean checkout validation.
- Current-file preview task works on Windows, macOS, and Linux or documented platform gaps exist.
- Rich copy manual destination matrix is documented for release validation.
- Unsaved-buffer behavior is tested and documented.
- README is enough for a new user to install and run preview.

## Risk Assessment

- Risk: Zed extension packaging rejects repository structure or license.
- Mitigation: verify against Zed publishing docs before release.
- Risk: browser copy tests are flaky.
- Mitigation: keep deterministic unit tests for HTML generation and use E2E for user gesture/permission paths only.

## Security Considerations

- Include a visible security warning in README.
- Document that trusted code chunks can run arbitrary local commands.
- Document localhost binding and token behavior.

## Next Steps

- Phase 8 continues as the feature parity matrix after MVP release.
