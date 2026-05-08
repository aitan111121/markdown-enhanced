export type TocEntry = {
  level: number;
  text: string;
  slug: string;
};

const POSITION_KEY = "zed-mpe-toc-position";
const COLLAPSED_KEY = "zed-mpe-toc-collapsed";

export function initializeTocSidebar(container: HTMLElement, previewRoot: HTMLElement): void {
  container.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.matches("[data-toc-position]")) {
      setTocPosition(target.dataset.tocPosition === "right" ? "right" : "left");
      return;
    }

    if (target.matches("[data-toc-collapse]")) {
      setTocCollapsed(document.body.dataset.tocCollapsed !== "true");
      return;
    }

    const slug = target.dataset.tocTarget;
    if (slug) {
      previewRoot.querySelector<HTMLElement>(`#${CSS.escape(slug)}`)?.scrollIntoView({ block: "start" });
    }
  });

  setTocPosition(loadTocPosition());
  setTocCollapsed(localStorage.getItem(COLLAPSED_KEY) === "true");
}

export function renderToc(container: HTMLElement, entries: TocEntry[], previewRoot: HTMLElement): void {
  const normalized = normalizeToc(entries, previewRoot);

  container.innerHTML = "";
  const header = document.createElement("div");
  header.className = "preview-toc-header";

  const title = document.createElement("strong");
  title.textContent = "Contents";
  header.appendChild(title);

  const controls = document.createElement("div");
  controls.className = "preview-toc-controls";
  controls.appendChild(createTocButton("Left", "Place contents on the left", "left"));
  controls.appendChild(createTocButton("Right", "Place contents on the right", "right"));
  controls.appendChild(createCollapseButton());
  header.appendChild(controls);
  container.appendChild(header);

  if (normalized.length === 0) {
    const empty = document.createElement("p");
    empty.className = "preview-toc-empty";
    empty.textContent = "No headings";
    container.appendChild(empty);
    return;
  }

  const list = document.createElement("ol");
  list.className = "preview-toc-list";

  for (const entry of normalized) {
    const item = document.createElement("li");
    item.style.setProperty("--toc-level", String(Math.max(0, entry.level - 1)));
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.tocTarget = entry.slug;
    button.textContent = entry.text;
    item.appendChild(button);
    list.appendChild(item);
  }

  container.appendChild(list);
}

export async function copyHeadingFragment(slug: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(`#${slug}`);
    return true;
  } catch {
    return false;
  }
}

function normalizeToc(entries: TocEntry[], previewRoot: HTMLElement): TocEntry[] {
  if (entries.length > 0) {
    return entries.filter((entry) => entry.slug && entry.text).slice(0, 100);
  }

  return Array.from(previewRoot.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"), (heading) => ({
    level: Number(heading.tagName.slice(1)),
    text: heading.textContent?.trim() ?? "Untitled",
    slug: heading.id
  })).filter((entry) => entry.slug);
}

function createTocButton(label: string, title: string, position: "left" | "right"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.tocPosition = position;
  button.title = title;
  button.textContent = label;
  return button;
}

function createCollapseButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.tocCollapse = "toggle";
  button.title = "Collapse contents";
  button.textContent = "Toggle";
  return button;
}

function loadTocPosition(): "left" | "right" {
  return localStorage.getItem(POSITION_KEY) === "right" ? "right" : "left";
}

function setTocPosition(position: "left" | "right"): void {
  localStorage.setItem(POSITION_KEY, position);
  document.body.dataset.tocPosition = position;
}

function setTocCollapsed(collapsed: boolean): void {
  localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  document.body.dataset.tocCollapsed = String(collapsed);
}