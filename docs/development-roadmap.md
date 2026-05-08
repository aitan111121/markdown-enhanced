# Development Roadmap

## Active Plan

The active delivery map is [plans/260507-2257-markdown-preview-enhanced-for-zed/plan.md](../plans/260507-2257-markdown-preview-enhanced-for-zed/plan.md).

## Current Status

- Phase 0: Complete. Zed task launch, saved-file, distribution, and security baselines are proven for implementation.
- Phase 1: Complete. Repository contracts and scaffold are established for Node, browser, and Rust extension paths.
- Phase 2: In progress. Crossnote preview server core is the active implementation focus.
- Phases 3-8: Pending Phase 2 server core and downstream integration gates.

## MVP Gates

- Zed launch path uses project tasks unless a richer extension command path is proven.
- Daily use should be one configured Zed keybinding/action that opens or reuses preview.
- Preview updates saved file content only.
- Server distribution starts as an npm workspace/package CLI.
- Code execution, custom parser JavaScript, public bind, and export-time chunk execution remain disabled by default.