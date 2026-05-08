export function sanitizeHtmlFragmentForClipboard(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;

  removeNonContentNodes(clone);
  removeDangerousElements(clone);
  removeDangerousAttributes(clone);

  return clone.innerHTML;
}

export function removeNonContentNodes(root: HTMLElement): void {
  const selectors = [
    ".preview-toolbar",
    ".preview-toc",
    ".draft-editor-panel",
    ".preview-error-banner",
    ".preview-diagnostics-banner",
    ".heading-anchor-button",
    "script",
    "style",
    "noscript"
  ];

  for (const selector of selectors) {
    root.querySelectorAll(selector).forEach((node) => node.remove());
  }
}

function removeDangerousElements(root: HTMLElement): void {
  for (const tag of ["script", "iframe", "object", "embed", "link", "base", "meta"]) {
    root.querySelectorAll(tag).forEach((node) => node.remove());
  }
}

function removeDangerousAttributes(root: HTMLElement): void {
  const dangerousAttrs = ["data-session-id", "data-token", "data-preview-token", "srcdoc", "style"];
  const urlAttributes = ["href", "src", "poster", "formaction", "xlink:href"];

  for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
    for (const attr of dangerousAttrs) {
      element.removeAttribute(attr);
    }

    for (const attr of Array.from(element.attributes)) {
      if (attr.name.toLowerCase().startsWith("on")) {
        element.removeAttribute(attr.name);
      }
    }

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
}

function isUnsafeUrl(value: string): boolean {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase().replace(/[\u0000-\u0020]+/g, "");

  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:") ||
    normalized.startsWith("file:") ||
    /^[a-z]:[\\/]/i.test(trimmed) ||
    normalized.startsWith("//")
  );
}