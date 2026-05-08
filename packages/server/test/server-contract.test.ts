import { request } from "node:http";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
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