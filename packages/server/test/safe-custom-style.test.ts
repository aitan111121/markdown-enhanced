import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadSafeCustomStyle, sanitizeCustomCss } from "../src/safe-custom-style.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("sanitizeCustomCss", () => {
  it("allows preview-scoped CSS", () => {
    const result = sanitizeCustomCss(".markdown-preview h1 { color: red; }\n.preview-root { padding: 8px; }");

    expect(result.css).toContain(".markdown-preview h1");
    expect(result.diagnostics).toEqual([]);
  });

  it("rejects global selectors", () => {
    const result = sanitizeCustomCss("body { display: none; }");

    expect(result.css).toBeUndefined();
    expect(result.diagnostics).toContain("Custom style must target .markdown-preview or .preview-root selectors");
  });

  it("rejects imports and URL fetches", () => {
    const result = sanitizeCustomCss('@import "theme.less"; .markdown-preview { background: url(file:///secret); }');

    expect(result.css).toBeUndefined();
    expect(result.diagnostics).toContain("Custom style contains unsupported CSS syntax and was ignored");
  });

  it("rejects escaped URL and import syntax", () => {
    const probes = [
      ".markdown-preview { background: u\\72l(https://example.com/pixel); }",
      ".markdown-preview { background: image-set(\"a.png\" 1x); }",
      ".markdown-preview { background: j\\61vascript:alert(1); }",
      "\\40import \"theme.less\"; .markdown-preview { color: red; }"
    ];

    for (const css of probes) {
      const result = sanitizeCustomCss(css);
      expect(result.css).toBeUndefined();
      expect(result.diagnostics).toContain("Custom style contains unsupported CSS syntax and was ignored");
    }
  });
});

describe("loadSafeCustomStyle", () => {
  it("returns no diagnostics when style file is absent", async () => {
    const workspace = await makeTempRoot();

    await expect(loadSafeCustomStyle(workspace)).resolves.toEqual({ diagnostics: [] });
  });

  it("loads sanitized .crossnote/style.less", async () => {
    const workspace = await makeTempRoot();
    await writeStyle(workspace, ".markdown-preview h2 { color: #2563eb; }");

    const result = await loadSafeCustomStyle(workspace);
    const expectedPath = await realpath(path.join(workspace, ".crossnote", "style.less"));

    expect(result.css).toContain(".markdown-preview h2");
    expect(result.sourcePath).toBe(expectedPath);
    expect(result.diagnostics).toEqual([]);
  });

  it("ignores custom styles above the size cap", async () => {
    const workspace = await makeTempRoot();
    await writeStyle(workspace, `.markdown-preview { color: red; }\n${"a".repeat(70 * 1024)}`);

    const result = await loadSafeCustomStyle(workspace);

    expect(result.css).toBeUndefined();
    expect(result.diagnostics[0]).toContain("Custom style exceeds");
  });
});

async function writeStyle(workspace: string, contents: string): Promise<void> {
  const crossnoteDir = path.join(workspace, ".crossnote");
  await mkdir(crossnoteDir);
  await writeFile(path.join(crossnoteDir, "style.less"), contents);
}

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "zed-mpe-style-"));
  tempRoots.push(root);
  return root;
}
