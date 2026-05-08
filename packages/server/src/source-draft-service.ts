import { constants as fsConstants } from "node:fs";
import { copyFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAX_SOURCE_BYTES, type DraftApplyResult, type RenderPayload, type SourceVersion } from "./contracts.js";
import { renderMarkdown } from "./crossnote-renderer.js";
import { resolveWorkspaceFile } from "./path-safety.js";
import { loadSafeCustomStyle } from "./safe-custom-style.js";
import { readUtf8FileWithinLimit, sourceVersionMatches } from "./source-file-state.js";
import { collectWorkspaceLinkDiagnostics } from "./workspace-link-diagnostics.js";

const draftApplyLocks = new Map<string, Promise<void>>();
let beforeFinalReplaceHook: ((filePath: string) => Promise<void>) | undefined;

export async function renderDraftMarkdown(input: {
  workspaceRoot: string;
  filePath: string;
  markdown: string;
  maxBytes?: number;
}): Promise<RenderPayload> {
  const maxBytes = input.maxBytes ?? MAX_SOURCE_BYTES;
  assertSafeDraftContent(input.markdown, maxBytes);
  const resolved = await resolveWorkspaceFile({ workspacePath: input.workspaceRoot, filePath: input.filePath, maxBytes });
  const current = await readUtf8FileWithinLimit(resolved.filePath, maxBytes);
  const payload = await renderMarkdown({
    markdown: input.markdown,
    sourcePath: resolved.filePath,
    workspaceRoot: resolved.workspaceRoot
  });
  const customStyle = await loadSafeCustomStyle(resolved.workspaceRoot);
  const linkDiagnostics = await collectWorkspaceLinkDiagnostics({
    markdown: input.markdown,
    workspaceRoot: resolved.workspaceRoot,
    sourcePath: resolved.filePath,
    maxBytes
  });

  return {
    ...payload,
    sourceText: input.markdown,
    sourceVersion: current.version,
    linkDiagnostics,
    diagnostics: [...payload.diagnostics, ...customStyle.diagnostics],
    customStyle: customStyle.css && customStyle.sourcePath
      ? { css: customStyle.css, sourcePath: customStyle.sourcePath }
      : undefined
  };
}

export async function applyDraftMarkdown(input: {
  workspaceRoot: string;
  filePath: string;
  markdown: string;
  baseVersion: SourceVersion;
  maxBytes?: number;
}): Promise<DraftApplyResult> {
  const maxBytes = input.maxBytes ?? MAX_SOURCE_BYTES;
  assertSafeDraftContent(input.markdown, maxBytes);
  const resolved = await resolveWorkspaceFile({ workspacePath: input.workspaceRoot, filePath: input.filePath, maxBytes });
  const tempPath = `${resolved.filePath}.zed-mpe-${process.pid}-${Date.now()}.tmp`;
  await writeFile(tempPath, input.markdown, { encoding: "utf8", flag: "wx" });

  try {
    return await withDraftApplyLock(resolved.filePath, async () => {
      const current = await readUtf8FileWithinLimit(resolved.filePath, maxBytes);
      if (!sourceVersionMatches(current.version, input.baseVersion)) {
        throw new Error("Saved source changed after this draft started");
      }

      const backupPath = buildBackupPath(resolved.filePath);
      await copyFile(resolved.filePath, backupPath, fsConstants.COPYFILE_EXCL);
      await beforeFinalReplaceHook?.(resolved.filePath);

      const beforeReplace = await readUtf8FileWithinLimit(resolved.filePath, maxBytes);
      if (!sourceVersionMatches(beforeReplace.version, input.baseVersion)) {
        throw new Error("Saved source changed after this draft started");
      }

      await rename(tempPath, resolved.filePath);
      const updated = await readUtf8FileWithinLimit(resolved.filePath, maxBytes);
      return {
        applied: true,
        backupFileName: path.basename(backupPath),
        sourceVersion: updated.version
      };
    });
  } finally {
    await rm(tempPath, { force: true }).catch(() => undefined);
  }
}

export function setDraftApplyBeforeFinalReplaceHookForTest(
  hook: ((filePath: string) => Promise<void>) | undefined
): void {
  beforeFinalReplaceHook = hook;
}

function assertSafeDraftContent(markdown: string, maxBytes: number): void {
  const sizeBytes = Buffer.byteLength(markdown, "utf8");
  if (sizeBytes > maxBytes) {
    throw new Error(`Draft exceeds ${maxBytes} bytes`);
  }

  if (markdown.includes("\u0000")) {
    throw new Error("Draft contains unsupported null bytes");
  }
}

function buildBackupPath(filePath: string): string {
  const parsed = path.parse(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(parsed.dir, `.${parsed.base}.zed-mpe-backup-${timestamp}.bak`);
}

async function withDraftApplyLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const previous = draftApplyLocks.get(filePath) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const scheduled = previous.catch(() => undefined).then(() => current);
  draftApplyLocks.set(filePath, scheduled);

  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    release();
    if (draftApplyLocks.get(filePath) === scheduled) {
      draftApplyLocks.delete(filePath);
    }
  }
}