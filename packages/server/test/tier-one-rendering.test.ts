import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderSavedFile } from "../src/saved-file-preview.js";

const workspaceRoot = path.resolve("..", "..");
const fixturePath = path.join(workspaceRoot, "fixtures", "markdown", "tier-one-features.md");

describe("tier one rendering fixture", () => {
  it("renders front matter, TOC, GFM, math, Mermaid, and code blocks", async () => {
    const result = await renderSavedFile({ workspaceRoot, filePath: fixturePath });

    expect(result.metadata?.frontMatter).toMatchObject({ title: "Tier One Feature Fixture" });
    expect(result.metadata?.toc?.map((entry) => entry.text)).toEqual(expect.arrayContaining([
      "Tier One Feature Fixture",
      "GFM Table",
      "Task List",
      "Math",
      "Mermaid",
      "Code"
    ]));
    expect(result.html).toContain("<table>");
    expect(result.html).toContain("Task lists");
    expect(result.html).toContain("Tier one footnote content");
    expect(result.html).toContain("katex");
    expect(result.html.toLowerCase()).toContain("mermaid");
    expect(result.html).toContain('data-role="codeBlock"');
    expect(result.html).toContain("phase");
    expect(result.diagnostics).toEqual([]);
  });
});
