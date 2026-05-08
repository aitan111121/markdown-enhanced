import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { MAX_SOURCE_BYTES } from "./contracts.js";

export type ResolvedWorkspaceFile = {
  workspaceRoot: string;
  filePath: string;
  sizeBytes: number;
};

export async function resolveWorkspaceFile(input: {
  workspacePath: string;
  filePath: string;
  maxBytes?: number;
}): Promise<ResolvedWorkspaceFile> {
  const workspaceRoot = await realpath(input.workspacePath);
  const candidate = path.isAbsolute(input.filePath)
    ? input.filePath
    : path.join(workspaceRoot, input.filePath);
  const filePath = await realpath(candidate);

  assertPathInside(workspaceRoot, filePath);

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    throw new Error(`Preview target is not a file: ${filePath}`);
  }

  const maxBytes = input.maxBytes ?? MAX_SOURCE_BYTES;
  if (fileStat.size > maxBytes) {
    throw new Error(`Preview target exceeds ${maxBytes} bytes: ${filePath}`);
  }

  return { workspaceRoot, filePath, sizeBytes: fileStat.size };
}

export function assertPathInside(workspaceRoot: string, candidatePath: string): void {
  const root = normalizeForContainment(workspaceRoot);
  const candidate = normalizeForContainment(candidatePath);
  const relative = path.relative(root, candidate);

  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }

  throw new Error(`Path escapes workspace root: ${candidatePath}`);
}

function normalizeForContainment(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}