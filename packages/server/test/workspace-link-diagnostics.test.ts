import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectWorkspaceLinkDiagnostics } from "../src/workspace-link-diagnostics.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("collectWorkspaceLinkDiagnostics", () => {
  it("classifies local, missing, remote, and unsafe links without fetching", async () => {
    const root = await makeTempRoot();
    const docsDir = path.join(root, "docs");
    await mkdir(docsDir);
    await writeFile(path.join(docsDir, "ok.md"), "# OK");
    const sourcePath = path.join(docsDir, "index.md");
    const markdown = [
      "[ok](./ok.md)",
      "[missing](./missing.md)",
      "[remote](https://example.com/path?token=secret)",
      "![bad](file:///secret.png)",
      "[escape](../outside.md)"
    ].join("\n");

    const diagnostics = await collectWorkspaceLinkDiagnostics({ markdown, workspaceRoot: root, sourcePath });

    expect(diagnostics.map((diagnostic) => diagnostic.status)).toEqual([
      "valid",
      "missing",
      "remote",
      "unsupported-scheme",
      "missing"
    ]);
    expect(JSON.stringify(diagnostics)).not.toContain("token=secret");
  });

  it("rejects encoded traversal before filesystem resolution", async () => {
    const root = await makeTempRoot();
    const sourcePath = path.join(root, "index.md");

    const diagnostics = await collectWorkspaceLinkDiagnostics({
      markdown: "[bad](%2e%2e%2fsecret.md)",
      workspaceRoot: root,
      sourcePath
    });

    expect(diagnostics[0]).toMatchObject({ status: "unsafe-path", severity: "error" });
  });

  it("supports percent-encoded literal characters in Markdown link targets", async () => {
    const root = await makeTempRoot();
    await writeFile(path.join(root, "100% real.md"), "# Percent");

    const diagnostics = await collectWorkspaceLinkDiagnostics({
      markdown: "[percent](100%25%20real.md)",
      workspaceRoot: root,
      sourcePath: path.join(root, "index.md")
    });

    expect(diagnostics[0]).toMatchObject({ status: "valid", severity: "info" });
  });
});

async function makeTempRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "zed-mpe-links-"));
  tempRoots.push(root);
  return root;
}