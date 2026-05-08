# Security

Markdown files, `.crossnote` files, diagrams, links, images, and rendered HTML are treated as untrusted input. The preview server is local-only and designed for saved Markdown files in the active workspace.

## Defaults

- Server bind: `127.0.0.1` only.
- Browser access: one-time preview URL token plus a separate WebSocket/export token.
- Path access: `realpath` containment inside the workspace root, size caps, UNC rejection, encoded traversal rejection, and symlink escape rejection.
- Rendering: Crossnote runs from a server-owned temporary notebook root, not the workspace `.crossnote/config.js`.
- Execution: script execution, parser JavaScript, HTML5 embeds, remote diagram services, public bind, imports, and code chunks are disabled by default.
- Copy/export: preview HTML and clipboard fragments strip active elements, event handlers, local file URLs, executable URL schemes, and session tokens.
- Browser editing: off by default; explicit draft apply requires the browser session token, stale-source match, path containment, size caps, backup creation, and atomic replacement.

## Code Chunks

Runnable Markdown Preview Enhanced code chunks are not enabled in `0.1.0`. If a document contains a runnable code fence such as `{cmd=true}`, the renderer adds a browser diagnostic and keeps rendering as static Markdown.

The repository includes a passive `.zed-mpe/trust.json` policy reader for future trusted execution design, but trust does not enable execution in this release. A future execution feature must require per-workspace opt-in, explicit user action for each run, audit logging, and another security review.

## Custom CSS

`.crossnote/style.less` is read as a strict CSS-only subset. It is not evaluated as Less and cannot import, fetch URLs, use CSS escapes, use function-like tokens, or target global selectors. Rules must start with `.markdown-preview` or `.preview-root`.

## Local Server Tokens

Preview URLs contain one-time bootstrap tokens and must not be shared. `/health` never returns tokens. HTML export requires the browser session token and never accepts source or destination paths from the browser.

Normal `--open` CLI output redacts tokenized preview URLs. `--no-open` prints a one-time URL only because the user explicitly requested manual opening.

## Link Diagnostics

Workspace link diagnostics are passive. They parse simple Markdown links, images, and reference definitions, classify local targets through contained path resolution, and never fetch remote URLs. Unsupported schemes such as `file:`, `data:`, and executable script schemes are reported instead of opened.

Diagnostics are excluded from rich-copy and HTML export output.

## Browser Draft Editing

Draft editing starts only after the user selects `Edit Draft`. Draft content stays in the browser until the user previews or applies it.

The apply endpoint accepts Markdown content and the source version captured when the draft started. It never accepts destination paths from the browser. The server resolves the current session file, checks containment and size, serializes in-process applies for that file, rejects stale source content immediately before replacement, writes a backup beside the source file, then replaces the source through a temporary file. External editor saves that occur after the final check are still recoverable from the backup.

## Security Review Process

Risky features can move from deferred to candidate only when a design documents the threat model, user opt-in, audit behavior, tests, rollback path, and release validation. This applies to code chunks, parser JavaScript, public preview, remote diagram providers, `head.html`, image upload helpers, and any command execution.

## Known Dependency Finding

`npm audit --omit=dev` reports a moderate no-fix Crossnote transitive finding through `markdown-it-html5-embed`. The affected feature surface remains disabled and isolated. Do not enable Crossnote HTML5 embed or arbitrary config without replacing or patching that dependency path.