import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { containsRunnableCodeChunk, evaluateCodeChunkGate } from "../src/code-chunk-gate.js";
import { isAllowedHostHeader, isAllowedOriginHeader } from "../src/origin-policy.js";
import { createServerToken, isTokenMatch } from "../src/server-token.js";
import { readTrustedWorkspacePolicy } from "../src/trusted-workspace-policy.js";

const tempRoots: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("server security tokens", () => {
  it("creates high entropy URL-safe tokens", () => {
    const token = createServerToken();

    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("compares tokens without accepting length or value mismatches", () => {
    const token = createServerToken();

    expect(isTokenMatch(token, token)).toBe(true);
    expect(isTokenMatch(token, `${token}x`)).toBe(false);
    expect(isTokenMatch(token, "wrong")).toBe(false);
    expect(isTokenMatch(token, undefined)).toBe(false);
  });
});

describe("origin policy", () => {
  it("allows localhost aliases only", () => {
    expect(isAllowedHostHeader("127.0.0.1:3000")).toBe(true);
    expect(isAllowedHostHeader("localhost:3000")).toBe(true);
    expect(isAllowedHostHeader("[::1]:3000")).toBe(true);
    expect(isAllowedHostHeader("127.0.0.1.example.com")).toBe(false);
    expect(isAllowedHostHeader("example.com")).toBe(false);
  });

  it("rejects non-local origins", () => {
    expect(isAllowedOriginHeader(undefined)).toBe(true);
    expect(isAllowedOriginHeader("http://localhost:3000")).toBe(true);
    expect(isAllowedOriginHeader("https://127.0.0.1:3000")).toBe(true);
    expect(isAllowedOriginHeader("null")).toBe(false);
    expect(isAllowedOriginHeader("https://example.com")).toBe(false);
  });
});

describe("trusted workspace policy", () => {
  it("denies code chunk execution when no trust file exists", async () => {
    const workspace = await makeWorkspace();

    await expect(readTrustedWorkspacePolicy(workspace)).resolves.toMatchObject({
      allowCodeChunkExecution: false,
      diagnostics: []
    });
  });

  it("requires an explicit v1 trust opt-in", async () => {
    const workspace = await makeWorkspace();
    await writeTrustFile(workspace, { version: 1, allowCodeChunkExecution: true });

    await expect(readTrustedWorkspacePolicy(workspace)).resolves.toMatchObject({
      allowCodeChunkExecution: true,
      diagnostics: []
    });
  });
});

describe("code chunk gate", () => {
  it("detects runnable Crossnote-style code chunks", () => {
    expect(containsRunnableCodeChunk("```js {cmd=true}\nconsole.log(1)\n```")).toBe(true);
    expect(containsRunnableCodeChunk("```js\nconsole.log(1)\n```")).toBe(false);
  });

  it("reports blocked execution by default", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const workspace = await makeWorkspace();

    const result = await evaluateCodeChunkGate({
      workspaceRoot: workspace,
      markdown: "```js {cmd=true}\nconsole.log(1)\n```"
    });

    expect(result).toMatchObject({ containsRunnableChunks: true, executionAllowed: false });
    expect(result.diagnostics).toContain("Code chunk execution is disabled by default");
  });

  it("keeps trusted code chunks blocked in the release build", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const workspace = await makeWorkspace();
    await writeTrustFile(workspace, { version: 1, allowCodeChunkExecution: true });

    const result = await evaluateCodeChunkGate({
      workspaceRoot: workspace,
      markdown: "```python {cmd=true}\nprint('hi')\n```"
    });

    expect(result.executionAllowed).toBe(false);
    expect(result.diagnostics).toContain("Trusted code chunk execution is not enabled in this release");
  });
});

async function makeWorkspace(): Promise<string> {
  const workspace = await mkdtemp(path.join(tmpdir(), "zed-mpe-security-"));
  tempRoots.push(workspace);
  return workspace;
}

async function writeTrustFile(workspace: string, value: unknown): Promise<void> {
  const trustDir = path.join(workspace, ".zed-mpe");
  await mkdir(trustDir);
  await writeFile(path.join(trustDir, "trust.json"), JSON.stringify(value));
}