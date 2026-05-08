# Phase 08: Enhanced Parity Roadmap

## Context Links

- [Markdown Preview Enhanced report](./reports/researcher-mpe-analysis.md)
- [MPE Tier One Rendering and Export](./phase-05-mpe-tier-one-rendering-and-export.md)

## Overview

- Priority: P2
- Status: Complete
- Goal: plan the post-MVP work that moves toward MPE parity while respecting Zed's external-browser reality.

## Key Insights

- Full MPE parity is a long-term program, not a single MVP.
- Some features port cleanly through Crossnote; others depend on VS Code editor APIs and need redesign.
- Advanced export and diagram features carry external binary, network, or license friction.
- Phase 8 is complete as a documented roadmap matrix. Runtime implementation starts only after release feedback selects a track.

## Requirements

- Track feature parity honestly with support level and blockers.
- Prioritize high-value features that work well in browser/server architecture.
- Avoid bundling heavy or risky dependencies before demand is proven.
- Keep all advanced code execution behind trusted mode.

## Architecture

Recommended post-MVP order:

1. Wikilinks, block references, and note navigation.
2. Backlinks and tag index in browser sidebar.
3. Graph view as a browser route.
4. Reveal.js presentation mode.
5. PDF export through Puppeteer and system Chrome.
6. Trusted code chunk execution.
7. Advanced diagram providers: PlantUML local/server, GraphViz, Kroki, WaveDrom, Vega.
8. Pandoc export: DOCX, RTF, Beamer, citation workflows.
9. eBook export: EPUB/MOBI through Pandoc/calibre.
10. Image helper and uploader integrations.

## Related Code Files

- Created `F:\Windows\Study\Selfhost\zed-extension\docs\feature-parity.md`.
- Deferred `note-index-service.ts`, `backlink-service.ts`, `tag-index-service.ts`, `graph-view.ts`, `pandoc-export-service.ts`, and `image-helper-service.ts` until post-MVP demand selects a track.

## Implementation Steps

1. Create feature parity matrix with columns: feature, MPE behavior, Zed equivalent, support level, blocker, target release.
2. Add note index for Markdown files under workspace with max file size cap.
3. Add wikilink route handling in browser preview.
4. Add backlinks/tag side panel in browser, not Zed UI.
5. Add graph route using browser canvas/SVG.
6. Add Reveal.js presentation mode through Crossnote output.
7. Add optional external binary detection for Pandoc/calibre/PlantUML.
8. Add import/export docs for advanced workflows.

## Todo List

- [x] Build feature parity matrix.
- [ ] Implement wikilinks and note index.
- [ ] Implement backlinks and tags.
- [ ] Implement browser graph view.
- [ ] Implement presentation mode.
- [ ] Add optional PDF and advanced exports.
- [ ] Add trusted code chunk execution only after separate security review.
- [ ] Add image helper only after security review.

## Success Criteria

- Users can see exactly which MPE features are supported, partial, deferred, or impossible in Zed.
- Browser-based knowledge-base features have a documented implementation track.
- Advanced external dependencies are documented as optional future work.

## Risk Assessment

- Risk: feature creep buries the rich-copy MVP.
- Mitigation: do not start this phase until Phase 7 release criteria pass.
- Risk: advanced exports create support load.
- Mitigation: gate them by explicit installed-tool checks and docs.

## Security Considerations

- Do not enable custom parser JavaScript by default.
- Keep network diagram/export providers opt-in.
- Treat image upload integrations as credential-bearing features requiring separate review.

## Next Steps

- Pick one post-MVP track based on user feedback after MVP: knowledge base, presentation/export, or diagram depth.
