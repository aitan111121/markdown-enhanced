import {
  captureScrollState,
  restoreScrollState,
  type ScrollState,
} from "./scroll-state.js";
import { copyHeadingFragment, type TocEntry } from "./preview-toc.js";

export type LinkDiagnostic = {
  status: string;
  severity: "info" | "warning" | "error";
  kind: "link" | "image" | "reference";
  target: string;
  line: number;
  message: string;
};

export interface RenderOptions {
  preserveScroll: boolean;
  diagnostics?: string[];
  linkDiagnostics?: LinkDiagnostic[];
  toc?: TocEntry[];
  onHeadingLinkCopied?: (success: boolean) => void;
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
  ensureHeadingIds(container, options.toc ?? []);
  installHeadingAnchors(container, options.onHeadingLinkCopied);
  renderDiagnostics(container, options.diagnostics ?? [], options.linkDiagnostics ?? []);
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

function renderDiagnostics(
  container: HTMLElement,
  diagnostics: string[],
  linkDiagnostics: LinkDiagnostic[]
): void {
  const actionableLinks = linkDiagnostics.filter((diagnostic) => diagnostic.severity !== "info");
  if (diagnostics.length === 0 && actionableLinks.length === 0) {
    return;
  }

  const banner = document.createElement("div");
  banner.className = "preview-diagnostics-banner";
  banner.setAttribute("role", "status");

  if (diagnostics.length > 0) {
    const paragraph = document.createElement("p");
    paragraph.textContent = diagnostics.join(" ");
    banner.appendChild(paragraph);
  }

  if (actionableLinks.length > 0) {
    const list = document.createElement("ul");
    for (const diagnostic of actionableLinks.slice(0, 10)) {
      const item = document.createElement("li");
      item.textContent = `Line ${diagnostic.line}: ${diagnostic.target} - ${diagnostic.message}`;
      list.appendChild(item);
    }
    banner.appendChild(list);
  }

  container.prepend(banner);
}

function ensureHeadingIds(container: HTMLElement, toc: TocEntry[]): void {
  const byText = new Map(toc.map((entry) => [`${entry.level}:${entry.text}`, entry.slug]));
  const used = new Set<string>();

  for (const heading of Array.from(container.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"))) {
    const level = Number(heading.tagName.slice(1));
    const text = heading.textContent?.trim() ?? "heading";
    const candidate = heading.id || byText.get(`${level}:${text}`) || slugify(text);
    heading.id = uniqueSlug(candidate, used);
  }
}

function installHeadingAnchors(
  container: HTMLElement,
  onHeadingLinkCopied?: (success: boolean) => void
): void {
  for (const heading of Array.from(container.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"))) {
    const slug = heading.id;
    if (!slug) {
      continue;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "heading-anchor-button";
    button.textContent = "#";
    button.title = "Copy heading fragment";
    button.addEventListener("click", async () => {
      onHeadingLinkCopied?.(await copyHeadingFragment(slug));
    });
    heading.appendChild(button);
  }
}

function uniqueSlug(slug: string, used: Set<string>): string {
  const base = slug || "heading";
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  used.add(candidate);
  return candidate;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
