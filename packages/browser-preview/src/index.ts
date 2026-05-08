import { applyCustomStyle } from "./custom-style.js";
import { exportHtml } from "./html-export.js";
import { renderPreview, renderError, clearErrors } from "./render-preview.js";
import { initializeToolbar } from "./preview-toolbar.js";

type ServerMessage =
  | { type: "preview:status"; message: string }
  | {
      type: "preview:update";
      payload: {
        html: string;
        sourcePath: string;
        diagnostics: string[];
        customStyle?: { css: string; sourcePath: string };
      };
    }
  | { type: "preview:error"; message: string };

const root = document.querySelector<HTMLElement>("#preview-root");
const statusNode = document.querySelector<HTMLElement>("#preview-status");
const toolbar = document.querySelector<HTMLElement>(".preview-toolbar");
const sessionId = document.body.dataset.sessionId;
const token = document.body.dataset.token;

if (!root || !statusNode || !toolbar || !sessionId || !token) {
  throw new Error("Preview shell is missing required state");
}

initializeToolbar(toolbar, root, { exportHtml: () => exportHtml({ sessionId, token }) });
connect({ sessionId, token }, root, statusNode);

function connect(
  sessionState: { sessionId: string; token: string },
  previewRoot: HTMLElement,
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
    showReconnectOption(statusNode, () => connect(sessionState, previewRoot, statusNode));
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
      clearErrors(previewRoot);
      applyCustomStyle(message.payload.customStyle?.css);
      renderPreview(previewRoot, message.payload.html, {
        preserveScroll: true,
      });
      setStatus(statusNode, `Rendered ${new Date().toLocaleTimeString()}`);
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