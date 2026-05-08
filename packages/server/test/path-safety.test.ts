import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveContainedPathCandidate, resolveWorkspaceFile } from "../src/path-safety.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("resolveWorkspaceFile", () => {
  it("accepts files inside the workspace", async () => {
    const workspace = await makeTempRoot();
    const filePath = path.join(workspace, "note.md");
    await writeFile(filePath, "# Hello");
    const realWorkspace = await realpath(workspace);
    const realFilePath = await realpath(filePath);

    await expect(resolveWorkspaceFile({ workspacePath: workspace, filePath })).resolves.toMatchObject({
      filePath: realFilePath,
      workspaceRoot: realWorkspace
    });
  });

  it("rejects files outside the workspace", async () => {
    const workspace = await makeTempRoot();
    const outside = await makeTempRoot();
    const filePath = path.join(outside, "note.md");
    await writeFile(filePath, "# Outside");

    await expect(resolveWorkspaceFile({ workspacePath: workspace, filePath })).rejects.toThrow(
      "Path escapes workspace root"
    );
  });

  it("rejects files above the configured size cap", async () => {
    const workspace = await makeTempRoot();
    const filePath = path.join(workspace, "large.md");
    await writeFile(filePath, "0123456789");

    await expect(resolveWorkspaceFile({ workspacePath: workspace, filePath, maxBytes: 4 })).rejects.toThrow(
      "exceeds 4 bytes"
    );
  });

  it("accepts relative files inside the workspace", async () => {
    const workspace = await makeTempRoot();
    const filePath = path.join(workspace, "nested", "note.md");
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, "# Nested");
    const realFilePath = await realpath(filePath);

    await expect(resolveWorkspaceFile({ workspacePath: workspace, filePath: path.join("nested", "note.md") }))
      .resolves.toMatchObject({ filePath: realFilePath });
  });

  it("treats percent sequences in filesystem paths as literal file names", async () => {
    const workspace = await makeTempRoot();
    const filePath = path.join(workspace, "100% real.md");
    await writeFile(filePath, "# Percent");
    const realFilePath = await realpath(filePath);

    await expect(resolveWorkspaceFile({ workspacePath: workspace, filePath })).resolves.toMatchObject({
      filePath: realFilePath
    });
  });

  it("rejects UNC-style paths", async () => {
    const workspace = await makeTempRoot();

    await expect(resolveWorkspaceFile({ workspacePath: workspace, filePath: "//server/share/note.md" }))
      .rejects.toThrow("UNC paths are not supported");
  });

  it("rejects symlinks that resolve outside the workspace", async () => {
    const workspace = await makeTempRoot();
    const outside = await makeTempRoot();
    const outsideFile = path.join(outside, "secret.md");
    const linkPath = path.join(workspace, "linked.md");
    await writeFile(outsideFile, "secret");

    try {
      await symlink(outsideFile, linkPath, "file");
    } catch {
      return;
    }

    await expect(resolveWorkspaceFile({ workspacePath: workspace, filePath: linkPath }))
      .rejects.toThrow("Path escapes workspace root");
  });
});

describe("resolveContainedPathCandidate", () => {
  it("classifies missing files without throwing", async () => {
    const workspace = await makeTempRoot();

    await expect(resolveContainedPathCandidate({
      workspacePath: workspace,
      baseDirectoryPath: workspace,
      candidatePath: "missing.md"
    })).resolves.toMatchObject({ ok: true, exists: false });
  });

  it("rejects relative paths that escape the workspace", async () => {
    const workspace = await makeTempRoot();

    await expect(resolveContainedPathCandidate({
      workspacePath: workspace,
      baseDirectoryPath: workspace,
      candidatePath: "../outside.md"
    })).resolves.toMatchObject({ ok: false, reason: "outside-workspace" });
  });

  it("classifies existing files and size caps", async () => {
    const workspace = await makeTempRoot();
    const filePath = path.join(workspace, "large.md");
    await writeFile(filePath, "0123456789");

    await expect(resolveContainedPathCandidate({
      workspacePath: workspace,
      baseDirectoryPath: workspace,
      candidatePath: "large.md",
      maxBytes: 4
    })).resolves.toMatchObject({ ok: true, exists: true, isFile: true, tooLarge: true });
  });
});

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "zed-mpe-"));
  tempRoots.push(root);
  return root;
}