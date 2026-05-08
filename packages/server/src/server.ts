import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, type WebSocket } from "ws";
import { logSecurityEvent } from "./audit-log.js";
import { DEFAULT_HOST, SERVICE_NAME, type RenderPayload } from "./contracts.js";
import { FileWatchService } from "./file-watch-service.js";
import { createHtmlExport, getHtmlExportFileName } from "./html-export-service.js";
import { assertAllowedBindHost, isAllowedRequest } from "./origin-policy.js";
import { resolveWorkspaceFile } from "./path-safety.js";
import { buildPreviewUrl } from "./preview-url.js";
import { renderSavedFile } from "./saved-file-preview.js";
import { getCustomStylePath, resolveExistingCustomStylePath } from "./safe-custom-style.js";
import { isTokenMatch } from "./server-token.js";
import { createPreviewShell } from "./static-preview-shell.js";
import { randomToken, WorkspaceSessionStore } from "./workspace-session-store.js";
import {
  CONTROL_TOKEN_HEADER,
  removeWorkspaceServerState,
  removeWorkspaceServerStateSync,
  writeWorkspaceServerState,
} from "./workspace-server-state.js";

export type PreviewServerOptions = {
  workspacePath: string;
  filePath: string;
  port: number;
  host?: string;
  controlToken?: string;
};

export type StartedPreviewServer = {
  port: number;
  url: string;
  cleanupWorkspaceStateSync: () => void;
  close: () => Promise<void>;
};

