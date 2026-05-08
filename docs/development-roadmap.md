# Development Roadmap

## Active Plan

The completed MVP delivery map is [plans/260507-2257-markdown-preview-enhanced-for-zed/plan.md](../plans/260507-2257-markdown-preview-enhanced-for-zed/plan.md). The current maturity roadmap is [plans/260508-1657-secure-extension-maturity-roadmap/plan.md](../plans/260508-1657-secure-extension-maturity-roadmap/plan.md).

## Current Status

- Phase 0: Complete. Zed task launch, saved-file, distribution, and security baselines are proven for implementation.
- Phase 1: Complete. Repository contracts and scaffold are established for Node, browser, and Rust extension paths.
- Phase 2: Complete. Server core renders through Crossnote `Notebook.init()` and `getNoteMarkdownEngine()` with safe defaults, markdown-it fallback, file watching, WebSocket updates, and Host/Origin validation.
- Phase 3: Complete. Browser client with scroll-preserving render, rich copy (selection + full document), and error handling complete.
- Phase 4: Complete. Zed task/keybinding workflow, current-file save behavior, per-workspace server reuse, and launch diagnostics are implemented.
- Phase 5: Complete. Tier-one rendering fixtures, safe `.crossnote/style.less`, session-token HTML export, and toolbar export controls are implemented; PDF remains post-MVP.
- Phase 6: Complete. Security hardening adds token comparison, origin policy extraction, path traversal rejection, passive trust/code-chunk diagnostics, audit logging, and clipboard diagnostic cleanup while keeping execution disabled.
- Phase 7: Complete. Release readiness adds npm package metadata, root license/notices, package smoke automation, Zed dev-extension checklist, and release docs.
- Phase 8: Complete as roadmap. Feature parity is tracked in a support/deferred matrix; post-MVP runtime features remain demand-driven.

## Maturity Roadmap Status

- Phase 1: CLI diagnostics, setup guidance, stale reuse warnings, browser-open failure guidance, and package smoke coverage are implemented.
- Phase 2: Docs-team integration guide, public roadmap, package docs inclusion, and security-review framing are implemented.
- Phase 3: Browser review UX now includes status feedback, left/right contents sidebar, heading fragment copy, and copy/export exclusion for UI chrome.
- Phase 4: Passive workspace link diagnostics classify local/remote/unsafe targets without fetching or mutating files.
- Phase 5: Hybrid webview evolution is documented as an adapter boundary over the current render/session/security core.
- Phase 6: Browser draft editing is explicit, token-gated, stale-checked, backed up, and atomic; it remains off until the user starts a draft.

## MVP Gates

- Zed launch path uses project tasks unless a richer extension command path is proven.
- Daily use should be one configured Zed keybinding/action that opens or reuses preview.
- Preview updates saved file content only.
- Server distribution starts as an npm workspace/package CLI.
- Code execution, custom parser JavaScript, public bind, and export-time chunk execution remain disabled by default.
- Zed registry readiness requires local gates, package smoke, accepted license, and dev-extension validation before submission.

## Risk Gates

- Code execution, custom parser JavaScript, public bind, remote preview, and credential workflows remain excluded until separate security review.
- Browser editing must stay explicit. No background autosave, browser-supplied destination paths, or multi-file mutation.
- Future native Zed surfaces must reuse the same containment, token/session, sanitization, and write-safety invariants.