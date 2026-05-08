import MarkdownIt from "markdown-it";
import { rmSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { evaluateCodeChunkGate } from "./code-chunk-gate.js";
import type { RenderPayload, TocEntry } from "./contracts.js";
import { getSafeMarkdownConfig } from "./safe-crossnote-config.js";
import { sanitizeServerHtml } from "./server-html-sanitizer.js";
import type { MarkdownEngineOutput, Notebook } from "crossnote";

type RendererCache = {
  fallbackEngine: MarkdownIt;
  notebook?: Notebook;
  renderLock?: Promise<void>;
  safeNotebookRoot?: string;
  config: ReturnType<typeof getSafeMarkdownConfig>;
};

type RendererCacheEntry = {
  config: ReturnType<typeof getSafeMarkdownConfig>;
  promise: Promise<RendererCache>;
};

type CrossnoteModule = typeof import("crossnote");

const rendererCache = new Map<string, RendererCacheEntry>();
const require = createRequire(import.meta.url);
let crossnoteModule: CrossnoteModule | undefined;

export async function renderMarkdown(input: {
  markdown: string;
  sourcePath: string;
  workspaceRoot: string;
}): Promise<RenderPayload> {
  const config = getSafeMarkdownConfig();
  const renderer = await getOrCreateRenderer(input.workspaceRoot, config);
  const diagnostics: string[] = [];
  const codeChunkGate = await evaluateCodeChunkGate({
    markdown: input.markdown,
    workspaceRoot: input.workspaceRoot
  });
  diagnostics.push(...codeChunkGate.diagnostics);

  try {
    if (renderer.notebook) {
      const sanitizedMarkdown = disableCrossnoteImports(input.markdown);
      if (sanitizedMarkdown !== input.markdown) {
        diagnostics.push("Crossnote import directives are disabled by default");
      }

      const output = await runSerializedRender(renderer, () =>
        renderWithCrossnote(renderer.notebook!, { ...input, markdown: sanitizedMarkdown })
      );
      return buildPayloadFromCrossnoteOutput(output, input.sourcePath, diagnostics);
    }

    diagnostics.push("Crossnote unavailable; rendered with safe markdown-it fallback");
    const html = sanitizeServerHtml(renderer.fallbackEngine.render(input.markdown));
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
    console.warn(`[zed-mpe] Crossnote render failed; using fallback renderer: ${String(error)}`);
    diagnostics.push("Crossnote render failed; rendered with safe markdown-it fallback");

    try {
      const html = sanitizeServerHtml(renderer.fallbackEngine.render(input.markdown));
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
    } catch (fallbackError) {
      console.warn(`[zed-mpe] Fallback render failed; returning escaped source: ${String(fallbackError)}`);
      diagnostics.push("Fallback render failed; displayed escaped source");

      return {
        html: wrapInArticle(`<pre>${escapeHtml(input.markdown)}</pre>`),
        plainText: input.markdown,
        sourcePath: input.sourcePath,
        diagnostics
      };
    }
  }
}

async function getOrCreateRenderer(
  workspaceRoot: string,
  config: ReturnType<typeof getSafeMarkdownConfig>
): Promise<RendererCache> {
  const cached = rendererCache.get(workspaceRoot);

  if (cached && configMatches(cached.config, config)) {
    return cached.promise;
  }

  const promise = createRenderer(workspaceRoot, config).catch((error: unknown) => {
    rendererCache.delete(workspaceRoot);
    throw error;
  });

  rendererCache.set(workspaceRoot, { config, promise });
  return promise;
}

async function createRenderer(
  workspaceRoot: string,
  config: ReturnType<typeof getSafeMarkdownConfig>
): Promise<RendererCache> {
  const fallbackEngine = new MarkdownIt({
    html: config.html,
    breaks: config.breaks,
    linkify: config.linkify,
    typographer: config.typographer
  });
  const renderer: RendererCache = { fallbackEngine, config };

  try {
    const { Notebook } = loadCrossnoteModule();
    const safeNotebookRoot = await mkdtemp(path.join(tmpdir(), "zed-mpe-crossnote-"));
    renderer.safeNotebookRoot = safeNotebookRoot;
    renderer.notebook = await Notebook.init({
      notebookPath: safeNotebookRoot,
      config: config.crossnote
    });
  } catch (error) {
    console.warn(`[zed-mpe] Crossnote initialization failed; using fallback renderer: ${String(error)}`);
  }

  return renderer;
}

async function runSerializedRender<T>(
  renderer: RendererCache,
  operation: () => Promise<T>
): Promise<T> {
  const previous = renderer.renderLock ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const scheduled = previous.catch(() => undefined).then(() => current);
  renderer.renderLock = scheduled;

  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    release();
    if (renderer.renderLock === scheduled) {
      renderer.renderLock = undefined;
    }
  }
}

