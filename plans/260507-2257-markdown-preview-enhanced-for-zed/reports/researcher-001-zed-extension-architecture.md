# Zed Extension Development: Markdown Preview Enhanced Research Report

**Date:** May 7, 2026  
**Status:** Planning Research Complete  
**Scope:** Architecture feasibility for Markdown Preview Enhanced-like extension  

---

## Executive Summary

Building a Markdown Preview Enhanced (MPE) equivalent for Zed requires **fundamental architectural compromises** due to Zed's extension model lacking webview/rich UI support. Unlike VS Code, Zed extensions cannot render inline previews or custom panels. The viable approach is **browser-based preview server (external browser)** combined with file watching via the extension.

**Key Finding:** Zed extensions do NOT support VS Code-style webviews. This is a critical constraint that fundamentally changes the implementation pattern.

---

## Acceptance Criteria Analysis

### 1. Webview/Inline Rich Preview Support

**Q: Does Zed support VS Code-style webviews?**

**A: NO.** Zed extension API does not provide webview, panel, or custom UI rendering capabilities.

**Evidence:**
- **Official Extension API** (zed_extension_api v0.6.0+): Only 4 modules available
  - http_client — HTTP requests only
  - lsp — Language server protocol integration
  - process — Subprocess execution
  - settings — User settings access
  
- **Extension Types** supported (from official docs):
  - Languages (syntax highlighting, parsing, LSP)
  - Debuggers (DAP protocol)
  - Themes & Icon Themes (static assets)
  - Snippets (static templates)
  - Agent Servers (MCP servers)
  - NO: Custom views, panels, webviews, or rich UI components

