# Phase 04: Conservative Workspace Link Diagnostics

## Context Links

- [Overview plan](./plan.md)
- [Implementation contracts](../../docs/implementation-contracts.md)
- [Security](../../docs/security.md)
- [Threat model](../../docs/threat-model.md)

## Overview

- Priority: P2
- Status: Complete
- Goal: add passive local Markdown/image link diagnostics for docs teams without building a full knowledge graph.

## Key Insights

- Broken local links are high-value for docs teams.
- Full backlinks/graph/indexing is larger and not needed for this maturity step.
- All link resolution must reuse path-safety constraints.
- Missing-link classification needs a non-throwing contained resolver; current source-file resolution can throw before classification.

## Requirements

- Report local relative links as valid, missing, outside workspace, unsupported scheme, too large, or unsafe path.
- Keep diagnostics passive; never mutate files.
- Do not fetch remote URLs.
- Do not expose local files outside workspace.

## Architecture

```text
saved markdown -> safe link extractor -> contained resolver -> diagnostics payload -> browser diagnostics UI
```

The link diagnostic path must be independent from rendering success. Rendering should still succeed if diagnostics fail closed.

## Related Code Files

- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\path-safety.ts` to add or expose a non-throwing contained candidate resolver for diagnostics.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\saved-file-preview.ts` to attach diagnostics.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\contracts.ts` for diagnostic payload types.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\render-preview.ts` for display.
- Add `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\workspace-link-diagnostics.ts` if extraction is non-trivial.
- Add tests under `F:\Windows\Study\Selfhost\zed-extension\packages\server\test\` and `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\test\`.

## Implementation Steps

1. Define diagnostic types and severity levels.
2. Extract only Markdown inline links/images and simple reference definitions needed for docs teams.
3. Add a shared non-throwing candidate resolver that can classify missing paths without bypassing containment.
4. Resolve local relative paths against the source file directory using realpath containment when targets exist.
5. Reject or classify unsafe schemes: `file:`, executable schemes, malformed percent encoding, UNC, traversal, symlink escape.
6. Enforce size caps before marking linked resources valid.
7. Display diagnostics without blocking render.
8. Add Windows path and symlink escape tests.
9. Add redaction tests so diagnostics, rich copy, and HTML export do not leak tokens, control URLs, or unnecessary absolute paths.

## Todo List

- [x] Define link diagnostic contract.
- [x] Implement safe local link extraction/resolution.
- [x] Add non-throwing contained candidate resolver.
- [x] Add browser diagnostic display.
- [x] Add path-safety regression tests.
- [x] Add docs explaining passive diagnostics.
- [x] Add diagnostic redaction and copy/export exclusion tests.

## Success Criteria

- Missing local Markdown/image links are visible in preview diagnostics without throwing render failures.
- Unsafe/outside-workspace links are reported, not opened or fetched.
- Remote links are classified without network access.
- Existing render/copy/export behavior remains unchanged.

## Risk Assessment

- Risk: Markdown link parsing becomes a second renderer.
- Mitigation: keep extraction narrow and passive; do not parse every Markdown construct.
- Risk: path handling regressions on Windows.
- Mitigation: add Windows-specific tests for drive letters, encoded traversal, UNC, and symlinks.

## Security Considerations

- Realpath containment for every local candidate.
- No remote fetch, no file mutation, no upload.
- Reject executable URL schemes.
- Avoid printing absolute sensitive paths in browser diagnostics unless already visible through workspace context.
- Exclude diagnostic panels from rich-copy and HTML-export payloads unless explicitly sanitized for export.

## Validation

```bash
npm run test --workspace @zed-mpe/server
npm run test --workspace @zed-mpe/browser-preview
npm run typecheck
npm run build
```

Manual: test relative links, images, missing files, symlink escapes, encoded traversal, Windows paths, remote links, copied HTML, and exported HTML.

## Next Steps

Proceed to Phase 05 after passive link diagnostics are secure and useful.
