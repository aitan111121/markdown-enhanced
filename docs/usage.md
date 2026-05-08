# Usage

## Recommended Daily Workflow

Target workflow after setup:

1. Open a saved Markdown file in Zed.
2. Press the configured Markdown Preview Enhanced keybinding or action.
3. The browser preview opens or reuses the existing workspace preview.
4. Save the Markdown file to refresh the preview.

Phase 4 verifies the shortest supported Zed keybinding path. Until then, the task picker flow below is the supported fallback.

## Zed Task Fallback

Build the Node packages first:

```bash
npm install
npm run build:node
```

Open a saved Markdown file in Zed, then run `task: spawn` and select `MPE Preview Current File`.

The task passes paths as arguments:

```json
{
  "command": "npm",
  "args": ["run", "zed-mpe", "--", "preview", "--workspace", "$ZED_WORKTREE_ROOT", "--file", "$ZED_FILE"]
}
```

The task uses `save: "current"`, so MVP preview behavior is save-based. Unsaved-buffer streaming is not part of the MVP unless a later Zed API proof changes this decision.

## Terminal Preview For Development

```bash
npm run zed-mpe -- preview --workspace . --file README.md --port 0 --open --save-mode filesystem
```

Use `--no-open` to print the preview URL without launching the browser.