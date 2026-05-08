import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { WebSocketServer, type WebSocket } from "ws";
import { DEFAULT_HOST, SERVICE_NAME, type RenderPayload } from "./contracts.js";
import { FileWatchService } from "./file-watch-service.js";
import { resolveWorkspaceFile } from "./path-safety.js";
import { buildPreviewUrl } from "./preview-url.js";
import { renderSavedFile } from "./saved-file-preview.js";
import { createPreviewShell } from "./static-preview-shell.js";
import { WorkspaceSessionStore } from "./workspace-session-store.js";

export type PreviewServerOptions = {
  workspacePath: string;
  filePath: string;
  port: number;
  host?: string;
};

export type StartedPreviewServer = {
  port: number;
  url: string;
  close: () => Promise<void>;
};

export async function startPreviewServer(options: PreviewServerOptions): Promise<StartedPreviewServer> {
  const host = options.host ?? DEFAULT_HOST;
  assertAllowedHost(host);

  const resolved = await resolveWorkspaceFile(options);
  const sessions = new WorkspaceSessionStore();
  const session = sessions.createSession(resolved);
  const webSockets = new WebSocketServer({ noServer: true });
  const fileWatch = new FileWatchService();
  const connectedClients = new Map<string, Set<WebSocket>>();
  let latestRenderSequence = 0;

  fileWatch.on("file:change", async () => {
    const clients = connectedClients.get(session.id);
    if (!clients || clients.size === 0) {
      return;
    }

    await renderAndBroadcast(session, clients);
  });

  async function renderAndBroadcast(
    previewSession: typeof session,
    clients: Set<WebSocket>
  ): Promise<void> {
    const renderSequence = (latestRenderSequence += 1);

    try {
      const payload = await renderSavedFile({
        workspaceRoot: previewSession.workspaceRoot,
        filePath: previewSession.filePath
      });

      if (renderSequence === latestRenderSequence) {
        sendToOpenClients(clients, { type: "preview:update", payload });
      }
    } catch (error) {
      console.error("[zed-mpe] render failed", error);

      if (renderSequence === latestRenderSequence) {
        sendToOpenClients(clients, { type: "preview:error", message: "Unable to render saved file" });
      }
    }
  }

  const server = createServer(async (request, response) => {
    try {
      if (!isAllowedRequest(request)) {
        sendJson(response, 403, { error: "forbidden" });
        return;
      }

      await handleRequest(request, response, sessions);
    } catch (error) {
      console.error("[zed-mpe] request failed", error);
      sendJson(response, 500, { error: "internal_error" });
    }
  });

  server.on("upgrade", (request, socket, head) => {
    let requestUrl: URL;
    try {
      requestUrl = new URL(request.url ?? "/", `http://${host}`);
    } catch {
      socket.destroy();
      return;
    }

    const match = requestUrl.pathname.match(/^\/ws\/([^/]+)$/);

    if (!match) {
      socket.destroy();
      return;
    }

    if (!isAllowedRequest(request)) {
      socket.destroy();
      return;
    }

    const previewSession = sessions.getSession(match[1]);
    if (!previewSession || previewSession.socketToken !== requestUrl.searchParams.get("token")) {
      socket.destroy();
      return;
    }

    webSockets.handleUpgrade(request, socket, head, async (client) => {
      if (!connectedClients.has(previewSession.id)) {
        connectedClients.set(previewSession.id, new Set());
      }

      const clients = connectedClients.get(previewSession.id)!;
      clients.add(client);

      if (!fileWatch.isWatching(previewSession.filePath)) {
        fileWatch.watch({ filePath: previewSession.filePath });
      }

      client.on("close", () => {
        clients.delete(client);

        if (clients.size === 0) {
          void fileWatch.unwatch(previewSession.filePath);
        }
      });

      try {
        client.send(JSON.stringify({ type: "preview:status", message: "connected" }));
        await renderAndBroadcast(previewSession, clients);
      } catch (error) {
        console.error("[zed-mpe] initial render failed", error);
        client.send(JSON.stringify({ type: "preview:error", message: "Unable to render saved file" }));
      }
    });
  });

  await listen(server, options.port, host);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : options.port;
  const url = buildPreviewUrl({ port, sessionId: session.id, token: session.previewToken, host });

  return {
    port,
    url,
    close: async () => {
      await fileWatch.unwatchAll();
      await new Promise<void>((resolve) => {
        webSockets.close(() => resolve());
      });
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  sessions: WorkspaceSessionStore
): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? DEFAULT_HOST}`);

  if (request.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(response, 200, { ok: true, service: SERVICE_NAME, sessions: sessions.size });
    return;
  }

  const previewMatch = requestUrl.pathname.match(/^\/preview\/([^/]+)$/);
  if (request.method === "GET" && previewMatch) {
    const session = sessions.consumePreviewToken(previewMatch[1], requestUrl.searchParams.get("token"));
    if (!session) {
      sendJson(response, 401, { error: "invalid_session" });
      return;
    }

    sendHtml(response, 200, createPreviewShell(session));
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/assets/browser-preview.js") {
    await sendAsset(response, "../../browser-preview/dist/index.js", "text/javascript; charset=utf-8");
    return;
  }

  const browserModuleMatch = requestUrl.pathname.match(/^\/assets\/([a-z0-9-]+\.js)$/);
  if (request.method === "GET" && browserModuleMatch) {
    await sendAsset(response, `../../browser-preview/dist/${browserModuleMatch[1]}`, "text/javascript; charset=utf-8");
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/assets/preview.css") {
    await sendAsset(response, "../../browser-preview/src/preview.css", "text/css; charset=utf-8");
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

function listen(server: ReturnType<typeof createServer>, port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function assertAllowedHost(host: string): void {
  if (host !== DEFAULT_HOST) {
    throw new Error(`Public bind is disabled by default. Use ${DEFAULT_HOST}.`);
  }
}

function isAllowedRequest(request: IncomingMessage): boolean {
  return isAllowedHostHeader(request.headers.host) && isAllowedOriginHeader(request.headers.origin);
}

function isAllowedHostHeader(value: string | string[] | undefined): boolean {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const host = new URL(`http://${value}`).hostname;
    return host === DEFAULT_HOST || host === "localhost";
  } catch {
    return false;
  }
}

function isAllowedOriginHeader(value: string | string[] | undefined): boolean {
  if (typeof value === "undefined") {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  try {
    const origin = new URL(value);
    return (origin.protocol === "http:" || origin.protocol === "https:") && isAllowedHostHeader(origin.host);
  } catch {
    return false;
  }
}

function sendToOpenClients(
  clients: Set<WebSocket>,
  message:
    | { type: "preview:status"; message: string }
    | { type: "preview:update"; payload: RenderPayload }
    | { type: "preview:error"; message: string }
): void {
  const encoded = JSON.stringify(message);

  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(encoded);
    }
  }
}

async function sendAsset(response: ServerResponse, relativePath: string, contentType: string): Promise<void> {
  const assetPath = fileURLToPath(new URL(relativePath, import.meta.url));
  const contents = await readFile(assetPath);
  response.writeHead(200, { "content-type": contentType });
  response.end(contents);
}

function sendHtml(response: ServerResponse, statusCode: number, html: string): void {
  response.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "pragma": "no-cache",
    "content-security-policy": "default-src 'self'; connect-src 'self' ws://127.0.0.1:*; script-src 'self'; style-src 'self'"
  });
  response.end(html);
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}