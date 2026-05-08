# Phase 02: Docs-Team Workflow Guide

## Context Links

- [Overview plan](./plan.md)
- [README](../../README.md)
- [Feature parity](../../docs/feature-parity.md)
- [Security](../../docs/security.md)
- [Development roadmap](../../docs/development-roadmap.md)

## Overview

- Priority: P1
- Status: Complete
- Goal: document safe workflows for technical docs teams instead of broad MPE parity promises.

## Key Insights

- Primary audience is technical docs teams.
- Current docs are strong for developers but thin on team workflow examples.
- Security posture should be framed as a deliberate feature.

## Requirements

- Create public docs-team integration guidance.
- Clarify roadmap priorities and conservative risk gates.
- Explain `trust.json` as passive only, if mentioned.
- Provide a feedback/prioritization path for deferred features.

## Architecture

Docs should describe the same external-browser architecture and make team usage patterns concrete:

```text
Docs workspace -> Zed task/CLI -> local preview -> copy/export -> docs review/publish workflow
```

## Related Code Files

- Create `F:\Windows\Study\Selfhost\zed-extension\docs\integration-guide.md`.
- Create `F:\Windows\Study\Selfhost\zed-extension\docs\roadmap.md`.
- Modify `F:\Windows\Study\Selfhost\zed-extension\README.md` to link new docs.
- Modify `F:\Windows\Study\Selfhost\zed-extension\package.json` to include newly linked docs in package contents, unless they are explicitly GitHub-only.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\development-roadmap.md` for version framing.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\feature-parity.md` for priority signal.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\security.md` for security review process.

## Implementation Steps

1. Write an integration guide for MkDocs, Docusaurus, Mintlify, Hugo-style repos, and generic static-doc teams.
2. Add guidance for shared `.crossnote/style.less` with current CSS restrictions.
3. Add copy/export review workflow: Google Docs, Word, Notion, Gmail, static HTML snippets.
4. Add roadmap doc with 0.2, 0.3, future-webview, and excluded-risk tracks.
5. Add security review process: what must exist before code chunks, parser JS, remote preview, or image upload can move forward.
6. Reframe PDF/Pandoc and similar parity targets as candidates/deferred items, not committed version promises.
7. Link the docs from README and release checklist.
8. Ensure any README-linked docs are included in `package.json` package files or marked GitHub-only.

## Todo List

- [x] Create docs-team integration guide.
- [x] Create public roadmap doc.
- [x] Add security review process section.
- [x] Update README and feature-parity links.
- [x] Include linked docs in package contents or mark GitHub-only.
- [x] Validate all local markdown links.

## Success Criteria

- A docs-team lead can understand how to adopt the tool safely.
- Roadmap shows what is planned, candidate, deferred, and intentionally excluded.
- Published package does not contain README links to missing docs.
- Risky features have documented gates, not vague promises.
- README links to the new docs.

## Risk Assessment

- Risk: docs become marketing-heavy and imprecise.
- Mitigation: keep examples practical and tied to existing CLI/task behavior.
- Risk: roadmap implies guaranteed timelines.
- Mitigation: use candidate wording and gate criteria.

## Security Considerations

- Repeat that code chunks, parser JS, public bind, and credential workflows remain disabled.
- Explain why conservative defaults protect docs teams.
- Do not document workarounds that weaken containment or token rules.

## Validation

```bash
npm run lint
npm run typecheck
npm pack --dry-run
```

Manual: review README and docs links; verify examples do not require unsupported native Zed APIs.

## Next Steps

Proceed to Phase 03 after docs-team expectations are accurate.
