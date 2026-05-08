import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { renderSavedFile } from "../src/saved-file-preview.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("renderSavedFile", () => {
  it("renders markdown to HTML", async () => {
    const { root, filePath } = await writeTempFile("# Hello\n\nWorld");

    const result = await renderSavedFile({ workspaceRoot: root, filePath });

    expect(result.html).toMatch(/<h1[^>]*>Hello\s*<\/h1>/);
    expect(result.html).toMatch(/<p[^>]*>World<\/p>/);
    expect(result.plainText).toContain("Hello");
    expect(result.plainText).toContain("World");
    expect(result.diagnostics).toEqual([]);
  });

  it("strips dangerous HTML when html mode is disabled", async () => {
    const { root, filePath } = await writeTempFile("<script>alert(1)</script>");

    const result = await renderSavedFile({ workspaceRoot: root, filePath });

    expect(result.html).not.toContain("<script>");
    expect(result.html).not.toContain("alert(1)");
  });

  it("renders Crossnote front matter and math features", async () => {
    const { root, filePath } = await writeTempFile("---\ntitle: Saved Probe\n---\n# Saved Probe\n\n$x + y$");

    const result = await renderSavedFile({ workspaceRoot: root, filePath });

    expect(result.metadata?.frontMatter).toMatchObject({ title: "Saved Probe" });
    expect(result.html).toContain("katex");
  });

  it("attaches safe workspace custom CSS", async () => {
    const { root, filePath } = await writeTempFile("# Styled");
    await mkdir(path.join(root, ".crossnote"));
    await writeFile(path.join(root, ".crossnote", "style.less"), ".markdown-preview h1 { color: #2563eb; }");

    const result = await renderSavedFile({ workspaceRoot: root, filePath });

    expect(result.customStyle?.css).toContain(".markdown-preview h1");
    expect(result.diagnostics).toEqual([]);
  });

  it("reports unsafe custom CSS without attaching it", async () => {
    const { root, filePath } = await writeTempFile("# Styled");
    await mkdir(path.join(root, ".crossnote"));
    await writeFile(path.join(root, ".crossnote", "style.less"), "body { display: none; }");

    const result = await renderSavedFile({ workspaceRoot: root, filePath });

    expect(result.customStyle).toBeUndefined();
    expect(result.diagnostics).toContain("Custom style must target .markdown-preview or .preview-root selectors");
  });

  it("extracts table of contents from headings", async () => {
    const { root, filePath } = await writeTempFile("# Title\n## Section\n### Subsection");

    const result = await renderSavedFile({ workspaceRoot: root, filePath });

    expect(result.metadata?.toc).toEqual([
      { level: 1, text: "Title", slug: "title" },
      { level: 2, text: "Section", slug: "section" },
      { level: 3, text: "Subsection", slug: "subsection" }
    ]);
  });

  it("attaches source state and passive link diagnostics", async () => {
    const root = await makeTempRoot();
    const filePath = path.join(root, "note.md");
    await writeFile(filePath, "# Links\n\n[Missing](missing.md)");

    const result = await renderSavedFile({ workspaceRoot: root, filePath });

    expect(result.sourceText).toContain("[Missing]");
    expect(result.sourceVersion?.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.linkDiagnostics).toEqual([
      expect.objectContaining({ status: "missing", target: "missing.md" })
    ]);
  });

  it("rechecks the file size before render", async () => {
    const { root, filePath } = await writeTempFile("0123456789");

    await expect(renderSavedFile({ workspaceRoot: root, filePath, maxBytes: 4 })).rejects.toThrow("exceeds 4 bytes");
  });

  it("rechecks workspace containment before render", async () => {
    const workspace = await makeTempRoot();
    const outside = await writeTempFile("# Outside");

    await expect(renderSavedFile({ workspaceRoot: workspace, filePath: outside.filePath })).rejects.toThrow(
      "Path escapes workspace root"
    );
  });
});

async function writeTempFile(contents: string): Promise<{ root: string; filePath: string }> {
  const root = await makeTempRoot();
  const filePath = path.join(root, "note.md");
  await writeFile(filePath, contents);
  return { root, filePath };
}

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "zed-mpe-render-"));
  tempRoots.push(root);
  return root;
}