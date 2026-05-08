const keys = [
  "ZED_FILE",
  "ZED_FILENAME",
  "ZED_DIRNAME",
  "ZED_RELATIVE_FILE",
  "ZED_LANGUAGE",
  "ZED_WORKTREE_ROOT",
  "ZED_MAIN_GIT_WORKTREE"
];

for (const key of keys) {
  console.log(`${key}=${process.env[key] ?? ""}`);
}