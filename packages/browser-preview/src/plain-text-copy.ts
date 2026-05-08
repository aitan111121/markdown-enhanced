export function extractPlainText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;

  removeUnwantedNodes(clone);

  return normalizePlainText(extractTextRecursive(clone));
}

function removeUnwantedNodes(root: HTMLElement): void {
  const selectors = [
    "script",
    "style",
    "noscript",
    ".preview-error-banner",
    ".preview-diagnostics-banner",
    ".preview-toolbar",
    ".preview-toc",
    ".draft-editor-panel",
    ".heading-anchor-button",
    "iframe",
    "object",
    "embed",
    "link",
    "base",
    "meta",
  ];

  for (const selector of selectors) {
    const nodes = root.querySelectorAll(selector);
    nodes.forEach((node) => node.remove());
  }
}

function extractTextRecursive(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  if (tagName === "br") {
    return "\n";
  }

  if (tagName === "pre") {
    return `\n${element.textContent?.trim() ?? ""}\n`;
  }

  const content = Array.from(node.childNodes, extractTextRecursive).join("");

  if (["th", "td"].includes(tagName)) {
    return `${content.trim()}\t`;
  }

  if ([
    "address",
    "article",
    "aside",
    "blockquote",
    "div",
    "dl",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "li",
    "main",
    "nav",
    "ol",
    "p",
    "section",
    "table",
    "tbody",
    "tfoot",
    "thead",
    "tr",
    "ul",
  ].includes(tagName)) {
    return `${content.trim()}\n`;
  }

  return content;
}

function normalizePlainText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
