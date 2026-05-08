import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyCustomStyle } from "../src/custom-style.js";
import { exportHtml } from "../src/html-export.js";
import { initializeToolbar } from "../src/preview-toolbar.js";
import { renderPreview } from "../src/render-preview.js";

describe("renderPreview", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    Object.defineProperty(window, "scrollX", { value: 12, configurable: true });
    Object.defineProperty(window, "scrollY", { value: 420, configurable: true });
    vi.spyOn(window, "scrollTo").mockImplementation((x, y) => {
      Object.defineProperty(window, "scrollX", { value: Number(x), configurable: true });
      Object.defineProperty(window, "scrollY", { value: Number(y), configurable: true });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("preserves the window scroll position across HTML replacement", () => {
    const container = document.createElement("main");
    container.innerHTML = "<p>Before</p>";

    renderPreview(container, "<h1>After</h1>");

    expect(container.innerHTML).toBe("<h1>After</h1>");
    expect(window.scrollTo).toHaveBeenCalledWith(12, 420);
  });

  it("can replace HTML without restoring scroll", () => {
    const container = document.createElement("main");

    renderPreview(container, "<p>No scroll restore</p>", { preserveScroll: false });

    expect(container.innerHTML).toBe("<p>No scroll restore</p>");
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("shows render diagnostics without replacing preview content", () => {
    const container = document.createElement("main");

    renderPreview(container, "<p>Content</p>", {
      preserveScroll: false,
      diagnostics: ["Code chunk execution is disabled by default"]
    });

    expect(container.querySelector(".preview-diagnostics-banner")?.textContent)
      .toContain("Code chunk execution is disabled by default");
    expect(container.innerHTML).toContain("Content");
  });
});

describe("initializeToolbar", () => {
  it("does not add a reload refresh button for one-time preview URLs", () => {
    const toolbar = document.createElement("nav");
    const previewRoot = document.createElement("main");

    initializeToolbar(toolbar, previewRoot);

    const buttons = Array.from(toolbar.querySelectorAll("button"), (button) => button.textContent);
    expect(buttons).toEqual(["Copy Selection", "Copy Document"]);
  });

  it("adds an export button when export is configured", () => {
    const toolbar = document.createElement("nav");
    const previewRoot = document.createElement("main");

    initializeToolbar(toolbar, previewRoot, { exportHtml: async () => ({ success: true }) });

    const buttons = Array.from(toolbar.querySelectorAll("button"), (button) => button.textContent);
    expect(buttons).toEqual(["Copy Selection", "Copy Document", "Export HTML"]);
  });
});

describe("applyCustomStyle", () => {
  it("applies CSS with the preview style nonce", () => {
    document.body.dataset.styleNonce = "nonce-value";

    applyCustomStyle(".markdown-preview h1 { color: red; }");

    const style = document.querySelector<HTMLStyleElement>("#zed-mpe-custom-style");
    expect(style?.getAttribute("nonce")).toBe("nonce-value");
    expect(style?.textContent).toContain("color: red");
  });

  it("removes custom CSS when the payload has no style", () => {
    applyCustomStyle(".markdown-preview h1 { color: red; }");
    applyCustomStyle(undefined);

    expect(document.querySelector("#zed-mpe-custom-style")).toBeNull();
  });
});

describe("exportHtml", () => {
  it("downloads HTML returned by the server", async () => {
    const click = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = document.createElementNS("http://www.w3.org/1999/xhtml", tagName) as HTMLElement;
      if (tagName === "a") {
        Object.defineProperty(element, "click", { value: click });
      }
      return element as any;
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html></html>", {
      status: 200,
      headers: { "content-disposition": 'attachment; filename="note.html"' }
    })));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn()
    });

    const result = await exportHtml({ sessionId: "session", token: "token" });

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith("/api/export/html", expect.objectContaining({ method: "POST" }));
    expect(click).toHaveBeenCalled();
  });

  it("reports export failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("denied", { status: 401 })));

    const result = await exportHtml({ sessionId: "session", token: "bad" });

    expect(result).toEqual({ success: false, error: "HTTP 401" });
  });
});