import path from "node:path";
import type { RenderPayload } from "./contracts.js";

const BASE_EXPORT_CSS = `
:root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
body { margin: 0; background: Canvas; color: CanvasText; }
.markdown-preview { box-sizing: border-box; margin: 0 auto; max-width: 880px; padding: 32px 24px 64px; }
.markdown-preview pre { background: color-mix(in srgb, CanvasText 6%, transparent); border: 1px solid color-mix(in srgb, CanvasText 12%, transparent); border-radius: 8px; overflow: auto; padding: 16px; white-space: pre-wrap; }
.markdown-preview code { background: color-mix(in srgb, CanvasText 8%, transparent); border-radius: 3px; font-family: "JetBrains Mono", "Fira Code", Consolas, Monaco, monospace; font-size: 0.9em; padding: 2px 6px; }
.markdown-preview pre code { background: none; padding: 0; }
.markdown-preview table { border-collapse: collapse; margin: 16px 0; width: 100%; }
.markdown-preview th, .markdown-preview td { border: 1px solid color-mix(in srgb, CanvasText 20%, transparent); padding: 8px 12px; text-align: left; }
.markdown-preview th { background: color-mix(in srgb, CanvasText 6%, transparent); font-weight: 600; }
.markdown-preview h1, .markdown-preview h2, .markdown-preview h3, .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 { font-weight: 600; line-height: 1.25; margin-bottom: 16px; margin-top: 24px; }
.markdown-preview h1 { border-bottom: 1px solid color-mix(in srgb, CanvasText 16%, transparent); font-size: 2em; padding-bottom: 8px; }
.markdown-preview h2 { border-bottom: 1px solid color-mix(in srgb, CanvasText 12%, transparent); font-size: 1.5em; padding-bottom: 6px; }
.markdown-preview a { color: #2563eb; text-decoration: none; }
.markdown-preview a:hover { text-decoration: underline; }
.markdown-preview blockquote { border-left: 4px solid color-mix(in srgb, CanvasText 30%, transparent); margin: 16px 0; padding-left: 16px; }
.markdown-preview img { height: auto; max-width: 100%; }
`;

export function createHtmlExport(payload: RenderPayload): string {
  const title = getExportTitle(payload);
  const customStyle = payload.customStyle?.css ? `\n<style>\n${payload.customStyle.css}\n</style>` : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="generator" content="zed-mpe-preview">
    <title>${escapeHtml(title)}</title>
    <style>
${BASE_EXPORT_CSS.trim()}
    </style>${customStyle}
  </head>
  <body>
${payload.html}
  </body>
</html>`;
}

export function getHtmlExportFileName(sourcePath: string): string {
  const parsed = path.parse(sourcePath);
  const baseName = parsed.name.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "preview";
  return `${baseName}.html`;
}

function getExportTitle(payload: RenderPayload): string {
  const title = payload.metadata?.frontMatter?.title;
  return typeof title === "string" && title.trim() ? title.trim() : path.parse(payload.sourcePath).name;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
