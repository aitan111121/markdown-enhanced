import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyCustomStyle } from "../src/custom-style.js";
import { initializeDraftEditor } from "../src/draft-editor.js";
import { exportHtml } from "../src/html-export.js";
import { initializeToolbar } from "../src/preview-toolbar.js";
import { renderPreview } from "../src/render-preview.js";
import { initializeTocSidebar, renderToc } from "../src/preview-toc.js";

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

    expect(container.querySelector("h1")?.textContent).toBe("After#");
    expect(container.querySelector("h1")?.id).toBe("after");
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

  it("adds heading anchors and link diagnostics without token URLs", async () => {
    const container = document.createElement("main");
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const copied = vi.fn();

    renderPreview(container, "<h2>Intro</h2><p>Content</p>", {
      preserveScroll: false,
      toc: [{ level: 2, text: "Intro", slug: "intro" }],
      linkDiagnostics: [{
        status: "missing",
        severity: "warning",
        kind: "link",
        target: "missing.md",
        line: 3,
        message: "Local target was not found in the workspace"
      }],
      onHeadingLinkCopied: copied
    });

    container.querySelector<HTMLButtonElement>(".heading-anchor-button")?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(container.querySelector("h2")?.id).toBe("intro");
    expect(container.querySelector(".preview-diagnostics-banner")?.textContent).toContain("missing.md");
    expect(writeText).toHaveBeenCalledWith("#intro");
    expect(copied).toHaveBeenCalledWith(true);
    expect(container.innerHTML).not.toContain("token=");
  });
});

describe("preview TOC", () => {
  it("renders heading navigation and stores placement locally", () => {
    const previewRoot = document.createElement("main");
    previewRoot.innerHTML = '<h1 id="title">Title</h1>';
    const toc = document.createElement("aside");

    initializeTocSidebar(toc, previewRoot);
    renderToc(toc, [{ level: 1, text: "Title", slug: "title" }], previewRoot);
    toc.querySelector<HTMLButtonElement>('[data-toc-position="right"]')?.click();

    expect(toc.textContent).toContain("Title");
    expect(document.body.dataset.tocPosition).toBe("right");
  });
});

describe("initializeToolbar", () => {
  it("does not add a reload refresh button for one-time preview URLs", () => {
    const toolbar = document.createElement("nav");
    const previewRoot = document.createElement("main");
    document.body.appendChild(previewRoot);

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

describe("initializeDraftEditor", () => {
  it("starts from the latest payload and sends draft render requests", async () => {
    document.body.innerHTML = "";
    const toolbar = document.createElement("nav");
    const actions = document.createElement("div");
    actions.className = "toolbar-actions";
    toolbar.appendChild(actions);
    const previewRoot = document.createElement("main");
    document.body.appendChild(toolbar);
    document.body.appendChild(previewRoot);
    const onDraftRender = vi.fn();
    const onStatus = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      html: "<h1>Draft</h1>",
      diagnostics: [],
      sourceVersion: { hash: "a".repeat(64), mtimeMs: 1, sizeBytes: 7 }
    }), { status: 200, headers: { "content-type": "application/json" } })));

    initializeDraftEditor({
      sessionId: "session",
      token: "token",
      toolbarElement: toolbar,
      previewRoot,
      getLatestPayload: () => ({
        html: "<h1>Source</h1>",
        diagnostics: [],
        sourceText: "# Source",
        sourceVersion: { hash: "b".repeat(64), mtimeMs: 1, sizeBytes: 8 }
      }),
      onDraftRender,
      onStatus
    });

    const editButton = actions.querySelector<HTMLButtonElement>("button");
    expect(editButton?.textContent).toBe("Edit Draft");
    editButton?.click();
    const renderButton = document.body.querySelector<HTMLButtonElement>("[data-draft-render]");
    expect(renderButton).toBeTruthy();
    renderButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetch).toHaveBeenCalledWith("/api/source/render-draft", expect.objectContaining({ method: "POST" }));
    expect(onDraftRender).toHaveBeenCalledWith(expect.objectContaining({ html: "<h1>Draft</h1>" }));
  });

  it("allows draft mode for an empty saved Markdown file", () => {
    document.body.innerHTML = "";
    const toolbar = document.createElement("nav");
    const actions = document.createElement("div");
    actions.className = "toolbar-actions";
    toolbar.appendChild(actions);
    const previewRoot = document.createElement("main");
    document.body.appendChild(previewRoot);

    initializeDraftEditor({
      sessionId: "session",
      token: "token",
      toolbarElement: toolbar,
      previewRoot,
      getLatestPayload: () => ({
        html: "",
        diagnostics: [],
        sourceText: "",
        sourceVersion: { hash: "b".repeat(64), mtimeMs: 1, sizeBytes: 0 }
      }),
      onDraftRender: vi.fn(),
      onStatus: vi.fn()
    });

    actions.querySelector<HTMLButtonElement>("button")?.click();

    expect(document.querySelector<HTMLTextAreaElement>(".draft-editor-textarea")?.value).toBe("");
  });
});