# Phase 06: Security Permissions and Trusted Execution

## Context Links

- [Markdown Preview Enhanced report](./reports/researcher-mpe-analysis.md)
- [Zed extension constraints report](./reports/researcher-001-zed-extension-architecture.md)
- [Crossnote Preview Server Core](./phase-02-crossnote-preview-server-core.md)

## Overview

- Priority: P1
- Status: Pending
- Goal: enforce the security baseline from Phase 0 and only then allow optional trusted execution features.

## Key Insights

- MPE code chunks can run arbitrary commands. That is useful and dangerous.
- Zed capability prompts and task execution already surface some risk, but the preview server must enforce its own policy.
- A local browser server still needs token, origin, and path protections.

## Requirements

- Default code chunk execution off.
- Require explicit per-workspace trusted setting before running code chunks.
- Never auto-run chunks on open or save unless trust and config both allow it.
- Bind server to localhost by default.
- Reject files outside workspace root.
- Use session token for preview pages and WebSocket.
- Prefer one-time URL bootstrap token plus `SameSite=Strict` session cookie or equivalent non-leaky session token after first load.
- Deny CORS and validate `Host` for `127.0.0.1`, `localhost`, and `[::1]` only.
- Reject DNS rebinding-style hosts and public bind addresses.
- Sanitize rendered/copy HTML where server/browser can control it.
- Log security-relevant events without leaking secrets.

## Architecture

Security modules:

- `trusted-workspace-policy.ts`: reads trust config and decides if execution is allowed.
- `code-chunk-gate.ts`: blocks execution unless policy allows it.
- `server-token.ts`: generates per-server/session tokens.
- `origin-policy.ts`: validates browser requests.
- `path-safety.ts`: extends Phase 2 validation with Windows, symlink, junction, UNC, and encoded traversal tests.
- `safe-html.ts`: strips script/event handlers from copy fragments.
- `audit-log.ts`: records trust changes and blocked execution attempts.

Trust model:

```text
default deny -> workspace opt-in -> explicit user action -> run code chunk
```

## Related Code Files

- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\trusted-workspace-policy.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\code-chunk-gate.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\server-token.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\origin-policy.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\browser-preview\src\safe-html.ts`.
- Create `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\audit-log.ts`.
- Modify `F:\Windows\Study\Selfhost\zed-extension\extension.toml` for final capabilities.

## Implementation Steps

1. Define trust config storage and default values.
2. Block Crossnote code chunk execution unless trusted mode is active.
3. Add browser warning panel when a document contains runnable chunks while execution is disabled.
4. Require explicit click to run one chunk or all chunks.
5. Validate bootstrap token, session token/cookie, WebSocket token, and replay behavior.
6. Validate `Origin`, `Host`, localhost aliases, and denied CORS.
7. Add `realpath` containment for source files, linked images/assets, exports, symlinks, junctions, UNC paths, URL-encoded traversal, and case-insensitive Windows drive variants.
8. Sanitize rich-copy fragments.
9. Audit Zed extension capabilities and remove broad permissions when possible.

## Todo List

- [ ] Implement trusted workspace policy.
- [ ] Gate all code chunk execution.
- [ ] Add server and WebSocket session tokens.
- [ ] Add origin/path validation tests.
- [ ] Add DNS rebinding, token replay, symlink, junction, UNC, encoded traversal, and Windows case tests.
- [ ] Sanitize copied HTML fragments.
- [ ] Audit final Zed capabilities.

## Success Criteria

- Opening a malicious Markdown file cannot execute commands by default.
- Attempted code chunk execution is blocked with a clear message when untrusted.
- Trusted execution requires explicit per-workspace opt-in.
- External origins cannot connect to the local preview session without token.
- Path traversal tests fail safely.
- Token replay and forged WebSocket tests fail safely.

## Risk Assessment

- Risk: Crossnote APIs may expose multiple paths that can execute chunks.
- Mitigation: wrap all render/export calls in a single server adapter that strips or denies execution options unless trusted.
- Risk: users misunderstand trust setting.
- Mitigation: name it plainly, document examples, and show warning every time trust is enabled.

## Security Considerations

- Treat Markdown files as untrusted input.
- Treat code chunks as arbitrary local code execution.
- Do not expose server beyond localhost unless a future remote mode is designed separately.
- Do not bundle GPL or commercial binaries without explicit license review.
- Do not put long-lived secrets in preview URLs.

## Next Steps

- Phase 7 validates security behavior with automated tests and manual threat checks.