async function renderWithCrossnote(
  notebook: Notebook,
  input: { markdown: string; sourcePath: string }
): Promise<MarkdownEngineOutput> {
  const engine = notebook.getNoteMarkdownEngine(input.sourcePath);
  engine.clearCaches();
  return engine.parseMD(input.markdown, {
    useRelativeFilePath: false,
    isForPreview: true,
    hideFrontMatter: false,
    runAllCodeChunks: false,
    fileDirectoryPath: path.dirname(input.sourcePath)
  });
}

function buildPayloadFromCrossnoteOutput(
  output: MarkdownEngineOutput,
  sourcePath: string,
  diagnostics: string[]
): RenderPayload {
  const html = sanitizeServerHtml(output.html);
  const plainText = extractPlainText(html);
  const toc = extractTocFromHtml(html);

  return {
    html: wrapInArticle(html),
    plainText,
    sourcePath,
    diagnostics,
    metadata: {
      frontMatter: output.yamlConfig,
      toc
    }
  };
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
    a.runAllCodeChunks === b.runAllCodeChunks &&
    JSON.stringify(a.crossnote) === JSON.stringify(b.crossnote)
  );
}

function loadCrossnoteModule(): CrossnoteModule {
  crossnoteModule ??= require("crossnote") as CrossnoteModule;
  return crossnoteModule;
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

function extractTocFromHtml(html: string): TocEntry[] {
  const toc: TocEntry[] = [];
  const headingPattern = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(html))) {
    const level = Number(match[1]);
    const attributes = match[2];
    const text = extractPlainText(match[3]);
    const id = attributes.match(/\sid="([^"]+)"/)?.[1] ?? slugify(text);
    toc.push({ level, text, slug: id });
  }

  return toc;
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

function disableCrossnoteImports(markdown: string): string {
  const lines = markdown.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? [];
  let inFence = false;
  let fenceMarker = "";
  let fenceLength = 0;

  return lines
    .map((line) => {
      if (!line) {
        return line;
      }

      const ending = line.match(/\r\n|\n|\r$/)?.[0] ?? "";
      const content = ending ? line.slice(0, -ending.length) : line;
      const fence = content.match(/^\s*(`{3,}|~{3,})/);

      if (fence) {
        const marker = fence[1][0];
        if (!inFence) {
          inFence = true;
          fenceMarker = marker;
          fenceLength = fence[1].length;
        } else if (marker === fenceMarker && fence[1].length >= fenceLength) {
          inFence = false;
          fenceMarker = "";
          fenceLength = 0;
        }

        return line;
      }

      if (!inFence && /^\s*@import(?=\s|\(|["'<])/i.test(content)) {
        return `${content.replace(/@import/i, "&#64;import")}${ending}`;
      }

      return line;
    })
    .join("");
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
    disposeCachedRenderer(rendererCache.get(workspaceRoot));
    rendererCache.delete(workspaceRoot);
  } else {
    for (const entry of rendererCache.values()) {
      disposeCachedRenderer(entry);
    }
    rendererCache.clear();
  }
}

function disposeCachedRenderer(entry?: RendererCacheEntry): void {
  if (!entry) {
    return;
  }

  void entry.promise.then((renderer) => {
    if (renderer.safeNotebookRoot) {
      rmSync(renderer.safeNotebookRoot, { recursive: true, force: true });
    }
  }).catch(() => undefined);
}
