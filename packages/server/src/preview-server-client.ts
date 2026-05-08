import { DEFAULT_HOST } from "./contracts.js";
import { resolveWorkspaceFile } from "./path-safety.js";
import {
  CONTROL_TOKEN_HEADER,
  readWorkspaceServerState,
  removeWorkspaceServerState,
} from "./workspace-server-state.js";

export type ExistingPreviewServerResult = {
  port: number;
  url: string;
};

export type PreviewServerReuseDiagnostic = {
  code: "W_REUSE_STALE";
  message: string;
};

export async function createPreviewInExistingWorkspaceServer(input: {
  workspacePath: string;
  filePath: string;
  onDiagnostic?: (diagnostic: PreviewServerReuseDiagnostic) => void;
}): Promise<ExistingPreviewServerResult | undefined> {
  const resolved = await resolveWorkspaceFile(input);
  const state = await readWorkspaceServerState(resolved.workspaceRoot);
  if (!state) {
    return undefined;
  }

  try {
    const response = await postJsonWithRetry(
      `http://${DEFAULT_HOST}:${state.port}/sessions`,
      state.controlToken,
      { filePath: resolved.filePath }
    );

    return { port: state.port, url: response.url };
  } catch (error) {
    await removeWorkspaceServerState(resolved.workspaceRoot, state.controlToken);
    input.onDiagnostic?.({
      code: "W_REUSE_STALE",
      message: `Cleared stale preview server state and will start a fresh server (${error instanceof Error ? error.message : "unknown error"})`
    });
    return undefined;
  }
}

async function postJsonWithRetry(
  url: string,
  controlToken: string,
  body: { filePath: string }
): Promise<{ url: string }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await postJsonWithTimeout(url, controlToken, body);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await delay(150);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function postJsonWithTimeout(
  url: string,
  controlToken: string,
  body: { filePath: string }
): Promise<{ url: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [CONTROL_TOKEN_HEADER]: controlToken
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Existing preview server rejected session request: ${response.status}`);
    }

    const parsed: unknown = await response.json();
    if (!parsed || typeof parsed !== "object" || typeof (parsed as { url?: unknown }).url !== "string") {
      throw new Error("Existing preview server returned an invalid session response");
    }

    return parsed as { url: string };
  } finally {
    clearTimeout(timeout);
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}