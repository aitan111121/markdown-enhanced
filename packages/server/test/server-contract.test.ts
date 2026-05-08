import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
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
});

async function makeWorkspace(): Promise<{ workspace: string; filePath: string }> {
  const workspace = await mkdtemp(path.join(tmpdir(), "zed-mpe-server-"));
  tempRoots.push(workspace);
  const filePath = path.join(workspace, "note.md");
  await writeFile(filePath, "# Hello");
  return { workspace, filePath };
}