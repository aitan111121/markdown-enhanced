# Webview Evolution

The current preview surface is an external browser because Zed does not expose a verified VS Code-style webview or custom preview API for this extension's needs.

## Current Adapter

```text
Zed task -> zed-mpe CLI -> localhost render/session core -> external browser shell
```

The browser shell owns display, status, table of contents, diagnostics, rich copy, HTML export, and draft editing controls. The server owns file access, rendering, tokens, and write safety.

## Future Hybrid Candidate

```text
Zed command/panel -> same render/session/security core -> native preview shell

                                                  -> external browser fallback
```

A native Zed surface should be an adapter, not a replacement for the core. It should reuse the same render payload, path containment, token/session model or equivalent authenticated channel, copy/export sanitization, and draft apply checks.

## Surface Responsibilities

| Responsibility | Current Browser | Future Native Candidate |
|---|---|---|
| Launch | CLI opened by Zed task | Zed command or preview action if API exists |
| Session bootstrap | One-time token URL | Verified editor-owned channel or equivalent token gate |
| Render display | Browser DOM shell | Native webview/panel shell |
| Copy/export | Sanitized browser actions | Same sanitizer before clipboard/export |
| Diagnostics | Browser status/sidebar panels | Native panel UI using same payload |
| Draft apply | Token-gated server endpoint | Same stale/backup/atomic write rules |

## Invariants

- Keep `127.0.0.1` or an equally local authenticated channel.
- Keep path containment and size caps on the server side.
- Keep code chunks, parser JavaScript, remote preview, and public bind disabled by default.
- Do not use unsaved editor buffers until Zed provides a safe buffer API and this repo has a separate threat model for it.
- Keep the external browser path available for users who prefer it or when native APIs are unavailable.