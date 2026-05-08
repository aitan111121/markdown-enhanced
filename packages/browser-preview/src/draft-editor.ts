import type { LinkDiagnostic } from "./render-preview.js";
import type { TocEntry } from "./preview-toc.js";

export type SourceVersion = {
  hash: string;
  mtimeMs: number;
  sizeBytes: number;
};

export type DraftPayload = {
  html: string;
  sourceText?: string;
  sourceVersion?: SourceVersion;
  diagnostics: string[];
  linkDiagnostics?: LinkDiagnostic[];
  customStyle?: { css: string; sourcePath: string };
  metadata?: { toc?: TocEntry[] };
};

export type DraftEditorOptions = {
  sessionId: string;
  token: string;
  toolbarElement: HTMLElement;
  previewRoot: HTMLElement;
  getLatestPayload: () => DraftPayload | undefined;
  onDraftRender: (payload: DraftPayload) => void;
  onStatus: (message: string) => void;
};

type DraftState = {
  panel: HTMLElement;
  textarea: HTMLTextAreaElement;
  baseVersion: SourceVersion;
};

export function initializeDraftEditor(options: DraftEditorOptions): void {
  const button = document.createElement("button");
  button.className = "toolbar-button";
  button.type = "button";
  button.textContent = "Edit Draft";
  button.addEventListener("click", () => startDraft(options));
  options.toolbarElement.querySelector(".toolbar-actions")?.appendChild(button);
}

async function startDraft(options: DraftEditorOptions): Promise<void> {
  const latest = options.getLatestPayload();
  if (typeof latest?.sourceText !== "string" || !latest.sourceVersion) {
    options.onStatus("Draft editing waits for a saved render");
    return;
  }

  const existing = document.querySelector(".draft-editor-panel");
  if (existing) {
    existing.remove();
  }

  const state = createDraftPanel(latest.sourceText, latest.sourceVersion);
  options.previewRoot.before(state.panel);
  options.onStatus("Draft editing");

  state.panel.querySelector<HTMLButtonElement>("[data-draft-render]")?.addEventListener("click", async () => {
    await renderDraft(options, state).catch((error: unknown) => {
      options.onStatus(`Draft render failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  });
  state.panel.querySelector<HTMLButtonElement>("[data-draft-apply]")?.addEventListener("click", async () => {
    await applyDraft(options, state).catch((error: unknown) => {
      options.onStatus(`Draft apply failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  });
  state.panel.querySelector<HTMLButtonElement>("[data-draft-discard]")?.addEventListener("click", () => {
    state.panel.remove();
    options.onStatus("Draft discarded");
  });
  updateDraftSummary(state);
  state.textarea.addEventListener("input", () => updateDraftSummary(state));
}

function createDraftPanel(sourceText: string, baseVersion: SourceVersion): DraftState {
  const panel = document.createElement("section");
  panel.className = "draft-editor-panel";
  panel.innerHTML = `
    <div class="draft-editor-header">
      <strong>Draft</strong>
      <div class="draft-editor-actions">
        <button type="button" class="toolbar-button" data-draft-render>Preview Draft</button>
        <button type="button" class="toolbar-button" data-draft-apply>Apply Draft</button>
        <button type="button" class="toolbar-button" data-draft-discard>Discard</button>
      </div>
    </div>
    <textarea class="draft-editor-textarea" spellcheck="false"></textarea>
    <p class="draft-editor-summary" role="status"></p>
  `;
  const textarea = panel.querySelector<HTMLTextAreaElement>("textarea")!;
  textarea.value = sourceText;
  return { panel, textarea, baseVersion };
}

async function renderDraft(options: DraftEditorOptions, state: DraftState): Promise<void> {
  options.onStatus("Rendering draft");
  const result = await postJson<DraftPayload>("/api/source/render-draft", {
    sessionId: options.sessionId,
    token: options.token,
    markdown: state.textarea.value
  });
  options.onDraftRender(result);
  options.onStatus("Draft rendered");
}

async function applyDraft(options: DraftEditorOptions, state: DraftState): Promise<void> {
  options.onStatus("Applying draft");
  const result = await postJson<{ applied: true; backupFileName: string; sourceVersion: SourceVersion }>(
    "/api/source/apply-draft",
    {
      sessionId: options.sessionId,
      token: options.token,
      markdown: state.textarea.value,
      baseVersion: state.baseVersion
    }
  );
  state.baseVersion = result.sourceVersion;
  state.panel.remove();
  options.onStatus(`Draft applied; backup ${result.backupFileName}`);
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(error.message ?? error.error ?? `HTTP ${response.status}`);
  }

  return await response.json() as T;
}

function updateDraftSummary(state: DraftState): void {
  const summary = state.panel.querySelector<HTMLElement>(".draft-editor-summary");
  if (!summary) {
    return;
  }

  const lines = state.textarea.value.split(/\r?\n/).length;
  const bytes = new Blob([state.textarea.value]).size;
  summary.textContent = `${lines} lines, ${bytes} bytes. Preview before applying to disk.`;
}