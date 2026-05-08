---
title: "Markdown Preview Enhanced for Zed"
description: "Build a Zed workflow that launches a secure Crossnote-powered local browser preview with rich formatted copy."
status: in-progress
priority: P1
effort: 11w
issue:
branch: devops/update_devops
tags: [feature, markdown, zed-extension, backend, frontend, security]
blockedBy: []
blocks: []
created: 2026-05-07
mode: parallel
---

# Markdown Preview Enhanced for Zed

## Overview

Create a Zed extension/workflow inspired by Markdown Preview Enhanced. Zed does not support VS Code-style webviews or inline rich preview, so the product will use a thin Zed integration plus a local Node CLI preview server powered by Crossnote. The first release promise is: open the current saved Markdown file in a browser preview and copy rendered content as formatted HTML plus plain text.

## Decisions

- Scope: expansion, but ship in tiers.
- Runtime: Node CLI server with Crossnote.
- Preview surface: external browser, not inline Zed UI.
- Code chunks: trusted opt-in only, disabled by default.
- MVP priority: saved-file rich preview plus rich copy.
- MVP update semantics: saved-file updates unless Phase 0 proves a safe unsaved-buffer stream from Zed.

## Cross-Plan Dependencies

No unfinished existing plans found. Workspace was empty at creation time.

## Research

- [Markdown Preview Enhanced report](./reports/researcher-mpe-analysis.md)
- [Zed extension constraints report](./reports/researcher-001-zed-extension-architecture.md)
- [Research synthesis](./research/research-synthesis.md)
- [Workspace scout report](./reports/scout-report.md)

## Phases

| Phase | Name | Status | Effort |
|---|---|---:|---:|
| 0 | [Feasibility Security and Distribution Gates](./phase-00-feasibility-security-and-distribution-gates.md) | In Progress | 0.5w |
| 1 | [Repository Contracts and Scaffold](./phase-01-repository-contracts-and-scaffold.md) | Complete | 1w |
| 2 | [Crossnote Preview Server Core](./phase-02-crossnote-preview-server-core.md) | Pending | 2w |
| 3 | [Browser Preview and Rich Copy](./phase-03-browser-preview-and-rich-copy.md) | Pending | 1.5w |
| 4 | [Zed Launch Integration](./phase-04-zed-extension-launch-integration.md) | Pending | 1w |
| 5 | [MPE Tier One Rendering and Export](./phase-05-mpe-tier-one-rendering-and-export.md) | Pending | 1.5w |
| 6 | [Security Permissions and Trusted Execution](./phase-06-security-permissions-and-trusted-execution.md) | Pending | 1w |
| 7 | [Testing Packaging and Release](./phase-07-testing-packaging-and-release.md) | Pending | 1w |
| 8 | [Enhanced Parity Roadmap](./phase-08-enhanced-parity-roadmap.md) | Pending | ongoing |

## Parallel Strategy

- Phase 0 must complete before implementation. It proves Zed launch UX, update semantics, distribution path, and security gates.
- Phase 1 freezes contracts and threat model.
- Phase 2 delivers a secure minimal saved-file server before browser work depends on it.
- Phase 3 starts after Phase 2 provides stable preview payload stubs.
- Phase 4 can run after Phase 0 launch path and Phase 1 CLI contract are frozen.
- Phase 5 only adds features allowed by Phase 0/1 security gates; Phase 6 completes hardening and trusted execution design.
- Phase 7 is the final integration gate.
- Phase 8 is post-MVP expansion.

## Key Dependencies

- Zed extension API, Rust, WebAssembly, `extension.toml`.
- Node.js CLI server, Crossnote, markdown-it, KaTeX, Mermaid.
- Browser Clipboard API for `text/html` plus `text/plain` copy.
- Zed tasks or process capability for current-file launch.
- Optional later: Puppeteer, Pandoc, PlantUML/Kroki, Reveal.js, trusted code chunk execution.

## Handoff

Implementation command after review:

```bash
/ck:cook --parallel F:\Windows\Study\Selfhost\zed-extension\plans\260507-2257-markdown-preview-enhanced-for-zed\plan.md
```
