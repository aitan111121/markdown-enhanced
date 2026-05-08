import {
  captureScrollState,
  restoreScrollState,
  type ScrollState,
} from "./scroll-state.js";

export interface RenderOptions {
  preserveScroll: boolean;
}

let lastGoodHtml = "";

export function renderPreview(
  container: HTMLElement,
  html: string,
  options: RenderOptions = { preserveScroll: true }
): void {
  let scrollState: ScrollState | undefined;

  if (options.preserveScroll) {
    scrollState = captureScrollState(container);
  }

  container.innerHTML = html;
  lastGoodHtml = html;

  if (scrollState) {
    requestAnimationFrame(() => {
      restoreScrollState(container, scrollState);
    });
  }
}

export function renderError(
  container: HTMLElement,
  statusNode: HTMLElement,
  errorMessage: string
): void {
  statusNode.textContent = `Error: ${errorMessage}`;

  if (lastGoodHtml) {
    const errorBanner = document.createElement("div");
    errorBanner.className = "preview-error-banner";
    errorBanner.textContent = `Render error: ${errorMessage}`;
    errorBanner.setAttribute("role", "alert");

    const existingBanner = container.querySelector(".preview-error-banner");
    if (existingBanner) {
      existingBanner.replaceWith(errorBanner);
    } else {
      container.prepend(errorBanner);
    }
  } else {
    container.innerHTML = `<div class="preview-error-empty" role="alert">
      <p><strong>Render Error</strong></p>
      <p>${escapeHtml(errorMessage)}</p>
    </div>`;
  }
}

export function clearErrors(container: HTMLElement): void {
  const banner = container.querySelector(".preview-error-banner");
  if (banner) {
    banner.remove();
  }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
