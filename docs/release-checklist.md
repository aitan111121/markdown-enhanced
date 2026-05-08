# Release Checklist

Use this checklist before npm publish or a Zed extension registry PR.

## Local Gates

```bash
npm run lint
npm run typecheck
npm run build
npm run test
npm audit --omit=dev
npm pack --dry-run
npm run smoke:package
```

Expected audit status for `0.1.0`: known moderate no-fix Crossnote transitive finding only. Any new finding blocks release until reviewed.

## Zed Dev Extension Validation

1. Install Rust through `rustup`.
2. Run `npm install` and `npm run build` from a clean checkout.
3. In Zed, run `zed: install dev extension` and select this repository.
4. Confirm the Extensions page shows the dev extension override.
5. Open a saved Markdown file and run `MPE Preview Current File`.
6. Confirm the browser preview opens, save-based updates render, rich copy works, the contents sidebar navigates headings, passive link diagnostics appear for missing local links, draft editing can preview/apply a small change, and `Export HTML` downloads a standalone file.
7. Stop the task terminal and confirm the preview server exits cleanly.

Manual platform matrix before public release:

| Platform | Required Check |
|---|---|
| Windows | Source checkout task, separate workspace task, browser launch, draft apply backup. |
| macOS | Source checkout task, browser launch through `open`, rich copy, export. |
| Linux | Source checkout task, browser launch through `xdg-open`, blocked-port retry, export. |

Zed task failures before the CLI starts should be documented separately from CLI diagnostic codes.

## Zed Registry Submission

1. Confirm `extension.toml` has a unique ID, valid version, author, description, and public repository URL.
2. Confirm the root `LICENSE` is accepted by Zed's extension registry.
3. Fork `zed-industries/extensions` to a personal account.
4. Add this repo as an HTTPS submodule under `extensions/markdown-preview-enhanced`.
5. Add an `extensions.toml` entry with the same version as `extension.toml`.
6. Run `pnpm sort-extensions` in the Zed extensions repo.
7. Open the registry PR with local gate results, smoke results, security notes, and known audit status.

## Manual Copy Matrix

Before the public release, paste selection and full-document rich copy into at least two HTML-aware destinations:

| Destination | Required Check |
|---|---|
| Browser contenteditable | Formatting and links preserved. |
| Google Docs | Headings, lists, tables, and code remain readable. |
| Microsoft Word | Basic formatting and table structure survive paste. |
| Notion | Headings, lists, and code are usable. |
| Gmail | No scripts, local file URLs, or hidden tokens are pasted. |

Also inspect copied full-document HTML and exported HTML to confirm preview toolbar, contents sidebar, draft editor controls, diagnostics panels, and heading copy buttons are excluded.