export async function startPreviewServer(options: PreviewServerOptions): Promise<StartedPreviewServer> {
  const host = options.host ?? DEFAULT_HOST;
  assertAllowedBindHost(host);

  if (options.port !== 0 && !isBrowserAllowedPort(options.port)) {
    throw new Error(`Port ${options.port} is blocked by browsers. Use --port 0 or another local port.`);
  }

  const resolved = await resolveWorkspaceFile(options);
  const controlToken = options.controlToken ?? randomToken();
  const sessions = new WorkspaceSessionStore();
  const session = sessions.createSession(resolved);
  const webSockets = new WebSocketServer({ noServer: true });
  const fileWatch = new FileWatchService();
  const connectedClients = new Map<string, Set<WebSocket>>();
  const latestRenderSequences = new Map<string, number>();
  let boundPort = options.port;

  fileWatch.on("file:change", async (event) => {
    const changedSessions = new Set(sessions.getSessionsByFilePath(event.filePath));
    const customStylePath = await getCustomStylePath(resolved.workspaceRoot).catch(() => undefined);
    const resolvedCustomStylePath = await resolveExistingCustomStylePath(resolved.workspaceRoot);

    if (
      (customStylePath && pathsEqual(customStylePath, event.filePath)) ||
      (resolvedCustomStylePath && pathsEqual(resolvedCustomStylePath, event.filePath))
    ) {
      for (const changedSession of sessions.getSessionsByWorkspaceRoot(resolved.workspaceRoot)) {
        changedSessions.add(changedSession);
      }
    }

    await Promise.all(
      Array.from(changedSessions).map(async (changedSession) => {
        const clients = connectedClients.get(changedSession.id);
        if (!clients || clients.size === 0) {
          return;
        }

        await renderAndBroadcast(changedSession, clients);
      })
    );
  });

  async function renderAndBroadcast(
    previewSession: typeof session,
    clients: Set<WebSocket>
  ): Promise<void> {
    const renderSequence = (latestRenderSequences.get(previewSession.id) ?? 0) + 1;
    latestRenderSequences.set(previewSession.id, renderSequence);

    try {
      const payload = await renderSavedFile({
        workspaceRoot: previewSession.workspaceRoot,
        filePath: previewSession.filePath
      });

      if (renderSequence === latestRenderSequences.get(previewSession.id)) {
        sendToOpenClients(clients, { type: "preview:update", payload });
      }
    } catch (error) {
      console.error("[zed-mpe] render failed", error);

      if (renderSequence === latestRenderSequences.get(previewSession.id)) {
        sendToOpenClients(clients, { type: "preview:error", message: "Unable to render saved file" });
      }
    }
  }

  const server = createServer(async (request, response) => {
    try {
      if (!isAllowedRequest(request)) {
        logSecurityEvent({ type: "blocked_request", reason: "HTTP Host or Origin was not local" });
        sendJson(response, 403, { error: "forbidden" });
        return;
      }

      await handleRequest(request, response, {
        sessions,
        workspaceRoot: resolved.workspaceRoot,
        host,
        port: boundPort,
        controlToken
      });
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
      logSecurityEvent({ type: "blocked_request", reason: "WebSocket Host or Origin was not local" });
      socket.destroy();
      return;
    }

    const previewSession = sessions.getSession(match[1]);
    if (!previewSession || !isTokenMatch(previewSession.socketToken, requestUrl.searchParams.get("token"))) {
      logSecurityEvent({ type: "invalid_websocket_token", sessionId: match[1], reason: "WebSocket token mismatch" });
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

      await watchCustomStyleForSession(previewSession);

      client.on("close", () => {
        clients.delete(client);

        if (clients.size === 0 && !hasOpenClientsForFile(previewSession.filePath)) {
          void fileWatch.unwatch(previewSession.filePath);
        }

        void unwatchCustomStyleIfIdle(previewSession.workspaceRoot);
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

  const port = await listenOnBrowserAllowedPort(server, options.port, host);
  boundPort = port;
  const url = buildPreviewUrl({ port, sessionId: session.id, token: session.previewToken, host });
  await writeWorkspaceServerState({
    version: 1,
    workspaceRoot: resolved.workspaceRoot,
    host,
    port,
    controlToken,
    pid: process.pid,
    updatedAt: new Date().toISOString()
  });

  return {
    port,
    url,
    cleanupWorkspaceStateSync: () => {
      removeWorkspaceServerStateSync(resolved.workspaceRoot, controlToken);
    },
    close: async () => {
      try {
        closeConnectedClients(connectedClients);
        await fileWatch.unwatchAll();
        await new Promise<void>((resolve) => {
          webSockets.close(() => resolve());
        });
        await closeServer(server);
      } finally {
        await removeWorkspaceServerState(resolved.workspaceRoot, controlToken);
      }
    }
  };

  function hasOpenClientsForFile(filePath: string): boolean {
    return sessions.getSessionsByFilePath(filePath).some((candidate) => {
      const clients = connectedClients.get(candidate.id);
      return Boolean(clients && clients.size > 0);
    });
  }

  function hasOpenClientsForWorkspace(workspaceRoot: string): boolean {
    return sessions.getSessionsByWorkspaceRoot(workspaceRoot).some((candidate) => {
      const clients = connectedClients.get(candidate.id);
      return Boolean(clients && clients.size > 0);
    });
  }

  async function watchCustomStyleForSession(previewSession: typeof session): Promise<void> {
    const customStylePath = await resolveExistingCustomStylePath(previewSession.workspaceRoot);
    if (customStylePath && !fileWatch.isWatching(customStylePath)) {
      fileWatch.watch({ filePath: customStylePath });
    }
  }

  async function unwatchCustomStyleIfIdle(workspaceRoot: string): Promise<void> {
    if (hasOpenClientsForWorkspace(workspaceRoot)) {
      return;
    }

    const customStylePath = await resolveExistingCustomStylePath(workspaceRoot);
    if (customStylePath) {
      await fileWatch.unwatch(customStylePath);
    }
  }
}

function closeConnectedClients(connectedClients: Map<string, Set<WebSocket>>): void {
  for (const clients of connectedClients.values()) {
    for (const client of clients) {
      client.terminate();
    }
  }

  connectedClients.clear();
}

type RequestContext = {
  sessions: WorkspaceSessionStore;
  workspaceRoot: string;
  host: string;
  port: number;
  controlToken: string;
};

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  context: RequestContext
): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? DEFAULT_HOST}`);

  if (request.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(response, 200, { ok: true, service: SERVICE_NAME, sessions: context.sessions.size });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/sessions") {
    if (!hasControlToken(request, context.controlToken)) {
      logSecurityEvent({ type: "invalid_control_token", reason: "Control token mismatch" });
      sendJson(response, 403, { error: "forbidden" });
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = await readJsonBody(request);
    } catch {
      sendJson(response, 400, { error: "invalid_request" });
      return;
    }

    if (typeof body.filePath !== "string" || body.filePath.trim() === "") {
      sendJson(response, 400, { error: "missing_file" });
      return;
    }

    let resolved: Awaited<ReturnType<typeof resolveWorkspaceFile>>;
    try {
      resolved = await resolveWorkspaceFile({
        workspacePath: context.workspaceRoot,
        filePath: body.filePath
      });
    } catch {
      sendJson(response, 400, { error: "invalid_file" });
      return;
    }

    const session = context.sessions.createSession(resolved);
    sendJson(response, 200, {
      url: buildPreviewUrl({
        port: context.port,
        sessionId: session.id,
        token: session.previewToken,
        host: context.host
      })
    });
    return;
  }

  const previewMatch = requestUrl.pathname.match(/^\/preview\/([^/]+)$/);
  if (request.method === "GET" && previewMatch) {
    const session = context.sessions.consumePreviewToken(previewMatch[1], requestUrl.searchParams.get("token"));
    if (!session) {
      logSecurityEvent({ type: "invalid_preview_token", sessionId: previewMatch[1], reason: "Preview token mismatch or replay" });
      sendJson(response, 401, { error: "invalid_session" });
      return;
    }

    sendPreviewHtml(response, 200, createPreviewShell(session), session.styleNonce);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/export/html") {
    let body: Record<string, unknown>;
    try {
      body = await readJsonBody(request);
    } catch {
      sendJson(response, 400, { error: "invalid_request" });
      return;
    }

    if (typeof body.sessionId !== "string" || typeof body.token !== "string") {
      sendJson(response, 400, { error: "invalid_request" });
      return;
    }

    const session = context.sessions.getSession(body.sessionId);
    if (!session || !isTokenMatch(session.socketToken, body.token)) {
      logSecurityEvent({ type: "invalid_export_token", sessionId: body.sessionId, reason: "Export token mismatch" });
      sendJson(response, 401, { error: "invalid_session" });
      return;
    }

    const payload = await renderSavedFile({
      workspaceRoot: session.workspaceRoot,
      filePath: session.filePath
    });
    sendHtmlDownload(response, getHtmlExportFileName(payload.sourcePath), createHtmlExport(payload));
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

async function listenOnBrowserAllowedPort(
  server: ReturnType<typeof createServer>,
  port: number,
  host: string
): Promise<number> {
  const maxAttempts = port === 0 ? 10 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await listen(server, port, host);
    const boundPort = getBoundPort(server, port);

    if (isBrowserAllowedPort(boundPort)) {
      return boundPort;
    }

    await closeServer(server);
  }

  throw new Error("Unable to allocate a browser-safe localhost port");
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

function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function getBoundPort(server: ReturnType<typeof createServer>, fallbackPort: number): number {
  const address = server.address();
  return typeof address === "object" && address ? address.port : fallbackPort;
}

function isBrowserAllowedPort(port: number): boolean {
  return !BROWSER_BLOCKED_PORTS.has(port) && (port < 6665 || port > 6669);
}

const BROWSER_BLOCKED_PORTS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77,
  79, 87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115, 117, 119, 123,
  135, 137, 139, 143, 161, 179, 389, 427, 465, 512, 513, 514, 515, 526,
  530, 531, 532, 540, 548, 554, 556, 563, 587, 601, 636, 989, 990, 993,
  995, 1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566,
  6697, 10080
]);

function hasControlToken(request: IncomingMessage, controlToken: string): boolean {
  const value = request.headers[CONTROL_TOKEN_HEADER];
  return typeof value === "string" && isTokenMatch(controlToken, value);
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let sizeBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    sizeBytes += buffer.length;
    if (sizeBytes > 8192) {
      throw new Error("Request body exceeds 8192 bytes");
    }

    chunks.push(buffer);
  }

  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
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

function sendPreviewHtml(response: ServerResponse, statusCode: number, html: string, styleNonce: string): void {
  response.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "pragma": "no-cache",
    "content-security-policy": `default-src 'self'; connect-src 'self' ws://127.0.0.1:*; script-src 'self'; style-src 'self' 'nonce-${styleNonce}'`
  });
  response.end(html);
}

function sendHtmlDownload(response: ServerResponse, fileName: string, html: string): void {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "content-disposition": `attachment; filename="${fileName}"`,
    "cache-control": "no-store",
    "pragma": "no-cache"
  });
  response.end(html);
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "pragma": "no-cache"
  });
  response.end(JSON.stringify(body));
}

function pathsEqual(left: string, right: string): boolean {
  const normalizedLeft = path.resolve(left);
  const normalizedRight = path.resolve(right);
  return process.platform === "win32"
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}