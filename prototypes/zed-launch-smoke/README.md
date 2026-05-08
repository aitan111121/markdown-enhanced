# Zed Launch Smoke Prototype

This prototype verifies the Phase 0 launch assumptions without depending on the preview server.

Run `MPE Smoke: Print Zed File Context` from Zed task spawn while a Markdown file is active. The expected proof points are:

- `ZED_FILE` is the absolute saved file path.
- `ZED_WORKTREE_ROOT` is the workspace root.
- The task saves the current buffer before execution through `save: "current"`.
- Paths are passed as task `args`, not shell-concatenated strings, so spaces in paths are preserved.

If this task is unavailable in Zed, the MVP launch path must be revisited before expanding beyond Phase 1.