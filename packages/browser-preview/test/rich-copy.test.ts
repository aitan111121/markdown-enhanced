import { beforeEach, describe, expect, it } from "vitest";
import { extractPlainText } from "../src/plain-text-copy.js";
import { sanitizeHtmlForClipboard } from "../src/rich-copy.js";

describe("HTML Sanitization for Copy", () => {
  let testContainer: HTMLElement;

  beforeEach(() => {
    testContainer = document.createElement("div");
  });

  it("should remove script tags from copied HTML", () => {
    testContainer.innerHTML = `
      <p>Safe content</p>
      <script>alert('xss')</script>
      <p>More content</p>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).not.toContain("alert");
    expect(plainText).toContain("Safe content");
    expect(plainText).toContain("More content");
  });

  it("should remove style tags from copied HTML", () => {
    testContainer.innerHTML = `
      <p>Content</p>
      <style>body { display: none; }</style>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).not.toContain("display: none");
    expect(plainText).toContain("Content");
  });

  it("should preserve text content from headings", () => {
    testContainer.innerHTML = `
      <h1>Main Heading</h1>
      <h2>Subheading</h2>
      <p>Paragraph text</p>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).toContain("Main Heading");
    expect(plainText).toContain("Subheading");
    expect(plainText).toContain("Paragraph text");
  });

  it("should preserve text content from lists", () => {
    testContainer.innerHTML = `
      <ul>
        <li>First item</li>
        <li>Second item</li>
      </ul>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).toContain("First item");
    expect(plainText).toContain("Second item");
  });

  it("should preserve code blocks", () => {
    testContainer.innerHTML = `
      <pre><code>const x = 42;
console.log(x);</code></pre>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).toContain("const x = 42");
    expect(plainText).toContain("console.log(x)");
  });

  it("should handle inline code", () => {
    testContainer.innerHTML = `
      <p>Use <code>console.log()</code> for debugging</p>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).toContain("Use");
    expect(plainText).toContain("console.log()");
    expect(plainText).toContain("for debugging");
  });

  it("should remove error banners from copied content", () => {
    testContainer.innerHTML = `
      <div class="preview-error-banner">Error message</div>
      <p>Actual content</p>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).not.toContain("Error message");
    expect(plainText).toContain("Actual content");
  });

  it("should handle empty content gracefully", () => {
    testContainer.innerHTML = "";

    const plainText = extractPlainText(testContainer);
    expect(plainText).toBe("");
  });

  it("should handle nested structures", () => {
    testContainer.innerHTML = `
      <div>
        <p>Outer paragraph</p>
        <div>
          <p>Inner paragraph</p>
          <ul>
            <li>Nested item</li>
          </ul>
        </div>
      </div>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).toContain("Outer paragraph");
    expect(plainText).toContain("Inner paragraph");
    expect(plainText).toContain("Nested item");
  });

  it("should handle table content", () => {
    testContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </tbody>
      </table>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).toContain("Header 1");
    expect(plainText).toContain("Header 2");
    expect(plainText).toContain("Cell 1");
    expect(plainText).toContain("Cell 2");
  });

  it("should handle blockquotes", () => {
    testContainer.innerHTML = `
      <blockquote>
        <p>Quoted text here</p>
      </blockquote>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).toContain("Quoted text here");
  });

  it("should trim whitespace properly", () => {
    testContainer.innerHTML = `
      <p>   Text with spaces   </p>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).toBe("Text with spaces");
  });

  it("should handle br tags as line breaks", () => {
    testContainer.innerHTML = `
      <p>Line 1<br>Line 2</p>
    `;

    const plainText = extractPlainText(testContainer);
    expect(plainText).toContain("Line 1");
    expect(plainText).toContain("Line 2");
  });
});

describe("sanitizeHtmlForClipboard", () => {
  let testContainer: HTMLElement;

  beforeEach(() => {
    testContainer = document.createElement("div");
  });

  it("removes executable elements", () => {
    testContainer.innerHTML = `
      <p>Safe</p>
      <script>alert(1)</script>
      <iframe src="https://example.com"></iframe>
      <object data="payload"></object>
    `;

    const html = sanitizeHtmlForClipboard(testContainer);

    expect(html).toContain("Safe");
    expect(html).not.toContain("script");
    expect(html).not.toContain("iframe");
    expect(html).not.toContain("object");
  });

  it("removes event handlers and session tokens", () => {
    testContainer.innerHTML = '<button onclick="alert(1)" data-token="secret" data-session-id="abc">Copy</button>';
    testContainer.setAttribute("data-preview-token", "root-secret");

    const html = sanitizeHtmlForClipboard(testContainer);

    expect(html).toContain("Copy");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("data-token");
    expect(html).not.toContain("data-session-id");
    expect(testContainer.hasAttribute("data-preview-token")).toBe(true);
    expect(html).not.toContain("root-secret");
  });

  it("removes javascript links while preserving safe links", () => {
    testContainer.innerHTML = `
      <a href="javascript:alert(1)">Bad</a>
      <a href="https://example.com">Good</a>
    `;

    const html = sanitizeHtmlForClipboard(testContainer);

    expect(html).toContain("Bad");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="https://example.com"');
  });

  it("removes local and data-bearing URL attributes", () => {
    testContainer.innerHTML = `
      <img src="file:///Users/example/secret.png" srcset="file:///Users/example/secret.png 1x" alt="Secret">
      <video poster="data:image/png;base64,abc"></video>
      <a href="F:\\private\\note.md">Local</a>
      <span style="background-image: url(file:///secret)">Styled</span>
    `;

    const html = sanitizeHtmlForClipboard(testContainer);

    expect(html).not.toContain("file:");
    expect(html).not.toContain("data:image");
    expect(html).not.toContain("F:\\private");
    expect(html).not.toContain("style=");
    expect(html).toContain("Secret");
    expect(html).toContain("Local");
  });

  it("removes diagnostic banners from copied fragments", () => {
    testContainer.innerHTML = `
      <div class="preview-diagnostics-banner">Code chunk execution is disabled</div>
      <p>Actual content</p>
    `;

    const html = sanitizeHtmlForClipboard(testContainer);

    expect(html).not.toContain("Code chunk execution is disabled");
    expect(html).toContain("Actual content");
  });

  it("removes preview navigation and draft controls from copied fragments", () => {
    testContainer.innerHTML = `
      <aside class="preview-toc">Contents</aside>
      <section class="draft-editor-panel">Draft editor</section>
      <h2>Heading <button class="heading-anchor-button">#</button></h2>
      <p>Actual content</p>
    `;

    const html = sanitizeHtmlForClipboard(testContainer);

    expect(html).not.toContain("Contents");
    expect(html).not.toContain("Draft editor");
    expect(html).not.toContain("heading-anchor-button");
    expect(html).toContain("Actual content");
  });

  it("removes URL schemes hidden with whitespace controls", () => {
    testContainer.innerHTML = '<a href="java\nscript:alert(1)">Hidden</a>';

    const html = sanitizeHtmlForClipboard(testContainer);

    expect(html).toContain("Hidden");
    expect(html).not.toContain("java");
  });
});
