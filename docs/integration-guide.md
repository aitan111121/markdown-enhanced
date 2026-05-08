# Integration Guide

This guide is for technical docs teams that want a secure local preview workflow inside Zed without enabling arbitrary Markdown execution.

## Team Setup

Recommended repository setup:

1. Keep this extension checkout built on each writer machine, or install the packaged CLI when available.
2. Add a project `.zed/tasks.json` entry that calls `zed-mpe preview` with `$ZED_WORKTREE_ROOT` and `$ZED_FILE`.
3. Add a shared keybinding recommendation in contributor docs, but let each writer choose their own local keymap.
4. Keep `.crossnote/style.less` in the docs repository only when the team needs a shared preview style.

The preview is save-based. Writers should save the Markdown file before launching preview or expecting refreshes.

## Static Site Workflows

### Docusaurus And Mintlify

Use the browser preview for local review of Markdown pages before running the site dev server. The preview is useful for content structure, math, tables, code blocks, copy review, and quick HTML export. The site generator remains the source of truth for routing, MDX components, and deployment.

### MkDocs And Hugo

Use the preview as a fast single-file review surface. Local relative link diagnostics help catch missing Markdown and image targets without crawling the whole site or fetching remote URLs.

### Generic Markdown Repositories

Use rich copy to move rendered drafts into review tools such as Google Docs, Word, Notion, or email. Clipboard output strips scripts, event handlers, local file URLs, diagnostic UI, table-of-contents UI, and session tokens.

## Shared Preview CSS

Teams can add `.crossnote/style.less` for preview-only styling. The file is treated as CSS text, not Less.

Allowed selectors must start with `.markdown-preview` or `.preview-root`. Imports, URLs, CSS escapes, function-like tokens, global selectors, script hooks, `head.html`, and parser JavaScript remain disabled.

## Browser Review Features

- The generated contents sidebar is built from sanitized heading metadata or rendered headings.
- Sidebar placement is a browser-local preference, not a workspace setting.
- Heading copy buttons copy fragment-only links such as `#section`, never tokenized preview URLs.
- Link diagnostics are passive. They classify local links and images as valid, missing, outside workspace, unsafe, too large, remote, or unsupported scheme without fetching remote URLs.

## Draft Editing

Browser editing is read-only by default. Writers must choose `Edit Draft`, preview the draft, then explicitly apply it.

Apply writes only the current preview file from the authenticated session. The browser never supplies a destination path. The server checks the session token, workspace containment, source size, stale source version, and writes through a backup plus atomic replacement path.

Use draft editing for small wording fixes, not as a second full editor. If a stale-source warning appears, review the saved file in Zed before applying again.

## Security Expectations

This project intentionally does not enable code chunks, custom parser JavaScript, public preview bind, remote rendering providers, credential-bearing image upload, or silent browser autosave. Those features require separate security design and review before they can move from deferred to candidate work.