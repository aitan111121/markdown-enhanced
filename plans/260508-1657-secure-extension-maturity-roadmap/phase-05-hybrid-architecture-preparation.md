# Phase 05: Hybrid Architecture Preparation

## Context Links

- [Overview plan](./plan.md)
- [System architecture](../../docs/system-architecture.md)
- [Implementation contracts](../../docs/implementation-contracts.md)
- [Feature parity](../../docs/feature-parity.md)
- [Security](../../docs/security.md)

## Overview

- Priority: P2
- Status: Pending
- Goal: prepare docs and contracts for future Zed webview/panel support while keeping implementation external-browser-only today.

## Key Insights

- Current Zed public docs do not expose a general webview/panel API for this use case.
- Future native UX should be an adapter over the existing render/session/security core.
- External browser should remain supported as fallback even if a native surface arrives.

## Requirements

- Document preview surface boundary clearly.
- Define browser surface and future native surface responsibilities.
- Keep all security invariants surface-independent.
- Avoid unverified Zed API claims.

## Architecture

Current:

```text
Zed task -> CLI -> localhost server -> browser shell
```

Future hybrid candidate:

```text
Zed command/panel -> same localhost/render/session core -> native preview shell

                         -> external browser fallback
```

Only contracts and docs are in scope for this phase.

## Related Code Files

- Create `F:\Windows\Study\Selfhost\zed-extension\docs\webview-evolution.md`.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\system-architecture.md`.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\implementation-contracts.md`.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\security.md`.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\feature-parity.md`.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\contracts.ts` only if naming future-neutral payload contracts is necessary.
- Do not implement speculative webview code in `F:\Windows\Study\Selfhost\zed-extension\src\lib.rs`.

## Implementation Steps

1. Create a webview evolution doc: current limitation, hybrid goal, fallback story, migration principles.
2. Name preview-surface responsibilities: launch, session bootstrap, render display, copy/export, diagnostics.
3. Document security invariants that apply to every surface.
4. Update architecture docs to treat browser as current adapter, not permanent core.
5. Add feature-parity entries for native panel/webview as future candidate, not current support.
6. Verify README does not claim native preview command support.

## Todo List

- [ ] Write webview evolution doc.
- [ ] Update architecture/contracts with adapter boundary.
- [ ] Update security docs with surface-independent invariants.
- [ ] Update feature parity and roadmap wording.
- [ ] Confirm no speculative native claims remain.

## Success Criteria

- Maintainers know what to reuse if Zed adds webviews/panels.
- Users know external browser remains supported.
- Security model does not weaken for future native surfaces.
- No code lands for unverified APIs.

## Risk Assessment

- Risk: planning docs become speculative promises.
- Mitigation: use candidate language and require verified API docs before implementation.
- Risk: future native panel bypasses token/session model.
- Mitigation: document invariants now.

## Security Considerations

- Same token/session/path/CSP/sanitization rules apply to every surface.
- Do not allow native surface to run code chunks by default.
- Keep unsaved-buffer support blocked until Zed provides a safe buffer API and a separate threat model is written.

## Validation

```bash
npm run build
cargo check
npm run test
```

Manual: review current Zed extension API docs and confirm no unsupported native preview command is advertised.

## Next Steps

After this phase, choose next plan from user feedback: install polish, docs diagnostics, exports, or future native adapter if Zed APIs change.
