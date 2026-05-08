import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { MAX_SOURCE_BYTES } from "./contracts.js";

export type ResolvedWorkspaceFile = {
  workspaceRoot: string;
  filePath: string;
  sizeBytes: number;
};

export type ContainedPathResolution =
  | {
      ok: true;
      workspaceRoot: string;
      candidatePath: string;
      realPath?: string;
      exists: boolean;
      isFile: boolean;
      sizeBytes?: number;
      tooLarge: boolean;
    }
  | {
      ok: false;
      reason: "outside-workspace" | "unsafe-path";
      message: string;
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

export async function resolveContainedPathCandidate(input: {
  workspacePath: string;
  baseDirectoryPath: string;
  candidatePath: string;
  maxBytes?: number;
}): Promise<ContainedPathResolution> {
  try {
    assertSafePathInput(input.workspacePath);
    assertSafePathInput(input.baseDirectoryPath);
    assertSafePathInput(input.candidatePath);
  } catch (error) {
    return {
      ok: false,
      reason: "unsafe-path",
      message: error instanceof Error ? error.message : "Path input is unsafe"
    };
  }

  if (path.isAbsolute(input.candidatePath)) {
    return {
      ok: false,
      reason: "unsafe-path",
      message: "Absolute paths are not supported for workspace link diagnostics"
    };
  }

  let workspaceRoot: string;
  let baseDirectoryPath: string;
  try {
    workspaceRoot = await realpath(input.workspacePath);
    baseDirectoryPath = await realpath(input.baseDirectoryPath);
    assertPathInside(workspaceRoot, baseDirectoryPath);
  } catch (error) {
    return {
      ok: false,
      reason: "unsafe-path",
      message: error instanceof Error ? error.message : "Base path is unsafe"
    };
  }

  const candidatePath = path.resolve(baseDirectoryPath, input.candidatePath);

  try {
    assertPathInside(workspaceRoot, candidatePath);
  } catch (error) {
    return {
      ok: false,
      reason: "outside-workspace",
      message: error instanceof Error ? error.message : "Path escapes workspace root"
    };
  }

  try {
    const realPath = await realpath(candidatePath);
    assertPathInside(workspaceRoot, realPath);
    const fileStat = await stat(realPath);
    const maxBytes = input.maxBytes ?? MAX_SOURCE_BYTES;

    return {
      ok: true,
      workspaceRoot,
      candidatePath,
      realPath,
      exists: true,
      isFile: fileStat.isFile(),
      sizeBytes: fileStat.size,
      tooLarge: fileStat.size > maxBytes
    };
  } catch (error) {
    if (isMissingPathError(error)) {
      return {
        ok: true,
        workspaceRoot,
        candidatePath,
        exists: false,
        isFile: false,
        tooLarge: false
      };
    }

    return {
      ok: false,
      reason: "unsafe-path",
      message: error instanceof Error ? error.message : "Path cannot be resolved safely"
    };
  }
}

export function assertSafePathInput(value: string): void {
  if (isUncPath(value)) {
    throw new Error(`UNC paths are not supported for preview targets: ${value}`);
  }

  if (value.includes("\u0000")) {
    throw new Error("Null bytes are not supported for preview targets");
  }
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

function isUncPath(value: string): boolean {
  return /^\\\\[^\\]/.test(value) || /^\/\/[^/]/.test(value);
}

function isMissingPathError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ENOENT");
}