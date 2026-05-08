---
title: "Markdown Preview Enhanced for Zed"
description: "Build a Zed workflow that launches a secure Crossnote-powered local browser preview with rich formatted copy."
status: complete
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
- MVP daily workflow: one Zed keybinding/task action opens or reuses a browser preview for the current saved Markdown file.
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
| 0 | [Feasibility Security and Distribution Gates](./phase-00-feasibility-security-and-distribution-gates.md) | Complete | 0.5w |
| 1 | [Repository Contracts and Scaffold](./phase-01-repository-contracts-and-scaffold.md) | Complete | 1w |
| 2 | [Crossnote Preview Server Core](./phase-02-crossnote-preview-server-core.md) | Complete | 2w |
| 3 | [Browser Preview and Rich Copy](./phase-03-browser-preview-and-rich-copy.md) | Complete | 1.5w |
| 4 | [Zed Launch Integration](./phase-04-zed-extension-launch-integration.md) | Complete | 1w |
| 5 | [MPE Tier One Rendering and Export](./phase-05-mpe-tier-one-rendering-and-export.md) | Complete | 1.5w |
| 6 | [Security Permissions and Trusted Execution](./phase-06-security-permissions-and-trusted-execution.md) | Complete | 1w |
| 7 | [Testing Packaging and Release](./phase-07-testing-packaging-and-release.md) | Complete | 1w |
| 8 | [Enhanced Parity Roadmap](./phase-08-enhanced-parity-roadmap.md) | Complete | ongoing |

## Parallel Strategy

- Phase 0 is complete. It proved Zed task launch UX, saved-file update semantics, distribution path, and security gates.
- Phase 1 freezes contracts and threat model.
- Phase 2 is complete: the secure saved-file server initializes a Crossnote notebook per workspace, renders through `getNoteMarkdownEngine()`, and keeps markdown-it as the safe fallback path.
- Phase 3 is complete: the browser preview client consumes server payloads, preserves scroll, and supports rich/plain copy.
- Phase 4 is complete: the Zed task/keybinding path launches or reuses the per-workspace browser preview.
- Phase 5 is complete: Tier 1 fixture coverage, safe custom CSS, and session-token HTML export are implemented.
- Phase 6 is complete: release hardening keeps code execution disabled, adds passive trust/code-chunk diagnostics, extracts localhost origin policy, hardens token/path checks, and expands security tests.
- Phase 7 is complete: release metadata, license/notices, security/release docs, package smoke automation, and Zed dev-extension checklist are ready for validation.
- Phase 8 is complete as roadmap: the parity matrix documents supported, partial, deferred, and security-review features for post-MVP planning.

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
