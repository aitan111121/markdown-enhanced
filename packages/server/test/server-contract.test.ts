import { request } from "node:http";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { startPreviewServer, type StartedPreviewServer } from "../src/server.js";

const tempRoots: string[] = [];
const servers: StartedPreviewServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("startPreviewServer", () => {
  it("rejects public bind hosts", async () => {
    const { workspace, filePath } = await makeWorkspace();

    await expect(
      startPreviewServer({ workspacePath: workspace, filePath, port: 0, host: "0.0.0.0" })
    ).rejects.toThrow("Public bind is disabled");
  });

  it("rejects browser-blocked explicit ports", async () => {
    const { workspace, filePath } = await makeWorkspace();

    await expect(
      startPreviewServer({ workspacePath: workspace, filePath, port: 10080 })
    ).rejects.toThrow("blocked by browsers");
  });

  it("serves health without exposing tokens", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const response = await fetch(`http://127.0.0.1:${server.port}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, service: "zed-mpe-preview", sessions: 1 });
    expect(JSON.stringify(body)).not.toContain("token");
  });

  it("allows the preview bootstrap token only once", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const first = await fetch(server.url);
    const second = await fetch(server.url);

    expect(first.status).toBe(200);
    expect(second.status).toBe(401);
  });

  it("marks token-bearing preview HTML as non-cacheable", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const response = await fetch(server.url);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toContain("script-src 'self'");
  });

  it("rejects non-local Host headers", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const response = await requestWithHost(`http://127.0.0.1:${server.port}/health`, "example.com");

    expect(response.statusCode).toBe(403);
  });

  it("rejects non-local Origin headers", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const response = await fetch(`http://127.0.0.1:${server.port}/health`, {
      headers: { origin: "http://example.com" }
    });

    expect(response.status).toBe(403);
  });

  it("creates additional preview sessions through the control endpoint", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const secondFilePath = path.join(workspace, "second.md");
    await writeFile(secondFilePath, "# Second");
    const server = await startPreviewServer({
      workspacePath: workspace,
      filePath,
      port: 0,
      controlToken: "test-control-token"
    });
    servers.push(server);

    const response = await fetch(`http://127.0.0.1:${server.port}/sessions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-zed-mpe-control-token": "test-control-token"
      },
      body: JSON.stringify({ filePath: secondFilePath })
    });
    const body = await response.json() as { url: string };
    const preview = await fetch(body.url);

    expect(response.status).toBe(200);
    expect(body.url).toContain(`http://127.0.0.1:${server.port}/preview/`);
    expect(preview.status).toBe(200);
  });

  it("rejects session creation without the control token", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const response = await fetch(`http://127.0.0.1:${server.port}/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filePath })
    });

    expect(response.status).toBe(403);
  });

  it("sends initial render over WebSocket", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const previewHtml = await fetch(server.url).then((r) => r.text());
    const sessionId = previewHtml.match(/data-session-id="([^"]+)"/)?.[1];
    const token = previewHtml.match(/data-token="([^"]+)"/)?.[1];

    expect(sessionId).toBeTruthy();
    expect(token).toBeTruthy();

    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws/${sessionId}?token=${token}`);
    const messages: any[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on("message", (data) => {
        messages.push(JSON.parse(data.toString()));
        if (messages.length >= 2) {
          ws.close();
          resolve();
        }
      });

      ws.on("error", reject);
      ws.on("close", () => {
        if (messages.length < 2) {
          reject(new Error("WebSocket closed before receiving messages"));
        }
      });

      setTimeout(() => reject(new Error("Timeout waiting for messages")), 2000);
    });

    expect(messages[0]).toMatchObject({ type: "preview:status", message: "connected" });
    expect(messages[1]).toMatchObject({
      type: "preview:update",
      payload: expect.objectContaining({
        html: expect.stringContaining("Hello")
      })
    });
    const expectedPath = await realpath(filePath);
    expect(messages[1].payload.sourcePath).toBe(expectedPath);
  });

  it("sends update when watched file changes", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const previewHtml = await fetch(server.url).then((r) => r.text());
    const sessionId = previewHtml.match(/data-session-id="([^"]+)"/)?.[1];
    const token = previewHtml.match(/data-token="([^"]+)"/)?.[1];

    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws/${sessionId}?token=${token}`);
    const messages: any[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on("message", (data) => {
        messages.push(JSON.parse(data.toString()));

        if (messages.length === 2) {
          writeFile(filePath, "# Updated").catch(reject);
        }

        if (messages.length >= 3) {
          ws.close();
          resolve();
        }
      });

      ws.on("error", reject);
      ws.on("close", () => {
        if (messages.length < 3) {
          reject(new Error("WebSocket closed before update"));
        }
      });

      setTimeout(() => reject(new Error("Timeout waiting for update")), 3000);
    });

    expect(messages[2]).toMatchObject({
      type: "preview:update",
      payload: expect.objectContaining({
        html: expect.stringContaining("Updated")
      })
    });
  });

  it("sends update when existing custom style changes or is deleted", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const stylePath = await writeCustomStyle(workspace, ".markdown-preview h1 { color: red; }");
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const previewHtml = await fetch(server.url).then((r) => r.text());
    const sessionId = previewHtml.match(/data-session-id="([^"]+)"/)?.[1];
    const token = previewHtml.match(/data-token="([^"]+)"/)?.[1];

    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws/${sessionId}?token=${token}`);
    const messages: any[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on("message", (data) => {
        messages.push(JSON.parse(data.toString()));

        if (messages.length === 2) {
          writeFile(stylePath, ".markdown-preview h1 { color: blue; }").catch(reject);
        }

        if (messages.length === 3) {
          rm(stylePath, { force: true }).catch(reject);
        }

        if (messages.length >= 4) {
          ws.close();
          resolve();
        }
      });

      ws.on("error", reject);
      ws.on("close", () => {
        if (messages.length < 4) {
          reject(new Error("WebSocket closed before style update"));
        }
      });

      setTimeout(() => reject(new Error("Timeout waiting for style update")), 4000);
    });

    expect(messages[2]).toMatchObject({
      type: "preview:update",
      payload: expect.objectContaining({
        customStyle: expect.objectContaining({ css: expect.stringContaining("color: blue") })
      })
    });
    expect(messages[3]).toMatchObject({
      type: "preview:update",
      payload: expect.not.objectContaining({ customStyle: expect.anything() })
    });
  });

  it("exports standalone HTML for an authenticated preview session", async () => {
    const { workspace, filePath } = await makeWorkspace();
    await writeCustomStyle(workspace, ".markdown-preview h1 { color: red; }");
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const previewHtml = await fetch(server.url).then((r) => r.text());
    const sessionId = previewHtml.match(/data-session-id="([^"]+)"/)?.[1];
    const token = previewHtml.match(/data-token="([^"]+)"/)?.[1];
    const response = await fetch(`http://127.0.0.1:${server.port}/api/export/html`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, token })
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain('filename="note.html"');
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Hello");
    expect(html).toContain(".markdown-preview h1 { color: red; }");
    expect(html).not.toContain(String(token));
    expect(html).not.toContain("data-token");
    expect(html).not.toContain("<script");
  });

  it("rejects HTML export without the browser session token", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const previewHtml = await fetch(server.url).then((r) => r.text());
    const sessionId = previewHtml.match(/data-session-id="([^"]+)"/)?.[1];
    const response = await fetch(`http://127.0.0.1:${server.port}/api/export/html`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, token: "wrong" })
    });

    expect(response.status).toBe(401);
  });

  it("rejects encoded traversal through the session control endpoint", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({
      workspacePath: workspace,
      filePath,
      port: 0,
      controlToken: "test-control-token"
    });
    servers.push(server);

    const response = await fetch(`http://127.0.0.1:${server.port}/sessions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-zed-mpe-control-token": "test-control-token"
      },
      body: JSON.stringify({ filePath: "%2e%2e%2fsecret.md" })
    });

    expect(response.status).toBe(400);
  });

  it("does not expose CORS headers for preflight requests", async () => {
    const { workspace, filePath } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath, port: 0 });
    servers.push(server);

    const response = await fetch(`http://127.0.0.1:${server.port}/health`, {
      method: "OPTIONS",
      headers: { origin: "http://localhost" }
    });

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});

async function makeWorkspace(): Promise<{ workspace: string; filePath: string }> {
  const workspace = await mkdtemp(path.join(tmpdir(), "zed-mpe-server-"));
  tempRoots.push(workspace);
  const filePath = path.join(workspace, "note.md");
  await writeFile(filePath, "# Hello");
  return { workspace, filePath };
}

function requestWithHost(url: string, host: string): Promise<{ statusCode: number }> {
  const parsed = new URL(url);

  return new Promise((resolve, reject) => {
    const clientRequest = request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        method: "GET",
        headers: { host }
      },
      (response) => {
        response.resume();
        response.on("end", () => resolve({ statusCode: response.statusCode ?? 0 }));
      }
    );

    clientRequest.on("error", reject);
    clientRequest.end();
  });
}

async function writeCustomStyle(workspace: string, contents: string): Promise<string> {
  const crossnoteDir = path.join(workspace, ".crossnote");
  await mkdir(crossnoteDir);
  const stylePath = path.join(crossnoteDir, "style.less");
  await writeFile(stylePath, contents);
  return stylePath;
}