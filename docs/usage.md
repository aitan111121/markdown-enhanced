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

## Terminal Preview For Development

```bash
npm run zed-mpe -- preview --workspace . --file README.md --port 0 --open --save-mode filesystem
```

Use `--no-open` to print the preview URL without launching the browser.