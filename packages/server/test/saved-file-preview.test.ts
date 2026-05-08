import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { renderSavedFile } from "../src/saved-file-preview.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("renderSavedFile", () => {
  it("escapes markdown before returning placeholder HTML", async () => {
    const { root, filePath } = await writeTempFile("<script>alert(1)</script>");

    await expect(renderSavedFile({ workspaceRoot: root, filePath })).resolves.toMatchObject({
      html: expect.stringContaining("&lt;script&gt;alert(1)&lt;/script&gt;")
    });
  });

  it("rechecks the file size before render", async () => {
    const { root, filePath } = await writeTempFile("0123456789");

    await expect(renderSavedFile({ workspaceRoot: root, filePath, maxBytes: 4 })).rejects.toThrow("exceeds 4 bytes");
  });

  it("rechecks workspace containment before render", async () => {
    const workspace = await makeTempRoot();
    const outside = await writeTempFile("# Outside");

    await expect(renderSavedFile({ workspaceRoot: workspace, filePath: outside.filePath })).rejects.toThrow(
      "Path escapes workspace root"
    );
  });
});

async function writeTempFile(contents: string): Promise<{ root: string; filePath: string }> {
  const root = await makeTempRoot();
  const filePath = path.join(root, "note.md");
  await writeFile(filePath, contents);
  return { root, filePath };
}

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "zed-mpe-render-"));
  tempRoots.push(root);
  return root;
}