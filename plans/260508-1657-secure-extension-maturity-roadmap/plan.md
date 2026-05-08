---
title: "Secure Extension Maturity Roadmap"
description: "Improve real Zed install/use, Markdown review features, and docs-team value while preserving the local-only secure preview model."
status: complete
priority: P1
effort: 5w
issue:
branch: feat/secure-extension-maturity-roadmap
tags: [feature, docs, security, zed-extension, roadmap]
blockedBy: []
blocks: []
created: 2026-05-08
---

# Secure Extension Maturity Roadmap

## Overview

Mature Markdown Preview Enhanced for Zed as a secure technical-docs preview tool. Do not chase full MPE parity. First make install/use reliable, then add high-value Markdown review features like a TOC sidebar and safer browser editing, then prepare contracts for future Zed webview/panel support without speculating beyond current APIs.

## Scope Challenge

- Existing code: secure external-browser preview core, CLI, server reuse, Crossnote adapter, rich copy, HTML export, safe CSS, blocked code chunks.
- Minimum change set: productize install/use, add docs-team guides, add TOC/sidebar review UX, add passive link diagnostics, plan safe browser draft editing, document hybrid path.
- Complexity: 6 phases. No code execution, no parser JS, no public bind, no credential workflows, no silent browser file writes.
- Selected mode: HOLD SCOPE.

## Cross-Plan Dependencies

| Relationship | Plan | Status |
|---|---|---|
| Builds on | [Markdown Preview Enhanced for Zed](../260507-2257-markdown-preview-enhanced-for-zed/plan.md) | Complete |

## Phases

| Phase | Name | Status | Effort |
|---|---|---:|---:|
| 1 | [Zed Install And Daily-Use Maturity](./phase-01-zed-install-and-daily-use-maturity.md) | Complete | 1w |
| 2 | [Docs-Team Workflow Guide](./phase-02-docs-team-workflow-guide.md) | Complete | 0.5w |
| 3 | [Browser Review Usability](./phase-03-browser-review-usability.md) | Complete | 1w |
| 4 | [Conservative Workspace Link Diagnostics](./phase-04-conservative-workspace-link-diagnostics.md) | Complete | 1w |
| 5 | [Hybrid Architecture Preparation](./phase-05-hybrid-architecture-preparation.md) | Complete | 0.5w |
| 6 | [Safe Browser Draft Editing](./phase-06-safe-browser-draft-editing.md) | Complete | 1w |

## Execution Strategy

1. Run phases sequentially. Phase 1 sets the user entry path. Phase 2 documents team workflows. Phase 3 improves the review surface with TOC/sidebar navigation. Phase 4 adds passive docs diagnostics. Phase 5 freezes future-native boundaries. Phase 6 adds safe browser draft editing only after the review surface is stable.
2. Keep all payload additions optional or backward-compatible.
3. Maintain external browser as the supported runtime until Zed exposes verified webview/panel or custom command APIs.

## Explicitly Out Of Scope

- Code chunk execution.
- Custom parser JavaScript.
- Public or remote preview bind.
- Arbitrary `.crossnote/config.js` or `head.html` execution/injection.
- Credential-bearing image upload.
- PDF/Pandoc export.
- Full MPE parity.
- Speculative Zed webview/panel implementation.
- Silent browser autosave or background file mutation.
- Multi-user collaborative editing.

## Success Criteria

- A new technical docs user can set up preview with clear diagnostics and minimal manual guessing.
- Docs teams get safe guidance for shared CSS, copy/export review, and static-doc workflows.
- Browser preview provides TOC/sidebar navigation and communicates render/copy/export state clearly without leaking tokens.
- Workspace link diagnostics are passive, contained, and secure.
- Browser editing is explicit, draft-based, token-gated, and recoverable; it never silently overwrites source files.
- Future Zed native preview work has documented adapters and security invariants.

## Handoff

Implementation command after review:

```bash
/ck:cook F:\Windows\Study\Selfhost\zed-extension\plans\260508-1657-secure-extension-maturity-roadmap\plan.md
```

Implemented on `feat/secure-extension-maturity-roadmap` with validation through lint, typecheck, build, tests, package smoke, package dry run, and audit baseline review.
