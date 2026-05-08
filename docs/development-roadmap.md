# Development Roadmap

## Active Plan

The active delivery map is [plans/260507-2257-markdown-preview-enhanced-for-zed/plan.md](../plans/260507-2257-markdown-preview-enhanced-for-zed/plan.md).

## Current Status

- Phase 0: Complete. Zed task launch, saved-file, distribution, and security baselines are proven for implementation.
- Phase 1: Complete. Repository contracts and scaffold are established for Node, browser, and Rust extension paths.
- Phase 2: Mostly complete. Server core with safe markdown-it adapter, file watching, WebSocket updates, and Host/Origin validation complete; Crossnote Notebook.init integration pending.
- Phase 3: Complete. Browser client with scroll-preserving render, rich copy (selection + full document), and error handling complete.
- Phase 4: Complete. Zed task/keybinding workflow, current-file save behavior, per-workspace server reuse, and launch diagnostics are implemented.
- Phase 5: Pending remaining Phase 2 Crossnote integration work.
- Phases 6-8: Pending downstream security, release, and parity work.

## MVP Gates

- Zed launch path uses project tasks unless a richer extension command path is proven.
- Daily use should be one configured Zed keybinding/action that opens or reuses preview.
- Preview updates saved file content only.
- Server distribution starts as an npm workspace/package CLI.
- Code execution, custom parser JavaScript, public bind, and export-time chunk execution remain disabled by default.