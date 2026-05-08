# Threat Model

## Assets

- Local files in the active workspace.
- Local files outside the active workspace.
- User clipboard contents and copied HTML.
- Browser preview session tokens.
- Future trusted code chunk execution permissions.

## Trust Boundaries

- Markdown files are untrusted input.
- `.crossnote` configuration files are untrusted until explicitly allowed.
- Browser clients are trusted only after presenting the preview session token.
- Zed task variables are trusted as editor-provided paths but still validated by the server.

## Baseline Controls

- Bind preview server to `127.0.0.1` by default.
- Use high-entropy one-time preview bootstrap tokens plus separate browser WebSocket tokens.
- Validate files through `realpath` containment before reading.
- Reject source files above the configured size cap.
- Disable script execution, code chunks, custom parser JavaScript, public bind, and export-time `runAllCodeChunks` by default.
- Initialize Crossnote with safe defaults only: script execution disabled, code chunks disabled at render time, inert parser hooks, and empty custom header/global CSS.
- Point Crossnote at a server-owned temporary notebook root in Phase 2 so workspace `.crossnote/config.js` cannot re-enable unsafe features.
- Escape Crossnote `@import` directives in Phase 2 so imports cannot bypass workspace containment, size caps, or remote fetch policy.
- Post-filter preview HTML before browser delivery to remove active containers, inline event handlers, and executable URL attributes.
- Do not expose environment variables, secrets, or full internal errors to browser payloads.
- Validate Host and Origin headers against localhost-only values for every HTTP and WebSocket route.
- Sanitize rich-copy HTML fragments, stripping scripts, event handlers, and executable attributes.

## Deferred Controls

- SameSite session cookie after one-time URL bootstrap if Phase 6 keeps cookie-based sessions.
- Token replay tests.
- Symlink, junction, UNC, encoded traversal, and Windows drive-case tests.
- Crossnote dependency audit mitigation: `markdown-it-html5-embed` currently pulls nested `markdown-it@8.4.2` with no npm audit fix. Keep that feature surface unavailable from defaults, workspace config, and imports, then revisit dependency replacement or patching before release gates.

## Phase 1 Gate

No Crossnote rendering path may execute code chunks or load arbitrary parser/head JavaScript. Phase 2 must keep all render calls behind a safe adapter that preserves these defaults.