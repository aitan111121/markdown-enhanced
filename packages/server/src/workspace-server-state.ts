import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEFAULT_HOST } from "./contracts.js";

export const CONTROL_TOKEN_HEADER = "x-zed-mpe-control-token";

export type WorkspaceServerState = {
  version: 1;
  workspaceRoot: string;
  host: string;
  port: number;
  controlToken: string;
  pid: number;
  updatedAt: string;
};

export async function writeWorkspaceServerState(state: WorkspaceServerState): Promise<void> {
  const statePath = getWorkspaceServerStatePath(state.workspaceRoot);
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
}

export async function readWorkspaceServerState(workspaceRoot: string): Promise<WorkspaceServerState | undefined> {
  try {
    const raw = await readFile(getWorkspaceServerStatePath(workspaceRoot), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return isWorkspaceServerState(parsed) ? parsed : undefined;
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }

    throw error;
  }
}

export async function removeWorkspaceServerState(
  workspaceRoot: string,
  controlToken?: string
): Promise<void> {
  const existing = await readWorkspaceServerState(workspaceRoot);
  if (controlToken && existing && existing.controlToken !== controlToken) {
    return;
  }

  await rm(getWorkspaceServerStatePath(workspaceRoot), { force: true });
}

export function removeWorkspaceServerStateSync(
  workspaceRoot: string,
  controlToken?: string
): void {
  const statePath = getWorkspaceServerStatePath(workspaceRoot);
  const existing = readWorkspaceServerStateSync(statePath);
  if (controlToken && existing && existing.controlToken !== controlToken) {
    return;
  }

  rmSync(statePath, { force: true });
}

export function getWorkspaceServerStatePath(workspaceRoot: string): string {
  const digest = createHash("sha256").update(workspaceRoot).digest("hex");
  return path.join(tmpdir(), "zed-mpe-preview", `${digest}.json`);
}

function isWorkspaceServerState(value: unknown): value is WorkspaceServerState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorkspaceServerState>;
  return (
    candidate.version === 1 &&
    typeof candidate.workspaceRoot === "string" &&
    candidate.host === DEFAULT_HOST &&
    typeof candidate.port === "number" &&
    Number.isInteger(candidate.port) &&
    candidate.port > 0 &&
    candidate.port <= 65535 &&
    typeof candidate.controlToken === "string" &&
    candidate.controlToken.length > 0 &&
    typeof candidate.pid === "number" &&
    typeof candidate.updatedAt === "string"
  );
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function readWorkspaceServerStateSync(statePath: string): WorkspaceServerState | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(statePath, "utf8"));
    return isWorkspaceServerState(parsed) ? parsed : undefined;
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }

    return undefined;
  }
}