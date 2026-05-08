import { copySelection, copyFullDocument, type CopyResult } from "./rich-copy.js";

export function initializeToolbar(
  toolbarElement: HTMLElement,
  previewRoot: HTMLElement
): void {
  const actionsContainer = document.createElement("div");
  actionsContainer.className = "toolbar-actions";

  const copySelectionBtn = createButton("Copy Selection", async () => {
    const result = await copySelection();
    showCopyFeedback(actionsContainer, result);
  });

  const copyDocumentBtn = createButton("Copy Document", async () => {
    const result = await copyFullDocument(previewRoot);
    showCopyFeedback(actionsContainer, result);
  });

  actionsContainer.appendChild(copySelectionBtn);
  actionsContainer.appendChild(copyDocumentBtn);

  toolbarElement.appendChild(actionsContainer);

  setupKeyboardShortcuts(previewRoot);
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

function setupKeyboardShortcuts(previewRoot: HTMLElement): void {
  document.addEventListener("keydown", async (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "c") {
      event.preventDefault();
      const result = await copyFullDocument(previewRoot);
      const toolbar = document.querySelector(".toolbar-actions");
      if (toolbar instanceof HTMLElement) {
        showCopyFeedback(toolbar, result);
      }
    }
  });
}
