import { describe, expect, it } from "vitest";
import { sanitizeServerHtml } from "../src/server-html-sanitizer.js";

describe("sanitizeServerHtml", () => {
  it("removes active elements and event handlers", () => {
    const html = sanitizeServerHtml('<p onclick="alert(1)">Text</p><script>alert(1)</script><iframe src="https://example.com"></iframe>');

    expect(html).toContain("Text");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("script");
    expect(html).not.toContain("iframe");
  });

  it("removes unsafe URL attributes", () => {
    const html = sanitizeServerHtml(`
      <a href="file:///C:/secret.txt">File</a>
      <img src="C:\\secret.png">
      <a href="//example.com/tracker">Protocol relative</a>
      <a href="https://example.com/safe">Safe</a>
    `);

    expect(html).toContain("File");
    expect(html).toContain("Protocol relative");
    expect(html).toContain('href="https://example.com/safe"');
    expect(html).not.toContain("file://");
    expect(html).not.toContain("C:\\secret");
    expect(html).not.toContain('href="//example.com/tracker"');
  });

  it("removes URL schemes hidden with controls or entities", () => {
    const html = sanitizeServerHtml('<a href="java&#x0A;script&colon;alert(1)">Hidden</a><img srcset="data:text/html,evil 1x"><a href="java&Tab;script:alert(1)">Tab</a><a href="java&NewLine;script:alert(1)">Newline</a>');

    expect(html).toContain("Hidden");
    expect(html).toContain("Tab");
    expect(html).toContain("Newline");
    expect(html).not.toContain("java");
    expect(html).not.toContain("data:text/html");
  });
});