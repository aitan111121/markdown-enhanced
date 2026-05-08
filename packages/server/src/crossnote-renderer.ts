import MarkdownIt from "markdown-it";
import type { RenderPayload, TocEntry } from "./contracts.js";
import { getSafeMarkdownConfig } from "./safe-crossnote-config.js";

type RendererCache = {
  engine: MarkdownIt;
  config: ReturnType<typeof getSafeMarkdownConfig>;
};

const rendererCache = new Map<string, RendererCache>();

export async function renderMarkdown(input: {
  markdown: string;
  sourcePath: string;
  workspaceRoot: string;
}): Promise<RenderPayload> {
  const config = getSafeMarkdownConfig();
  const engine = getOrCreateEngine(input.workspaceRoot, config);
  const diagnostics: string[] = [];

  try {
    const html = engine.render(input.markdown);
    const plainText = extractPlainText(html);
    const toc = extractToc(input.markdown);

    return {
      html: wrapInArticle(html),
      plainText,
      sourcePath: input.sourcePath,
      diagnostics,
      metadata: {
        toc
      }
    };
  } catch (error) {
    diagnostics.push(`Render error: ${error instanceof Error ? error.message : String(error)}`);

    return {
      html: wrapInArticle(`<pre>${escapeHtml(input.markdown)}</pre>`),
      plainText: input.markdown,
      sourcePath: input.sourcePath,
      diagnostics
    };
  }
}

function getOrCreateEngine(workspaceRoot: string, config: ReturnType<typeof getSafeMarkdownConfig>): MarkdownIt {
  const cached = rendererCache.get(workspaceRoot);

  if (cached && configMatches(cached.config, config)) {
    return cached.engine;
  }

  const engine = new MarkdownIt({
    html: config.html,
    breaks: config.breaks,
    linkify: config.linkify,
    typographer: config.typographer
  });

  rendererCache.set(workspaceRoot, { engine, config });
  return engine;
}

function configMatches(
  a: ReturnType<typeof getSafeMarkdownConfig>,
  b: ReturnType<typeof getSafeMarkdownConfig>
): boolean {
  return (
    a.html === b.html &&
    a.breaks === b.breaks &&
    a.linkify === b.linkify &&
    a.typographer === b.typographer &&
    a.enableScriptExecution === b.enableScriptExecution &&
    a.allowCustomParser === b.allowCustomParser &&
    a.runAllCodeChunks === b.runAllCodeChunks
  );
}

function extractToc(markdown: string): TocEntry[] {
  const toc: TocEntry[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const slug = slugify(text);
      toc.push({ level, text, slug });
    }
  }

  return toc;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractPlainText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\n+/g, "\n\n")
    .trim();
}

function wrapInArticle(html: string): string {
  return `<article class="markdown-preview">\n${html}\n</article>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function clearRendererCache(workspaceRoot?: string): void {
  if (workspaceRoot) {
    rendererCache.delete(workspaceRoot);
  } else {
    rendererCache.clear();
  }
}
