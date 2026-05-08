import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { assertPathInside } from "./path-safety.js";

const CUSTOM_STYLE_RELATIVE_PATH = path.join(".crossnote", "style.less");
const MAX_CUSTOM_STYLE_BYTES = 64 * 1024;

export type SafeCustomStyleResult = {
  css?: string;
  sourcePath?: string;
  diagnostics: string[];
};

export async function getCustomStylePath(workspaceRoot: string): Promise<string> {
  const root = await realpath(workspaceRoot);
  return path.join(root, CUSTOM_STYLE_RELATIVE_PATH);
}

export async function resolveExistingCustomStylePath(workspaceRoot: string): Promise<string | undefined> {
  try {
    const root = await realpath(workspaceRoot);
    const candidatePath = await getCustomStylePath(root);
    const stylePath = await realpath(candidatePath);
    assertPathInside(root, stylePath);
    const styleStat = await stat(stylePath);
    return styleStat.isFile() ? stylePath : undefined;
  } catch {
    return undefined;
  }
}

export async function loadSafeCustomStyle(workspaceRoot: string): Promise<SafeCustomStyleResult> {
  const stylePath = await resolveExistingCustomStylePath(workspaceRoot);
  if (!stylePath) {
    return { diagnostics: [] };
  }

  let styleStat: Awaited<ReturnType<typeof stat>>;
  try {
    styleStat = await stat(stylePath);
  } catch {
    return {
      sourcePath: stylePath,
      diagnostics: ["Custom style could not be read and was ignored"]
    };
  }

  if (styleStat.size > MAX_CUSTOM_STYLE_BYTES) {
    return {
      sourcePath: stylePath,
      diagnostics: [`Custom style exceeds ${MAX_CUSTOM_STYLE_BYTES} bytes and was ignored`]
    };
  }

  let rawCss: string;
  try {
    rawCss = await readFile(stylePath, "utf8");
  } catch {
    return {
      sourcePath: stylePath,
      diagnostics: ["Custom style could not be read and was ignored"]
    };
  }

  const sanitized = sanitizeCustomCss(rawCss);

  return {
    css: sanitized.css,
    sourcePath: stylePath,
    diagnostics: sanitized.diagnostics
  };
}

export function sanitizeCustomCss(css: string): { css?: string; diagnostics: string[] } {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  if (!withoutComments) {
    return { diagnostics: [] };
  }

  if (hasUnsupportedCssSyntax(withoutComments)) {
    return { diagnostics: ["Custom style contains unsupported CSS syntax and was ignored"] };
  }

  if (!hasOnlyPreviewScopedRules(withoutComments)) {
    return { diagnostics: ["Custom style must target .markdown-preview or .preview-root selectors"] };
  }

  return { css: withoutComments, diagnostics: [] };
}

function hasUnsupportedCssSyntax(css: string): boolean {
  return /\\|@import\b|[a-z-]+\s*\(|expression\s*\(|behavior\s*:|-moz-binding|javascript\s*:|vbscript\s*:|data\s*:|file\s*:|<|<\/style/i.test(css);
}

function hasOnlyPreviewScopedRules(css: string): boolean {
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let cursor = 0;
  let matched = false;
  let match: RegExpExecArray | null;

  while ((match = rulePattern.exec(css))) {
    if (css.slice(cursor, match.index).trim() !== "") {
      return false;
    }

    const selectors = match[1].split(",").map((selector) => selector.trim()).filter(Boolean);
    if (selectors.length === 0 || selectors.some((selector) => !isPreviewScopedSelector(selector))) {
      return false;
    }

    matched = true;
    cursor = match.index + match[0].length;
  }

  return matched && css.slice(cursor).trim() === "";
}

function isPreviewScopedSelector(selector: string): boolean {
  return selector.startsWith(".markdown-preview") || selector.startsWith(".preview-root");
}
