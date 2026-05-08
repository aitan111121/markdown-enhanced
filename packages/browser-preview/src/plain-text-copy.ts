export function extractPlainText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;

  removeUnwantedNodes(clone);

  const lines: string[] = [];
  extractTextRecursive(clone, lines);

  return lines.join("\n").trim();
}

function removeUnwantedNodes(root: HTMLElement): void {
  const selectors = [
    "script",
    "style",
    "noscript",
    ".preview-error-banner",
    ".preview-diagnostics-banner",
    ".preview-toolbar",
  ];

  for (const selector of selectors) {
    const nodes = root.querySelectorAll(selector);
    nodes.forEach((node) => node.remove());
  }
}

function extractTextRecursive(node: Node, lines: string[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (text) {
      lines.push(text);
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  if (tagName === "br") {
    lines.push("");
    return;
  }

  if (["p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
    for (const child of Array.from(node.childNodes)) {
      extractTextRecursive(child, lines);
    }
    lines.push("");
    return;
  }

  if (tagName === "pre" || tagName === "code") {
    const text = element.textContent?.trim();
    if (text) {
      lines.push(text);
      lines.push("");
    }
    return;
  }

  for (const child of Array.from(node.childNodes)) {
    extractTextRecursive(child, lines);
  }
}
