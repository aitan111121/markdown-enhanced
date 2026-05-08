import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearRendererCache, renderMarkdown } from "../src/crossnote-renderer.js";

const tempRoots: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  clearRendererCache();
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("renderMarkdown", () => {
  it("converts markdown to HTML", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "# Hello\n\nWorld",
      sourcePath: "/test/note.md",
      workspaceRoot: workspace
    });

    expect(result.html).toMatch(/<h1[^>]*>Hello\s*<\/h1>/);
    expect(result.html).toMatch(/<p[^>]*>World<\/p>/);
    expect(result.html).toContain('class="markdown-preview"');
    expect(result.diagnostics).toEqual([]);
  });

  it("extracts plain text from HTML", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "# Title\n\nParagraph with **bold**.",
      sourcePath: "/test/note.md",
      workspaceRoot: workspace
    });

    expect(result.plainText).toContain("Title");
    expect(result.plainText).toContain("Paragraph with bold");
    expect(result.plainText).not.toContain("<");
    expect(result.plainText).not.toContain("**");
  });

  it("builds table of contents from headings", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "# Main Title\n## Section One\n### Subsection\n## Section Two",
      sourcePath: "/test/note.md",
      workspaceRoot: workspace
    });

    expect(result.metadata?.toc).toEqual([
      { level: 1, text: "Main Title", slug: "main-title" },
      { level: 2, text: "Section One", slug: "section-one" },
      { level: 3, text: "Subsection", slug: "subsection" },
      { level: 2, text: "Section Two", slug: "section-two" }
    ]);
  });

  it("strips executable HTML tags by default", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "<script>alert(1)</script>",
      sourcePath: "/test/note.md",
      workspaceRoot: workspace
    });

    expect(result.html).not.toContain("<script>");
    expect(result.html).not.toContain("alert(1)");
  });

  it("removes active preview HTML containers after Crossnote rendering", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "<style>body{display:none}</style><iframe src=\"https://example.com\"></iframe><p onclick=\"alert(1)\">Hi</p>",
      sourcePath: path.join(workspace, "html.md"),
      workspaceRoot: workspace
    });

    expect(result.html).not.toContain("<style");
    expect(result.html).not.toContain("<iframe");
    expect(result.html).not.toContain("onclick");
    expect(result.html).toContain("Hi");
  });

  it("extracts front matter from Crossnote metadata", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "---\ntitle: Feature Probe\ntags:\n  - zed\n---\n# Feature Probe",
      sourcePath: path.join(workspace, "note.md"),
      workspaceRoot: workspace
    });

    expect(result.metadata?.frontMatter).toMatchObject({
      title: "Feature Probe",
      tags: ["zed"]
    });
    expect(result.html).toContain("Feature Probe");
  });

  it("renders KaTeX math through Crossnote", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "Inline math $x + y$.",
      sourcePath: path.join(workspace, "math.md"),
      workspaceRoot: workspace
    });

    expect(result.html).toContain("katex");
    expect(result.html).toContain("x");
    expect(result.html).toContain("y");
  });

  it("keeps Mermaid diagrams as renderable preview blocks", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "```mermaid\ngraph TD\n  A-->B\n```",
      sourcePath: path.join(workspace, "diagram.md"),
      workspaceRoot: workspace
    });

    expect(result.html.toLowerCase()).toContain("mermaid");
    expect(result.html).toContain("graph TD");
    expect(result.diagnostics).toEqual([]);
  });

  it("ignores hostile workspace Crossnote config in Phase 2", async () => {
    const workspace = await makeTempRoot();
    await mkdir(path.join(workspace, ".crossnote"));
    await writeFile(
      path.join(workspace, ".crossnote", "config.js"),
      "module.exports = { enableHTML5Embed: true, HTML5EmbedUseLinkSyntax: true, HTML5EmbedIsAllowedHttp: true };"
    );

    const result = await renderMarkdown({
      markdown: "@[youtube](dQw4w9WgXcQ)",
      sourcePath: path.join(workspace, "hostile.md"),
      workspaceRoot: workspace
    });

    expect(result.html).not.toContain("<iframe");
    expect(result.html).not.toContain("<video");
    expect(result.html).not.toContain("youtube.com");
    expect(result.diagnostics).toEqual([]);
  });

  it("disables local Crossnote imports that escape the workspace", async () => {
    const workspace = await makeTempRoot();
    const outsidePath = path.join(path.dirname(workspace), `${path.basename(workspace)}-outside.md`);
    tempRoots.push(outsidePath);
    await writeFile(outsidePath, "outside secret");

    const result = await renderMarkdown({
      markdown: `@import "../${path.basename(outsidePath)}"`,
      sourcePath: path.join(workspace, "note.md"),
      workspaceRoot: workspace
    });

    expect(result.html).not.toContain("outside secret");
    expect(result.html).toContain("import");
    expect(result.diagnostics).toContain("Crossnote import directives are disabled by default");
  });

  it("disables remote Crossnote imports", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: '@import "https://example.com/"',
      sourcePath: path.join(workspace, "remote.md"),
      workspaceRoot: workspace
    });

    expect(result.html).not.toContain("Example Domain");
    expect(result.html).toContain("https://example.com/");
    expect(result.diagnostics).toContain("Crossnote import directives are disabled by default");
  });

  it("warns and keeps runnable code chunks disabled", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "```js {cmd=true}\nconsole.log('should-not-run')\n```",
      sourcePath: path.join(workspace, "chunk.md"),
      workspaceRoot: workspace
    });

    expect(result.diagnostics).toContain("Code chunk execution is disabled by default");
    expect(result.html).toContain("should-not-run");
  });

  it("handles render errors gracefully", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "valid markdown",
      sourcePath: "/test/note.md",
      workspaceRoot: workspace
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.html).toBeTruthy();
  });

  it("linkifies URLs", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "Visit https://example.com",
      sourcePath: "/test/note.md",
      workspaceRoot: workspace
    });

    expect(result.html).toContain('<a href="https://example.com">');
  });

  it("preserves line breaks when breaks option is enabled", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "Line one\nLine two",
      sourcePath: "/test/note.md",
      workspaceRoot: workspace
    });

    expect(result.html).toContain("<br>");
  });

  it("creates slugs from heading text", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "# Hello World!\n## Foo & Bar",
      sourcePath: "/test/note.md",
      workspaceRoot: workspace
    });

    expect(result.metadata?.toc?.[0].slug).toBe("hello-world");
    expect(result.metadata?.toc?.[1].slug).toBe("foo–bar");
  });
});

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "zed-mpe-renderer-"));
  tempRoots.push(root);
  return root;
}
