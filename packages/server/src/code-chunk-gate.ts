import { logSecurityEvent } from "./audit-log.js";
import { readTrustedWorkspacePolicy } from "./trusted-workspace-policy.js";

export type CodeChunkGateResult = {
  containsRunnableChunks: boolean;
  executionAllowed: false;
  diagnostics: string[];
};

export async function evaluateCodeChunkGate(input: {
  markdown: string;
  workspaceRoot: string;
}): Promise<CodeChunkGateResult> {
  const policy = await readTrustedWorkspacePolicy(input.workspaceRoot);
  const containsRunnableChunks = containsRunnableCodeChunk(input.markdown);
  const diagnostics = [...policy.diagnostics];

  if (!containsRunnableChunks) {
    return { containsRunnableChunks, executionAllowed: false, diagnostics };
  }

  const reason = policy.allowCodeChunkExecution
    ? "Trusted code chunk execution is not enabled in this release"
    : "Code chunk execution is disabled by default";

  diagnostics.push(reason);
  logSecurityEvent({
    type: "blocked_code_chunk",
    workspaceRoot: input.workspaceRoot,
    reason
  });

  return { containsRunnableChunks, executionAllowed: false, diagnostics };
}

export function containsRunnableCodeChunk(markdown: string): boolean {
  const fencePattern = /^\s*(`{3,}|~{3,})\s*([^\r\n]*)/gm;
  let match: RegExpExecArray | null;

  while ((match = fencePattern.exec(markdown))) {
    if (hasRunnableFenceInfo(match[2] ?? "")) {
      return true;
    }
  }

  return false;
}

function hasRunnableFenceInfo(info: string): boolean {
  return /(?:^|[\s{,])(?:cmd|run|exec|code_chunk)\s*(?:=|:|\b)/i.test(info);
}