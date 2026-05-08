import {
  createElementClipboardPayload,
  createSelectionClipboardPayload,
  writeClipboardPayload,
  type CopyResult
} from "./rich-copy.js";
import type { HtmlExportResult } from "./html-export.js";

export function initializeToolbar(
  toolbarElement: HTMLElement,
  previewRoot: HTMLElement,
  options: { exportHtml?: () => Promise<HtmlExportResult> } = {}
): void {
  const actionsContainer = document.createElement("div");
  actionsContainer.className = "toolbar-actions";

  if (options.exportHtml) {
    const exportHtmlBtn = createButton("Export HTML", async () => {
      const result = await options.exportHtml!();
      showActionFeedback(
        actionsContainer,
        result.success ? "HTML exported" : `Export failed${result.error ? `: ${result.error}` : ""}`,
        result.success
      );
    });
    actionsContainer.appendChild(exportHtmlBtn);
  }

  toolbarElement.appendChild(actionsContainer);

  setupCopyBehavior(previewRoot, actionsContainer);
  setupPreviewFocus(previewRoot);
}

function createButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "toolbar-button";
  button.textContent = label;
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function showCopyFeedback(
  container: HTMLElement,
  result: CopyResult
): void {
  const existing = container.querySelector(".copy-feedback");
  if (existing) {
    existing.remove();
  }

  const feedback = document.createElement("span");
  feedback.className = "copy-feedback";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");

  if (result.success) {
    feedback.textContent =
      result.method === "rich"
        ? "Copied with formatting"
        : "Copied as plain text";
    feedback.classList.add("copy-feedback-success");
  } else {
    feedback.textContent = `Copy failed${result.error ? `: ${result.error}` : ""}`;
    feedback.classList.add("copy-feedback-error");
  }

  container.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
  }, 3000);
}

function showActionFeedback(container: HTMLElement, message: string, success: boolean): void {
  const existing = container.querySelector(".copy-feedback");
  if (existing) {
    existing.remove();
  }

  const feedback = document.createElement("span");
  feedback.className = `copy-feedback ${success ? "copy-feedback-success" : "copy-feedback-error"}`;
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  feedback.textContent = message;
  container.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
  }, 3000);
}

function setupCopyBehavior(previewRoot: HTMLElement, feedbackContainer: HTMLElement): void {
  document.addEventListener("copy", (event) => {
    const payload = event.clipboardData
      ? createSelectionClipboardPayload(previewRoot) ?? createFocusedDocumentPayload(previewRoot)
      : undefined;
    if (!payload || !event.clipboardData) {
      return;
    }

    event.preventDefault();
    writeClipboardPayload(event.clipboardData, payload);
    showCopyFeedback(feedbackContainer, { success: true, method: "rich" });
  });
}

function setupPreviewFocus(previewRoot: HTMLElement): void {
  previewRoot.addEventListener("pointerdown", () => {
    previewRoot.focus({ preventScroll: true });
  });
}

function createFocusedDocumentPayload(previewRoot: HTMLElement) {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    return undefined;
  }

  return document.activeElement === previewRoot ? createElementClipboardPayload(previewRoot) : undefined;
}
