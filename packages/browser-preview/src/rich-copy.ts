import { extractPlainText } from "./plain-text-copy.js";
import { sanitizeElementForClipboard, sanitizeHtmlFragmentForClipboard } from "./safe-html.js";

export interface CopyResult {
  success: boolean;
  method: "rich" | "plain" | "failed";
  error?: string;
}

export type ClipboardPayload = {
  html: string;
  plainText: string;
};

export async function copySelection(): Promise<CopyResult> {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return {
      success: false,
      method: "failed",
      error: "No selection",
    };
  }

  const payload = createSelectionClipboardPayload();
  if (!payload) {
    return {
      success: false,
      method: "failed",
      error: "No rendered selection",
    };
  }

  return await copyPayload(payload);
}

export async function copyFullDocument(
  rootElement: HTMLElement
): Promise<CopyResult> {
  return await copyPayload(createElementClipboardPayload(rootElement));
}

export function createSelectionClipboardPayload(previewRoot?: HTMLElement): ClipboardPayload | undefined {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return undefined;
  }

  if (previewRoot && !selectionContainedInElement(selection, previewRoot)) {
    return undefined;
  }

  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();
  const container = document.createElement("div");
  container.appendChild(fragment);

  const payload = createElementClipboardPayload(container);
  return payload.plainText || payload.html ? payload : undefined;
}

export function createElementClipboardPayload(element: HTMLElement): ClipboardPayload {
  const clone = sanitizeElementForClipboard(element);
  return {
    html: clone.innerHTML,
    plainText: extractPlainText(clone)
  };
}

export function writeClipboardPayload(clipboardData: DataTransfer, payload: ClipboardPayload): void {
  clipboardData.setData("text/html", payload.html);
  clipboardData.setData("text/plain", payload.plainText);
}

async function copyPayload(payload: ClipboardPayload): Promise<CopyResult> {
  const { html, plainText } = payload;

  if (!navigator.clipboard) {
    return fallbackCopy(plainText);
  }

  try {
    const htmlBlob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([plainText], { type: "text/plain" });

    const clipboardItem = new ClipboardItem({
      "text/html": htmlBlob,
      "text/plain": textBlob,
    });

    await navigator.clipboard.write([clipboardItem]);

    return {
      success: true,
      method: "rich",
    };
  } catch (error) {
    return fallbackCopy(plainText);
  }
}

async function fallbackCopy(plainText: string): Promise<CopyResult> {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    return {
      success: false,
      method: "failed",
      error: "Clipboard API not available",
    };
  }

  try {
    await navigator.clipboard.writeText(plainText);
    return {
      success: true,
      method: "plain",
    };
  } catch (error) {
    return {
      success: false,
      method: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function sanitizeHtmlForClipboard(element: HTMLElement): string {
  return sanitizeHtmlFragmentForClipboard(element);
}

function selectionContainedInElement(selection: Selection, element: HTMLElement): boolean {
  return Boolean(
    selection.anchorNode &&
    selection.focusNode &&
    element.contains(selection.anchorNode) &&
    element.contains(selection.focusNode)
  );
}
