import { MAX_SOURCE_BYTES } from "./contracts.js";
import type { RenderPayload } from "./contracts.js";
import { renderMarkdown } from "./crossnote-renderer.js";
import { resolveWorkspaceFile } from "./path-safety.js";
import { loadSafeCustomStyle } from "./safe-custom-style.js";
import { readUtf8FileWithinLimit } from "./source-file-state.js";
import { collectWorkspaceLinkDiagnostics } from "./workspace-link-diagnostics.js";

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
  const source = await readUtf8FileWithinLimit(resolved.filePath, maxBytes);

  const payload = await renderMarkdown({
    markdown: source.contents,
    sourcePath: resolved.filePath,
    workspaceRoot: resolved.workspaceRoot
  });
  const customStyle = await loadSafeCustomStyle(resolved.workspaceRoot);
  const linkDiagnostics = await collectWorkspaceLinkDiagnostics({
    markdown: source.contents,
    workspaceRoot: resolved.workspaceRoot,
    sourcePath: resolved.filePath,
    maxBytes
  }).catch((error: unknown) => [
    {
      status: "unsafe-path" as const,
      severity: "warning" as const,
      kind: "link" as const,
      target: "diagnostics",
      line: 1,
      message: `Link diagnostics unavailable: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  ]);

  return {
    ...payload,
    sourceText: source.contents,
    sourceVersion: source.version,
    linkDiagnostics,
    diagnostics: [...payload.diagnostics, ...customStyle.diagnostics],
    customStyle: customStyle.css && customStyle.sourcePath
      ? { css: customStyle.css, sourcePath: customStyle.sourcePath }
      : undefined
  };
}
