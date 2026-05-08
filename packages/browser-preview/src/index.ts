export {};

type ServerMessage =
  | { type: "preview:status"; message: string }
  | { type: "preview:update"; payload: { html: string; sourcePath: string; diagnostics: string[] } }
  | { type: "preview:error"; message: string };

const root = document.querySelector<HTMLElement>("#preview-root");
const statusNode = document.querySelector<HTMLElement>("#preview-status");
const sessionId = document.body.dataset.sessionId;
const token = document.body.dataset.token;

if (!root || !statusNode || !sessionId || !token) {
  throw new Error("Preview shell is missing required state");
}

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
  socket.addEventListener("close", () => setStatus(statusNode, "Disconnected"));
  socket.addEventListener("error", () => setStatus(statusNode, "Connection error"));
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
      previewRoot.innerHTML = message.payload.html;
      setStatus(statusNode, `Rendered ${new Date().toLocaleTimeString()}`);
      return;
    }

    setStatus(statusNode, message.message);
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