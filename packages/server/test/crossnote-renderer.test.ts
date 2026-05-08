import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { clearRendererCache, renderMarkdown } from "../src/crossnote-renderer.js";

const tempRoots: string[] = [];

afterEach(async () => {
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

    expect(result.html).toContain("<h1>Hello</h1>");
    expect(result.html).toContain("<p>World</p>");
    expect(result.html).toContain('class="markdown-preview"');
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

  it("escapes HTML tags by default", async () => {
    const workspace = await makeTempRoot();
    const result = await renderMarkdown({
      markdown: "<script>alert(1)</script>",
      sourcePath: "/test/note.md",
      workspaceRoot: workspace
    });

    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).not.toContain("<script>");
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
    expect(result.metadata?.toc?.[1].slug).toBe("foo-bar");
  });
});

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "zed-mpe-renderer-"));
  tempRoots.push(root);
  return root;
}
