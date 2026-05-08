import { extractPlainText } from "./plain-text-copy.js";

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
  removeToolbarAndErrors(clone);
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
  const clone = element.cloneNode(true) as HTMLElement;

  removeToolbarAndErrors(clone);
  removeDangerousElements(clone);
  removeDangerousAttributes(clone);
  sanitizeLinks(clone);

  return clone.innerHTML;
}

function removeToolbarAndErrors(root: HTMLElement): void {
  const selectors = [".preview-toolbar", ".preview-error-banner", "script", "style"];

  for (const selector of selectors) {
    const nodes = root.querySelectorAll(selector);
    nodes.forEach((node) => node.remove());
  }
}

function removeDangerousElements(root: HTMLElement): void {
  const dangerousTags = [
    "script",
    "iframe",
    "object",
    "embed",
    "link",
    "base",
    "meta",
  ];

  for (const tag of dangerousTags) {
    const elements = root.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  }
}

function removeDangerousAttributes(root: HTMLElement): void {
  const dangerousAttrs = [
    "data-session-id",
    "data-token",
    "data-preview-token",
    "srcdoc",
    "style",
    "onclick",
    "onload",
    "onerror",
    "onmouseover",
    "onmouseout",
    "onfocus",
    "onblur",
  ];

  const allElements = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const element of allElements) {
    for (const attr of dangerousAttrs) {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    }

    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith("on")) {
        element.removeAttribute(attr.name);
      }
    }

    removeUnsafeUrlAttributes(element);
  }
}

function sanitizeLinks(root: HTMLElement): void {
  const links = root.querySelectorAll("a[href]");
  for (const link of Array.from(links)) {
    const href = link.getAttribute("href");
    if (href && isUnsafeUrl(href)) {
      link.removeAttribute("href");
    }
  }
}

function removeUnsafeUrlAttributes(element: Element): void {
  const urlAttributes = ["href", "src", "poster", "formaction", "xlink:href"];

  for (const attr of urlAttributes) {
    const value = element.getAttribute(attr);
    if (value && isUnsafeUrl(value)) {
      element.removeAttribute(attr);
    }
  }

  const srcset = element.getAttribute("srcset");
  if (srcset && srcset.split(",").some((candidate) => isUnsafeUrl(candidate.trim().split(/\s+/)[0] ?? ""))) {
    element.removeAttribute("srcset");
  }
}

function isUnsafeUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("file:") ||
    /^[a-z]:[\\/]/i.test(value.trim()) ||
    normalized.startsWith("//")
  );
}
