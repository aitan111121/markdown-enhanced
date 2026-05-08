import { open } from "node:fs/promises";
import { MAX_SOURCE_BYTES } from "./contracts.js";
import type { RenderPayload } from "./contracts.js";
import { renderMarkdown } from "./crossnote-renderer.js";
import { resolveWorkspaceFile } from "./path-safety.js";
import { loadSafeCustomStyle } from "./safe-custom-style.js";

export async function renderSavedFile(input: {
  workspaceRoot: string;
  filePath: string;
  maxBytes?: number;
}): Promise<RenderPayload> {
  const maxBytes = input.maxBytes ?? MAX_SOURCE_BYTES;
  const resolved = await resolveWorkspaceFile({
    workspacePath: input.workspaceRoot,
    filePath: input.filePath,
    maxBytes
  });
  const markdown = await readUtf8FileWithinLimit(resolved.filePath, maxBytes);

  const payload = await renderMarkdown({
    markdown,
    sourcePath: resolved.filePath,
    workspaceRoot: resolved.workspaceRoot
  });
  const customStyle = await loadSafeCustomStyle(resolved.workspaceRoot);

  return {
    ...payload,
    diagnostics: [...payload.diagnostics, ...customStyle.diagnostics],
    customStyle: customStyle.css && customStyle.sourcePath
      ? { css: customStyle.css, sourcePath: customStyle.sourcePath }
      : undefined
  };
}

async function readUtf8FileWithinLimit(filePath: string, maxBytes: number): Promise<string> {
  const handle = await open(filePath, "r");

  try {
    const buffer = Buffer.alloc(maxBytes + 1);
    const result = await handle.read(buffer, 0, buffer.length, 0);

    if (result.bytesRead > maxBytes) {
      throw new Error(`Preview target exceeds ${maxBytes} bytes: ${filePath}`);
    }

    return buffer.subarray(0, result.bytesRead).toString("utf8");
  } finally {
    await handle.close();
  }
}