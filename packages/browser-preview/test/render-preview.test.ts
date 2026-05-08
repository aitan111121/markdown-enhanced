import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
});

describe("initializeToolbar", () => {
  it("does not add a reload refresh button for one-time preview URLs", () => {
    const toolbar = document.createElement("nav");
    const previewRoot = document.createElement("main");

    initializeToolbar(toolbar, previewRoot);

    const buttons = Array.from(toolbar.querySelectorAll("button"), (button) => button.textContent);
    expect(buttons).toEqual(["Copy Selection", "Copy Document"]);
  });
});