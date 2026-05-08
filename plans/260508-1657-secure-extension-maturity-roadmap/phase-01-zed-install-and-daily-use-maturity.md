# Phase 01: Zed Install And Daily-Use Maturity

## Context Links

- [Overview plan](./plan.md)
- [Usage doc](../../docs/usage.md)
- [Distribution strategy](../../docs/distribution-strategy.md)
- [Release checklist](../../docs/release-checklist.md)
- [System architecture](../../docs/system-architecture.md)

## Overview

- Priority: P1
- Status: Pending
- Goal: make the current CLI plus Zed task workflow reliable, debuggable, and honest for real users.

## Key Insights

- Current registry shell does not expose a native preview command.
- Current reliable path is source checkout or explicit task calling the built CLI.
- Zed tasks support current-file variables, keybindings, and project/global task templates.
- The best next release reduces setup friction without promising unavailable Zed APIs.

## Requirements

- Improve user setup for source checkout, external workspaces, and package CLI usage.
- Add CLI diagnostics for failures reachable after the CLI starts: missing build assets, invalid workspace/file, stale server reuse, blocked browser launch, and blocked/unsafe port.
- Document pre-CLI Zed task failures separately: missing Node/npm, PATH issues, shell startup mismatches, and task-template mistakes.
- Keep CLI contract backward-compatible.
- Add cross-platform manual validation matrix.

## Architecture

```text
Zed task/keybinding -> zed-mpe CLI -> reuse/new localhost server -> tokenized browser preview
```

The implementation should improve entry-path reliability around the existing contract, not replace the architecture.

## Related Code Files

- Modify `F:\Windows\Study\Selfhost\zed-extension\README.md` for install/use updates.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\usage.md` for task templates and troubleshooting.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\distribution-strategy.md` for registry/package status.
- Modify `F:\Windows\Study\Selfhost\zed-extension\docs\release-checklist.md` for platform validation.
- Modify `F:\Windows\Study\Selfhost\zed-extension\.zed\tasks.json` only if task defaults need improvement.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\cli.ts` for diagnostics.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\browser-launch.ts` for launch errors.
- Modify `F:\Windows\Study\Selfhost\zed-extension\packages\server\src\preview-server-client.ts` for reuse diagnostics.
- Create or modify `F:\Windows\Study\Selfhost\zed-extension\scripts\*` only if smoke coverage needs it.

## Implementation Steps

1. Audit current CLI error paths and classify only failures reachable after `node` starts.
2. Add stable diagnostic codes/messages for CLI setup and launch failures.
3. Keep tokens out of every log/error path.
4. Update usage docs with separate troubleshooting for pre-CLI Zed task/PATH failures.
5. Update usage docs with global task, project task, source checkout, and package CLI options.
6. Add or extend smoke coverage for fresh package install plus preview launch.
7. Add release checklist rows for Windows, macOS, Linux, separate workspace launch, and browser-launch failure.

## Todo List

- [ ] Audit CLI and server-reuse diagnostics.
- [ ] Document pre-CLI task/PATH failures.
- [ ] Add missing diagnostic branches.
- [ ] Update setup/troubleshooting docs.
- [ ] Extend smoke/manual validation checklist.
- [ ] Validate package and Zed task launch paths.

## Success Criteria

- Users can diagnose setup failures without reading source.
- Fresh package smoke still launches preview and checks `/health`.
- Manual docs describe this repo and external workspace usage accurately.
- No logs or copied/exported output expose preview, browser, or control tokens.

## Risk Assessment

- Risk: docs overpromise registry install behavior.
- Mitigation: state current task/CLI path plainly.
- Risk: diagnostics reveal sensitive paths or tokens.
- Mitigation: redact tokens and avoid echoing full session URLs in failures.

## Security Considerations

- Keep `127.0.0.1` bind only.
- Keep one-time preview tokens and separate session/export tokens.
- Do not add public preview, remote control, or execution capabilities.
- Do not assume extra Zed extension capabilities.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm run test
npm run smoke:package
npm pack --dry-run
```

Manual: launch from this repo and from one separate Markdown workspace on Windows, then repeat macOS/Linux before release.

## Next Steps

Proceed to Phase 02 after user setup and diagnostics are stable.
