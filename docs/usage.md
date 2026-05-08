# Usage

## Recommended Daily Workflow

Build the Node packages once after install or after changing TypeScript sources:

```bash
npm install
npm run build:node
```

Then add a keybinding for the project task in your Zed `keymap.json`:

```json
{
  "context": "Workspace",
  "bindings": {
    "alt-m": ["task::Spawn", { "task_name": "MPE Preview Current File" }]
  }
}
```

Daily use:

1. Open a saved Markdown file in Zed.
2. Press the configured task keybinding.
3. The task saves the current file, starts or reuses the workspace preview server, and opens a fresh tokenized browser URL.
4. Save the Markdown file to refresh the preview.
5. Use the browser toolbar to copy rich content, export HTML, navigate the contents sidebar, or start an explicit draft edit.

The first launch keeps a small server task running for that workspace. Later launches reuse it and exit quickly after opening a new preview URL. Stop the Zed task terminal to stop the preview server.

## Zed Task Fallback

If you do not want a keybinding, run `task: spawn` and select `MPE Preview Current File`.

If the preview task reports `E_BUILD_ASSETS_MISSING`, run `task: spawn` and select `MPE Build Node Packages`, then retry the preview task.

If Zed cannot find `npm`, verify that Zed's terminal shell has Node.js and npm on `PATH`. Zed tasks run in a login shell, so shell startup files are the right place to fix PATH mismatches.

Pre-CLI failures happen before `zed-mpe` starts. Typical causes are missing Node/npm, a shell PATH that differs from your interactive terminal, a bad task template, or a file that has not been saved yet.

The preview task passes paths as arguments, not shell-concatenated strings:

```json
{
  "command": "npm",
  "args": ["run", "zed-mpe", "--", "preview", "--workspace", "$ZED_WORKTREE_ROOT", "--file", "$ZED_FILE"]
}
```

The task uses `save: "current"`, so MVP preview behavior is save-based. Unsaved-buffer streaming is not part of the MVP unless a later Zed API proof changes this decision.

## Security Diagnostics

Runnable code chunks are detected and blocked in `0.1.0`. If a document contains a fence such as `{cmd=true}`, the browser shows a diagnostic above the preview and renders the chunk as static content.

Do not share tokenized preview URLs. They are single-session browser entry points for the local preview server.

CLI diagnostics use stable codes where possible:

| Code | Meaning | Next Step |
|---|---|---|
| `E_CLI_USAGE` | The command arguments are incomplete or unsupported. | Compare the task with the examples below. |
| `E_BUILD_ASSETS_MISSING` | Browser preview assets have not been built. | Run `npm run build:node` or the Zed build task. |
| `E_WORKSPACE_FILE` | Workspace or file path failed containment, existence, or size checks. | Save the file and verify it is inside the workspace. |
| `E_BROWSER_PORT` | The requested port is blocked by browsers. | Use `--port 0` or another local port. |
| `W_REUSE_STALE` | Existing server state was stale and cleared. | No action needed unless it repeats. |
| `W_BROWSER_OPEN_FAILED` | The browser launcher failed. | Rerun with `--no-open` to print a one-time URL. |

## Browser Review

The contents sidebar is generated from sanitized heading metadata or rendered headings. Use its controls to place it on the left or right; the setting stays in browser local storage and is not sent to the server.

Heading copy buttons copy fragment-only links such as `#usage`, not tokenized preview URLs.

Passive link diagnostics classify local Markdown and image links without mutating files or fetching remote URLs. Remote links are marked as remote only. Unsupported schemes such as `file:`, `data:`, and executable script schemes are reported as unsafe.

## Draft Editing

Draft editing is read-only by default. Select `Edit Draft`, make a small Markdown change in the browser, choose `Preview Draft`, then `Apply Draft` only when the preview looks right.

Apply requests are token-gated and write only the current preview file. The server rejects stale source content, oversized drafts, path escapes, malformed requests, and invalid tokens. A backup file is created next to the source before replacement.

## Custom Preview CSS

Create `.crossnote/style.less` in the workspace to apply a conservative CSS-only customization subset. Phase 5 treats the file as CSS text: rules must target `.markdown-preview` or `.preview-root`, and CSS escapes, function-like tokens, `@import`, `url(...)`, executable CSS patterns, global selectors, scripts, parser hooks, and `head.html` remain disabled.

Changes to an existing `.crossnote/style.less` file refresh open previews and are included in HTML exports.

## Terminal Preview For Development

```bash
npm run zed-mpe -- preview --workspace . --file README.md --port 0 --open --save-mode filesystem
```

Use `--no-open` to print the one-time preview URL without launching the browser. Normal `--open` status output redacts tokenized URLs.

## Release Validation

Before installing as a Zed dev extension or opening a registry PR, run:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
npm run smoke:package
```

See [release-checklist.md](release-checklist.md) for Zed registry and manual rich-copy validation steps.