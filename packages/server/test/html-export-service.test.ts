import { describe, expect, it } from "vitest";
import { createHtmlExport } from "../src/html-export-service.js";
import type { RenderPayload } from "../src/contracts.js";

describe("createHtmlExport", () => {
  it("sanitizes exported body HTML defensively", () => {
    const payload: RenderPayload = {
      html: '<article><a href="file:///C:/secret.txt">File</a><a href="https://example.com">Safe</a><img src="java\nscript:alert(1)"></article>',
      plainText: "File Safe",
      sourcePath: "C:\\workspace\\note.md",
      diagnostics: []
    };

    const html = createHtmlExport(payload);

    expect(html).toContain("File");
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain("file://");
    expect(html).not.toContain("java");
  });
});