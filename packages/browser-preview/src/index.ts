import { applyCustomStyle } from "./custom-style.js";
import { initializeDraftEditor, type DraftPayload, type SourceVersion } from "./draft-editor.js";
import { exportHtml } from "./html-export.js";
import { renderPreview, renderError, clearErrors } from "./render-preview.js";
import { initializeToolbar } from "./preview-toolbar.js";
import { initializeTocSidebar, renderToc, type TocEntry } from "./preview-toc.js";

type PreviewPayload = DraftPayload & {
  plainText?: string;
  sourcePath: string;
  metadata?: {
    frontMatter?: Record<string, unknown>;
    toc?: TocEntry[];
  };
  sourceVersion?: SourceVersion;
};

type ServerMessage =
  | { type: "preview:status"; message: string }
  | {
      type: "preview:update";
      payload: PreviewPayload;
    }
  | { type: "preview:error"; message: string };

const root = document.querySelector<HTMLElement>("#preview-root");
const statusNode = document.querySelector<HTMLElement>("#preview-status");
const toolbar = document.querySelector<HTMLElement>(".preview-toolbar");
const toc = document.querySelector<HTMLElement>("#preview-toc");
const sessionId = document.body.dataset.sessionId;
const token = document.body.dataset.token;
let latestPayload: PreviewPayload | undefined;

if (!root || !statusNode || !toolbar || !toc || !sessionId || !token) {
  throw new Error("Preview shell is missing required state");
}

initializeToolbar(toolbar, root, { exportHtml: () => exportHtml({ sessionId, token }) });
initializeTocSidebar(toc, root);
initializeDraftEditor({
  sessionId,
  token,
  toolbarElement: toolbar,
  previewRoot: root,
  getLatestPayload: () => latestPayload,
  onDraftRender: (payload) => renderPayload(payload as PreviewPayload, root, toc, statusNode, true),
  onStatus: (message) => setStatus(statusNode, message)
});
connect({ sessionId, token }, root, toc, statusNode);

function connect(
  sessionState: { sessionId: string; token: string },
  previewRoot: HTMLElement,
  tocElement: HTMLElement,
  statusNode: HTMLElement
): void {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const socketUrl = `${protocol}//${location.host}/ws/${sessionState.sessionId}?token=${encodeURIComponent(
    sessionState.token
  )}`;
  const socket = new WebSocket(socketUrl);

  socket.addEventListener("open", () => setStatus(statusNode, "Connected"));
  socket.addEventListener("close", () => {
    setStatus(statusNode, "Disconnected");
    showReconnectOption(statusNode, () => connect(sessionState, previewRoot, tocElement, statusNode));
  });
  socket.addEventListener("error", () =>
    setStatus(statusNode, "Connection error")
  );
  socket.addEventListener("message", (event) => {
    const message = parseServerMessage(event.data);
    if (!message) {
      return;
    }

    if (message.type === "preview:status") {
      setStatus(statusNode, message.message);
      return;
    }

    if (message.type === "preview:update") {
      renderPayload(message.payload, previewRoot, tocElement, statusNode, false);
      return;
    }

    if (message.type === "preview:error") {
      renderError(previewRoot, statusNode, message.message);
      return;
    }

    setStatus(statusNode, "Unknown message");
  });
}

function parseServerMessage(value: unknown): ServerMessage | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  try {
    return JSON.parse(value) as ServerMessage;
  } catch {
    return undefined;
  }
}

function setStatus(statusNode: HTMLElement, message: string): void {
  statusNode.textContent = message;
}

function showReconnectOption(statusNode: HTMLElement, reconnect: () => void): void {
  const reconnectBtn = document.createElement("button");
  reconnectBtn.className = "reconnect-button";
  reconnectBtn.textContent = "Reconnect";
  reconnectBtn.type = "button";
  reconnectBtn.addEventListener("click", () => {
    setStatus(statusNode, "Reconnecting");
    reconnect();
  });

  statusNode.textContent = "Disconnected ";
  statusNode.appendChild(reconnectBtn);
}

function renderPayload(
  payload: PreviewPayload,
  previewRoot: HTMLElement,
  tocElement: HTMLElement,
  statusNode: HTMLElement,
  draft: boolean
): void {
  if (!draft) {
    latestPayload = payload;
  }

  clearErrors(previewRoot);
  applyCustomStyle(payload.customStyle?.css);
  renderPreview(previewRoot, payload.html, {
    preserveScroll: true,
    diagnostics: payload.diagnostics,
    linkDiagnostics: payload.linkDiagnostics,
    toc: payload.metadata?.toc,
    onHeadingLinkCopied: (success) => setStatus(statusNode, success ? "Heading fragment copied" : "Copy failed")
  });
  renderToc(tocElement, payload.metadata?.toc ?? [], previewRoot);
  setStatus(statusNode, `${draft ? "Draft rendered" : "Rendered"} ${new Date().toLocaleTimeString()}`);
}