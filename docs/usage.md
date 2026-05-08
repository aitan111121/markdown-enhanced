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
5. Use `Export HTML` in the browser toolbar to download a standalone HTML snapshot of the current saved preview.

The first launch keeps a small server task running for that workspace. Later launches reuse it and exit quickly after opening a new preview URL. Stop the Zed task terminal to stop the preview server.

## Zed Task Fallback

If you do not want a keybinding, run `task: spawn` and select `MPE Preview Current File`.

If the preview task reports that the server build is missing, run `task: spawn` and select `MPE Build Node Packages`, then retry the preview task.

If Zed cannot find `npm`, verify that Zed's terminal shell has Node.js and npm on `PATH`. Zed tasks run in a login shell, so shell startup files are the right place to fix PATH mismatches.

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

## Custom Preview CSS

Create `.crossnote/style.less` in the workspace to apply a conservative CSS-only customization subset. Phase 5 treats the file as CSS text: rules must target `.markdown-preview` or `.preview-root`, and CSS escapes, function-like tokens, `@import`, `url(...)`, executable CSS patterns, global selectors, scripts, parser hooks, and `head.html` remain disabled.

Changes to an existing `.crossnote/style.less` file refresh open previews and are included in HTML exports.

## Terminal Preview For Development

```bash
npm run zed-mpe -- preview --workspace . --file README.md --port 0 --open --save-mode filesystem
```

Use `--no-open` to print the preview URL without launching the browser.

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