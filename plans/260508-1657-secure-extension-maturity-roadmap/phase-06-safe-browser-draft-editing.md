# Phase 06: Safe Browser Draft Editing

## Context Links

- [Overview plan](./plan.md)
- [Browser Review Usability](./phase-03-browser-review-usability.md)
- [Implementation contracts](../../docs/implementation-contracts.md)
- [Security](../../docs/security.md)
- [Threat model](../../docs/threat-model.md)

## Overview

- Priority: P2
- Status: Complete
- Goal: explore direct browser editing as a safe draft workflow, not silent source-file mutation.

## Key Insights

- Browser editing is useful for quick doc fixes, but it creates data-loss and security risks.
- The safest first version is draft/edit proposal mode: edit in browser, preview diff, then explicitly apply.
- Any file write must be token-gated, path-contained, size-limited, atomic, and recoverable.
- Browser editing must never run Markdown code chunks, parser JavaScript, or remote fetches.

## Requirements

- Add browser edit mode only after Phase 03 review UX is stable.
- Default to read-only preview; editing must be an explicit user action.
- Start with draft state in browser memory or local storage; do not autosave to disk.
- Add explicit Apply/Discard controls with a diff/summary before write.
- If writes are implemented, write only the current preview file inside workspace using server-side containment checks.
- Preserve a backup or atomic rollback path for every write.
- Detect stale source content before applying browser edits.

## Architecture

Safe first step:

```text
browser edit mode -> draft Markdown buffer -> render preview from draft -> diff summary -> explicit apply request
```

Optional write path after security review inside this phase:

```text
POST /api/source/apply-draft -> session token -> path containment -> stale check -> atomic write -> rerender saved file
```

## Related Code Files

- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\preview-toolbar.ts` for edit controls.
- Add `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\draft-editor.ts` for draft editing if non-trivial.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\render-preview.ts` for draft preview state.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\preview.css` for editor layout.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\contracts.ts` for draft/apply contracts.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\server.ts` only if an apply endpoint is approved.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\path-safety.ts` for write containment helpers if needed.
- Add server and browser tests for draft state, stale checks, atomic write, and token rejection.

## Implementation Steps

1. Design the edit-mode UX as an explicit toggle from read-only preview.
2. Implement draft editing without disk writes first.
3. Render draft content through the same safe renderer settings: no code chunks, no parser JS, no imports, no remote diagram services.
4. Add diff/summary before apply.
5. If applying to disk is included, add a session-token endpoint with method, origin, content-type, size, and path checks.
6. Add stale-source detection using source mtime/hash captured when draft starts.
7. Write atomically with backup/rollback and never accept destination paths from the browser.
8. Add tests for token rejection, stale edits, symlink escape, oversized content, malformed payloads, and backup creation.

## Todo List

- [x] Design explicit edit-mode UX.
- [x] Implement draft-only browser editing.
- [x] Add safe draft render path.
- [x] Add diff/summary before apply.
- [x] Add gated apply endpoint only after review.
- [x] Add stale-check, atomic-write, and rollback tests.
- [x] Document editing limitations and recovery.

## Success Criteria

- Preview remains read-only by default.
- User can draft Markdown edits in the browser without touching disk.
- Any disk write requires explicit apply action and valid session token.
- Stale source content blocks apply with a recoverable message.
- Writes are atomic and recoverable.
- No code execution or remote fetch is introduced.

## Risk Assessment

- Risk: browser edit mode causes data loss.
- Mitigation: draft-only first, explicit apply, stale checks, atomic write, backup/rollback.
- Risk: browser becomes a competing editor.
- Mitigation: keep editing lightweight; no collaborative editing, no complex formatting toolbar.
- Risk: write endpoint expands attack surface.
- Mitigation: session token, origin checks, path containment, size caps, strict JSON schema, no browser-supplied destination path.

## Security Considerations

- Keep server bound to `127.0.0.1`.
- Apply endpoint must require session token and same-origin checks.
- Browser may send content, never target paths.
- Reuse source file path from authenticated session only.
- Reject binary/oversized content and path escapes.
- Do not enable code chunks, parser JS, imports, remote preview, or public bind.

## Validation

```bash
npm run typecheck
npm run test --workspace @zed-mpe/server
npm run test --workspace @zed-mpe/browser-preview
npm run build
```

Manual: draft edit, discard, apply, stale-source conflict, recovery from backup, token rejection, browser refresh during draft, and path escape attempts.

## Next Steps

After this phase, decide whether browser editing should remain draft-only, support explicit apply, or wait for future Zed-native buffer APIs.