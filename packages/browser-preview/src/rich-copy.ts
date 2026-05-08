import { extractPlainText } from "./plain-text-copy.js";
import { sanitizeHtmlFragmentForClipboard } from "./safe-html.js";

export interface CopyResult {
  success: boolean;
  method: "rich" | "plain" | "failed";
  error?: string;
}

export async function copySelection(): Promise<CopyResult> {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return {
      success: false,
      method: "failed",
      error: "No selection",
    };
  }

  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();
  const container = document.createElement("div");
  container.appendChild(fragment);

  return await copyElement(container);
}

export async function copyFullDocument(
  rootElement: HTMLElement
): Promise<CopyResult> {
  const clone = rootElement.cloneNode(true) as HTMLElement;
  return await copyElement(clone);
}

async function copyElement(element: HTMLElement): Promise<CopyResult> {
  const sanitized = sanitizeHtmlForClipboard(element);
  const plainText = extractPlainText(element);

  if (!navigator.clipboard) {
    return fallbackCopy(plainText);
  }

  try {
    const htmlBlob = new Blob([sanitized], { type: "text/html" });
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
