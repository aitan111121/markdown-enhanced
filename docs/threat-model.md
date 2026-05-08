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
- Do not expose environment variables, secrets, or full internal errors to browser payloads.

## Deferred Controls

- Host and Origin validation for every route and WebSocket upgrade.
- SameSite session cookie after one-time URL bootstrap if Phase 6 keeps cookie-based sessions.
- Token replay tests.
- Symlink, junction, UNC, encoded traversal, and Windows drive-case tests.
- Sanitized rich-copy fragments that strip scripts and event handlers.

## Phase 1 Gate

No Crossnote rendering path may execute code chunks or load arbitrary parser/head JavaScript. Phase 2 must keep all render calls behind a safe adapter that preserves these defaults.