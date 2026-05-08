import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPreviewInExistingWorkspaceServer } from "../src/preview-server-client.js";
import { startPreviewServer, type StartedPreviewServer } from "../src/server.js";
import {
  readWorkspaceServerState,
  writeWorkspaceServerState,
} from "../src/workspace-server-state.js";

const tempRoots: string[] = [];
const servers: StartedPreviewServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("createPreviewInExistingWorkspaceServer", () => {
  it("creates a fresh preview URL from an existing workspace server", async () => {
    const { workspace, firstFile, secondFile } = await makeWorkspace();
    const server = await startPreviewServer({ workspacePath: workspace, filePath: firstFile, port: 0 });
    servers.push(server);

    const reused = await createPreviewInExistingWorkspaceServer({
      workspacePath: workspace,
      filePath: secondFile
    });

    expect(reused).toMatchObject({ port: server.port });
    expect(reused?.url).toContain(`http://127.0.0.1:${server.port}/preview/`);

    const preview = await fetch(reused!.url);
    const health = await fetch(`http://127.0.0.1:${server.port}/health`).then((response) => response.json());

    expect(preview.status).toBe(200);
    expect(health).toMatchObject({ sessions: 2 });
  });

  it("clears stale workspace server state when reuse fails", async () => {
    const { workspace, firstFile } = await makeWorkspace();
    const workspaceRoot = await realpath(workspace);
    await writeWorkspaceServerState({
      version: 1,
      workspaceRoot,
      host: "127.0.0.1",
      port: 9,
      controlToken: "stale-token",
      pid: 0,
      updatedAt: new Date().toISOString()
    });

    const reused = await createPreviewInExistingWorkspaceServer({
      workspacePath: workspace,
      filePath: firstFile
    });

    expect(reused).toBeUndefined();
    await expect(readWorkspaceServerState(workspaceRoot)).resolves.toBeUndefined();
  });
});

async function makeWorkspace(): Promise<{
  workspace: string;
  firstFile: string;
  secondFile: string;
}> {
  const workspace = await mkdtemp(path.join(tmpdir(), "zed-mpe-reuse-"));
  tempRoots.push(workspace);

  const firstFile = path.join(workspace, "first.md");
  const secondFile = path.join(workspace, "second.md");
  await writeFile(firstFile, "# First");
  await writeFile(secondFile, "# Second");

  return { workspace, firstFile, secondFile };
}