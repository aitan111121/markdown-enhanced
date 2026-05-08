import type { PreviewSession } from "./contracts.js";

export function createPreviewShell(session: PreviewSession): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Markdown Preview Enhanced</title>
    <link rel="stylesheet" href="/assets/preview.css">
  </head>
  <body data-session-id="${escapeAttribute(session.id)}" data-token="${escapeAttribute(session.socketToken)}" data-style-nonce="${escapeAttribute(session.styleNonce)}">
    <header class="preview-toolbar">
      <strong>Markdown Preview Enhanced</strong>
      <span id="preview-status">Connecting</span>
    </header>
    <div class="preview-workspace">
      <aside id="preview-toc" class="preview-toc" aria-label="Document contents"></aside>
      <section id="preview-main" class="preview-main" aria-label="Markdown preview">
        <main id="preview-root" class="preview-root" aria-live="polite" tabindex="0"></main>
      </section>
    </div>
    <script type="module" src="/assets/browser-preview.js"></script>
  </body>
</html>`;
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}