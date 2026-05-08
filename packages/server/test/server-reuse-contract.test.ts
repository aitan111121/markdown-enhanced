import { mkdtemp, rm, writeFile } from "node:fs/promises";
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

describe("reused preview sessions", () => {
  it("broadcasts saved-file updates to reused preview clients", async () => {
    const { workspace, firstFile, secondFile } = await makeWorkspace();
    const server = await startPreviewServer({
      workspacePath: workspace,
      filePath: firstFile,
      port: 0,
      controlToken: "test-control-token"
    });
    servers.push(server);

    const sessionResponse = await fetch(`http://127.0.0.1:${server.port}/sessions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-zed-mpe-control-token": "test-control-token"
      },
      body: JSON.stringify({ filePath: secondFile })
    });
    const sessionBody = await sessionResponse.json() as { url: string };
    const previewHtml = await fetch(sessionBody.url).then((response) => response.text());
    const sessionId = previewHtml.match(/data-session-id="([^"]+)"/)?.[1];
    const token = previewHtml.match(/data-token="([^"]+)"/)?.[1];

    expect(sessionId).toBeTruthy();
    expect(token).toBeTruthy();

    const webSocket = new WebSocket(`ws://127.0.0.1:${server.port}/ws/${sessionId}?token=${token}`);
    const messages: any[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout waiting for reused session update")), 4000);

      webSocket.on("message", (data) => {
        const message = JSON.parse(data.toString());
        messages.push(message);

        if (messages.length === 2) {
          writeFile(secondFile, "# Reused Updated").catch(reject);
        }

        if (message.type === "preview:update" && message.payload.html.includes("Reused Updated")) {
          clearTimeout(timeout);
          webSocket.close();
          resolve();
        }
      });

      webSocket.on("error", reject);
    });
  });

  it("closes while browser WebSocket clients are still connected", async () => {
    const { workspace, firstFile } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath: firstFile, port: 0 });
    const previewHtml = await fetch(server.url).then((response) => response.text());
    const sessionId = previewHtml.match(/data-session-id="([^"]+)"/)?.[1];
    const token = previewHtml.match(/data-token="([^"]+)"/)?.[1];
    const webSocket = new WebSocket(`ws://127.0.0.1:${server.port}/ws/${sessionId}?token=${token}`);

    await new Promise<void>((resolve, reject) => {
      webSocket.once("open", resolve);
      webSocket.once("error", reject);
    });

    await expect(withTimeout(server.close(), 1000)).resolves.toBeUndefined();
  });
});

async function makeWorkspace(): Promise<{
  workspace: string;
  firstFile: string;
  secondFile: string;
}> {
  const workspace = await mkdtemp(path.join(tmpdir(), "zed-mpe-reuse-server-"));
  tempRoots.push(workspace);

  const firstFile = path.join(workspace, "first.md");
  const secondFile = path.join(workspace, "second.md");
  await writeFile(firstFile, "# First");
  await writeFile(secondFile, "# Second");

  return { workspace, firstFile, secondFile };
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for server close")), milliseconds);
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}