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
  assertSafePathInput(input.workspacePath);
  assertSafePathInput(input.filePath);

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

export function assertSafePathInput(value: string): void {
  if (isUncPath(value)) {
    throw new Error(`UNC paths are not supported for preview targets: ${value}`);
  }

  assertNoEncodedPathControl(value);
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

function assertNoEncodedPathControl(value: string): void {
  let decoded: string;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new Error(`Path contains malformed percent encoding: ${value}`);
  }

  if (decoded === value) {
    return;
  }

  if (decoded.includes("..") || decoded.includes("/") || decoded.includes("\\")) {
    throw new Error(`Path contains encoded traversal characters: ${value}`);
  }
}

function isUncPath(value: string): boolean {
  return /^\\\\[^\\]/.test(value) || /^\/\/[^/]/.test(value);
}