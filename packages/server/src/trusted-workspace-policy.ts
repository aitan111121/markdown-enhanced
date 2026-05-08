import { realpath, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { assertPathInside } from "./path-safety.js";

export const TRUST_CONFIG_RELATIVE_PATH = path.join(".zed-mpe", "trust.json");

export type TrustedWorkspacePolicy = {
  allowCodeChunkExecution: boolean;
  diagnostics: string[];
  sourcePath?: string;
};

export async function readTrustedWorkspacePolicy(workspaceRoot: string): Promise<TrustedWorkspacePolicy> {
  const diagnostics: string[] = [];
  const root = await realpath(workspaceRoot);
  const trustPath = path.join(root, TRUST_CONFIG_RELATIVE_PATH);

  try {
    const resolvedTrustPath = await realpath(trustPath);
    assertPathInside(root, resolvedTrustPath);

    const trustStat = await stat(resolvedTrustPath);
    if (!trustStat.isFile() || trustStat.size > 4096) {
      diagnostics.push("Trusted execution config was ignored because it is not a small file");
      return { allowCodeChunkExecution: false, diagnostics };
    }

    const parsed: unknown = JSON.parse(await readFile(resolvedTrustPath, "utf8"));
    const allowCodeChunkExecution = Boolean(
      parsed &&
      typeof parsed === "object" &&
      (parsed as { version?: unknown }).version === 1 &&
      (parsed as { allowCodeChunkExecution?: unknown }).allowCodeChunkExecution === true
    );

    return { allowCodeChunkExecution, diagnostics, sourcePath: resolvedTrustPath };
  } catch (error) {
    if (isMissingFileError(error)) {
      return { allowCodeChunkExecution: false, diagnostics };
    }

    diagnostics.push("Trusted execution config was ignored because it could not be read safely");
    return { allowCodeChunkExecution: false, diagnostics };
  }
}

function isMissingFileError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: unknown }).code === "ENOENT");
}