- **Zed Architecture:** Uses GPUI (Zed's proprietary GPU-accelerated UI framework). Extension system is sandboxed WebAssembly with no access to GPUI rendering.

**Alternative Pattern:**
- **External Browser Preview** — Open HTML in user's default browser; extension watches files and sends updates via HTTP
- **Terminal-Only Preview** — Render Markdown in terminal with ANSI escape sequences (limited, but possible)
- **Monitor + Manual Refresh** — Extension watches files, user manually opens preview in separate browser tab

**Lowest-Risk Alternative:** External browser with live reload via WebSocket or polling.

---

### 2. Launching/Integrating Local Server/Process

**Q: Can a Zed extension launch and integrate with a local server?**

**A: YES, with limitations.**

**Capabilities:**
- **Process Execution:** process:exec capability allows spawning arbitrary commands
- **HTTP Client:** Built-in HTTP client in zed_extension_api::http_client
- **Subprocess Lifecycle:** Extensions can spawn, monitor, and communicate with child processes

**Constraints:**
1. **Single-Shot vs. Persistent:** Extensions run on-demand (when invoked). To keep a server persistent:
   - Option A: User starts server manually via task/terminal (extension doesn't manage lifecycle)
   - Option B: Extension spawns server on first call, manages PID in memory (dies when extension unloads)
   - Option C: Use Zed's Tasks system to define background server task (project-level, not extension-level)

2. **Worktree Context:** Process access is via Worktree struct—can detect project root and working directory

3. **No IPC Channel:** Cannot directly communicate with spawned process via Zed API. Must use:
   - HTTP/REST
   - Unix sockets / named pipes (manual implementation)
   - Stdin/stdout (for CLI tools)

**Recommended Pattern:**
- **Thin Extension + External Server:** Extension launches Node/Python server on first use (via task or CLI wrapper)
- **HTTP Bridge:** Extension → Server communication via REST/WebSocket
- **Server Lifecycle:** User controls via task (zed: spawn task)

---

### 3. APIs & Constraints for Opening Browser Preview

**Available:**
- ✅ process:exec — Can spawn xdg-open URL (Linux), open URL (macOS), start URL (Windows)
- ✅ http_client — Can serve HTML/JSON from extension-spawned server
- ✅ File watching — Can monitor Markdown files via Worktree APIs
- ✅ Clipboard — Can read/write clipboard (check docs for specifics)

**Not Available:**
- ❌ Webview/panel rendering
- ❌ Direct browser control (no Puppeteer-like API)
- ❌ Inline preview panes
- ❌ Extension-managed background processes with guaranteed lifecycle

**Communication Constraints:**
- File updates: File watch → HTTP notification or Polling
- Browser → Zed: Not directly possible. (User must switch back to Zed, or use clipboard handoff)
- Zed → Browser: HTTP POST or WebSocket push from extension server

---

### 4. Filesystem/Worktree Access

**Available:**
- ✅ Read current worktree root: worktree.root_name()
- ✅ Read file paths from worktree context
- ✅ File metadata via process (calling stat, ls, etc.)
- ✅ Access to ZED_WORKTREE_ROOT in tasks

**Constraints:**
- **No Direct File API:** Cannot read/write files directly from extension code. Must use:
  - Shell commands: cat, echo, etc. (requires process:exec)
  - Language server protocol (if LSP server provides file access)
  - Delegate to spawned server process

---

## Recommended Architecture: Lowest-Risk Pattern

### **Architecture: Extension + External Preview Server**

`
Zed Editor
├─ Extension (Thin WASM)
│  ├─ File Watch
│  ├─ File Parser
│  └─ HTTP Client
│      │
│      └─ HTTP (file updates)
│          ▼
│   Preview Server (Node.js/Python)
│   ├─ Markdown Render
│   ├─ Live Reload
│   └─ WebSocket Server
│       │
│       └─ HTTP (HTML)
│           ▼
│       Browser Window (External)
`

### **Deployment Strategy**

| Component | Location | Scope | Lifecycle |
|-----------|----------|-------|-----------|
| Extension | Zed Plugin Registry | Per-user | Zed process lifetime |
| Server | User installs via npm/pip | Global or project | Task/User-managed |
| Browser | User's default browser | External | User-managed |

---

## Extension Capabilities Checklist

| Capability | Zed Support | Risk | Workaround |
|---|---|---|---|
| Inline/Webview Preview | ❌ NO | **HIGH** | → External browser |
| Process Spawning | ✅ YES | LOW | Direct API call |
| HTTP Client | ✅ YES | LOW | Direct API call |
| File Watching | ⚠️ PARTIAL | MEDIUM | Use LSP or polling |
| Worktree Access | ✅ YES | LOW | Direct API call |
| Keyboard Shortcuts | ✅ YES | LOW | Register command |
| Configuration Settings | ✅ YES | LOW | Use settings API |
| Clipboard I/O | ✅ YES | LOW | Shell commands |

---

## Risks & Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| **No Webview** — User must switch to external browser | HIGH | Design for two-window workflow; use browser tabs |
| **File Watch Latency** — Polling vs. event-driven | MEDIUM | Use filesystem watcher library; consider inotify/FSEvents via subprocess |
| **Process Lifecycle** — Server dies if extension unloads | MEDIUM | Use Zed Tasks for persistent server; document manual start |
| **Cross-Platform Paths** — Windows vs. Unix differences | MEDIUM | Use Rust Path APIs in extension; subprocess handles shell escaping |
| **Port Conflicts** — Multiple Zed instances fight over port 3000 | MEDIUM | Dynamic port allocation; store in .zed/markdown-preview.json |
| **Browser Handoff** — User must manually open/switch browser | MEDIUM | Provide deep-link support; copy URL to clipboard automatically |

---

## Tech Stack Recommendations

### Extension (Rust)
- **Language:** Rust (WebAssembly)
- **Frameworks:** zed_extension_api v0.6.0+
- **File Watching:** Worktree API + polling (simple) or shell watchman (advanced)
- **HTTP Client:** Built-in zed_extension_api::http_client

### Preview Server (Your Choice)
- **Option A (Recommended):** Node.js + Express + markdown-it
- **Option B:** Python + Flask + markdown
- **Option C:** Rust (standalone binary)

### Browser (Client)
- **Framework:** Vanilla JS or lightweight framework (Preact)
- **Live Reload:** WebSocket (push) or HTTP polling (5s interval)
- **Rendering:** Browser's native HTML parsing; CSS for styling

---

## Unresolved Questions

1. **File change detection:** Should extension poll or use filesystem watcher?
2. **Server persistence:** How to ensure preview server survives Zed restarts?
3. **Multi-document preview:** 5 browsers or 1 browser with tabs?
4. **Syntax extensions:** Can extension delegate to custom remark plugins?
5. **Clipboard URI handoff:** Should extension automatically copy preview URL?

---

## Authoritative Sources

- Zed Extension API: https://docs.rs/zed_extension_api/latest/zed_extension_api/
- Zed Extension Capabilities: https://zed.dev/docs/extensions/capabilities.html
- Zed Extension Development: https://zed.dev/docs/extensions/developing-extensions.html
- Zed Tasks System: https://zed.dev/docs/tasks.html
- Zed Worktree API: https://docs.rs/zed_extension_api/latest/zed_extension_api/struct.Worktree.html
- Zed GitHub: https://github.com/zed-industries/zed

---

**Report Status:** COMPLETE — Ready for implementation planning phase.
