import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyDraftMarkdown, setDraftApplyBeforeFinalReplaceHookForTest } from "../src/source-draft-service.js";
import { readUtf8FileWithinLimit } from "../src/source-file-state.js";

const tempRoots: string[] = [];

afterEach(async () => {
  setDraftApplyBeforeFinalReplaceHookForTest(undefined);
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("applyDraftMarkdown", () => {
  it("rejects a source change that lands immediately before replacement", async () => {
    const root = await makeTempRoot();
    const filePath = path.join(root, "note.md");
    await writeFile(filePath, "# Original");
    const base = await readUtf8FileWithinLimit(filePath, 1024);
    setDraftApplyBeforeFinalReplaceHookForTest(async (targetPath) => {
      await writeFile(targetPath, "# External save");
    });

    await expect(applyDraftMarkdown({
      workspaceRoot: root,
      filePath,
      markdown: "# Browser draft",
      baseVersion: base.version
    })).rejects.toThrow("Saved source changed");

    await expect(readFile(filePath, "utf8")).resolves.toBe("# External save");
  });
});

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "zed-mpe-draft-"));
  tempRoots.push(root);
  return root;
}