# Phase 07: Testing Packaging and Release

## Context Links

- [Repository Contracts and Scaffold](./phase-01-repository-contracts-and-scaffold.md)
- [Zed Launch Integration](./phase-04-zed-extension-launch-integration.md)
- [Security Permissions and Trusted Execution](./phase-06-security-permissions-and-trusted-execution.md)

## Overview

- Priority: P1
- Status: Pending
- Goal: prove the MVP works in real Zed workflows and package it so users can install and trust it.

## Key Insights

- The biggest integration risk is not Markdown rendering. It is Zed launch UX, process lifecycle, browser handoff, and dependency install.
- Zed publishing requires accepted extension license and tested dev extension behavior.
- Browser clipboard must be tested in real browsers, not only unit tests.

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

- Create `F:\Windows\Study\Selfhost\zed-extension\README.md`.
- Create `F:\Windows\Study\Selfhost\zed-extension\LICENSE`.
- Create `F:\Windows\Study\Selfhost\zed-extension\THIRD-PARTY-NOTICES.md`.
- Create `F:\Windows\Study\Selfhost\zed-extension\docs\usage.md`.
- Create `F:\Windows\Study\Selfhost\zed-extension\docs\security.md`.
- Create `F:\Windows\Study\Selfhost\zed-extension\docs\feature-parity.md`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\test\*.test.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\test\*.spec.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\fixtures\markdown\*.md`.

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

- [ ] Add server unit and integration tests.
- [ ] Add browser E2E tests for rich copy.
- [ ] Add lifecycle, path safety, auth, and cross-platform launch matrix.
- [ ] Add Rust/Zed extension build checks.
- [ ] Add manual Zed validation checklist.
- [ ] Add docs and license notices.
- [ ] Run full package smoke test.

## Success Criteria

- Full test suite passes locally.
- Zed dev extension install works from a clean checkout.
- Current-file preview task works on Windows, macOS, and Linux or documented platform gaps exist.
- Rich copy is manually verified in at least two HTML-aware destinations.
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

- Phase 8 continues feature parity after MVP release.
