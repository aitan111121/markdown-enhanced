import path from "node:path";
import { MAX_SOURCE_BYTES, type WorkspaceLinkDiagnostic } from "./contracts.js";
import { resolveContainedPathCandidate } from "./path-safety.js";

type LinkCandidate = {
  kind: "link" | "image" | "reference";
  target: string;
  line: number;
};

const MAX_DIAGNOSTICS = 50;
const SAFE_REMOTE_SCHEMES = new Set(["http:", "https:"]);
const UNSUPPORTED_SCHEMES = new Set(["file:", "data:", "javascript:", "vbscript:", "mailto:"]);

export async function collectWorkspaceLinkDiagnostics(input: {
  markdown: string;
  workspaceRoot: string;
  sourcePath: string;
  maxBytes?: number;
}): Promise<WorkspaceLinkDiagnostic[]> {
  const candidates = extractLinkCandidates(input.markdown);
  const diagnostics: WorkspaceLinkDiagnostic[] = [];
  const baseDirectoryPath = path.dirname(input.sourcePath);
  const maxBytes = input.maxBytes ?? MAX_SOURCE_BYTES;

  for (const candidate of candidates) {
    if (diagnostics.length >= MAX_DIAGNOSTICS) {
      diagnostics.push({
        status: "too-large",
        severity: "warning",
        kind: "link",
        target: "diagnostics",
        line: candidate.line,
        message: `Link diagnostics stopped after ${MAX_DIAGNOSTICS} entries`
      });
      break;
    }

    diagnostics.push(await classifyCandidate({ ...candidate, workspaceRoot: input.workspaceRoot, baseDirectoryPath, maxBytes }));
  }

  return diagnostics;
}

function extractLinkCandidates(markdown: string): LinkCandidate[] {
  const candidates: LinkCandidate[] = [];
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceMarker = "";
  let fenceLength = 0;

  for (const [index, line] of lines.entries()) {
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      const marker = fence[1][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
        fenceLength = fence[1].length;
      } else if (marker === fenceMarker && fence[1].length >= fenceLength) {
        inFence = false;
        fenceMarker = "";
        fenceLength = 0;
      }

      continue;
    }

    if (inFence) {
      continue;
    }

    const lineNumber = index + 1;
    const reference = line.match(/^\s*\[[^\]]+\]:\s+(\S+)/);
    if (reference) {
      candidates.push({ kind: "reference", target: reference[1], line: lineNumber });
    }

    const inlinePattern = /(!)?\[[^\]\n]+\]\(([^)\n]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = inlinePattern.exec(line))) {
      candidates.push({
        kind: match[1] ? "image" : "link",
        target: firstMarkdownTargetToken(match[2]),
        line: lineNumber
      });
    }
  }

  return candidates;
}

async function classifyCandidate(input: LinkCandidate & {
  workspaceRoot: string;
  baseDirectoryPath: string;
  maxBytes: number;
}): Promise<WorkspaceLinkDiagnostic> {
  const target = input.target.trim();
  const redactedTarget = redactTarget(target);

  if (!target || target.startsWith("#")) {
    return info(input, redactedTarget, "valid", "Anchor-only link");
  }

  const parsedUrl = parseUrl(target);
  if (parsedUrl && SAFE_REMOTE_SCHEMES.has(parsedUrl.protocol)) {
    return info(input, redactRemoteUrl(parsedUrl), "remote", "Remote link classified without network access");
  }

  if (parsedUrl && UNSUPPORTED_SCHEMES.has(parsedUrl.protocol)) {
    return error(input, redactedTarget, "unsupported-scheme", `${parsedUrl.protocol} links are not opened or fetched`);
  }

  if (parsedUrl && parsedUrl.protocol) {
    return warning(input, redactedTarget, "unsupported-scheme", `${parsedUrl.protocol} links are not supported`);
  }

  const localPath = stripQueryAndFragment(target);
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(localPath);
  } catch {
    return error(input, redactedTarget, "unsafe-path", "Link target contains malformed percent encoding");
  }

  if (decodedPath !== localPath && hasEncodedPathControl(decodedPath)) {
    return error(input, redactedTarget, "unsafe-path", "Link target contains encoded traversal characters");
  }

  const resolved = await resolveContainedPathCandidate({
    workspacePath: input.workspaceRoot,
    baseDirectoryPath: input.baseDirectoryPath,
    candidatePath: decodedPath,
    maxBytes: input.maxBytes
  });

  if (!resolved.ok) {
    return error(input, redactedTarget, resolved.reason, resolved.message);
  }

  if (!resolved.exists) {
    return warning(input, redactedTarget, "missing", "Local target was not found in the workspace");
  }

  if (!resolved.isFile) {
    return warning(input, redactedTarget, "unsafe-path", "Local target is not a file");
  }

  if (resolved.tooLarge) {
    return warning(input, redactedTarget, "too-large", "Local target exceeds the preview size cap");
  }

  return info(input, redactedTarget, "valid", "Local target exists inside the workspace");
}

function info(
  candidate: LinkCandidate,
  target: string,
  status: WorkspaceLinkDiagnostic["status"],
  message: string
): WorkspaceLinkDiagnostic {
  return { status, severity: "info", kind: candidate.kind, target, line: candidate.line, message };
}

function warning(
  candidate: LinkCandidate,
  target: string,
  status: WorkspaceLinkDiagnostic["status"],
  message: string
): WorkspaceLinkDiagnostic {
  return { status, severity: "warning", kind: candidate.kind, target, line: candidate.line, message };
}

function error(
  candidate: LinkCandidate,
  target: string,
  status: WorkspaceLinkDiagnostic["status"],
  message: string
): WorkspaceLinkDiagnostic {
  return { status, severity: "error", kind: candidate.kind, target, line: candidate.line, message };
}

function parseUrl(target: string): URL | undefined {
  try {
    return new URL(target);
  } catch {
    return undefined;
  }
}

function stripQueryAndFragment(target: string): string {
  const hashIndex = target.indexOf("#");
  const queryIndex = target.indexOf("?");
  const end = [hashIndex, queryIndex].filter((index) => index >= 0).sort((left, right) => left - right)[0];
  return end === undefined ? target : target.slice(0, end);
}

function firstMarkdownTargetToken(target: string): string {
  const trimmed = target.trim();
  if (trimmed.startsWith("<")) {
    const closeIndex = trimmed.indexOf(">");
    return closeIndex >= 0 ? trimmed.slice(1, closeIndex) : trimmed.slice(1);
  }

  return trimmed.split(/\s+/)[0] ?? "";
}

function redactTarget(target: string): string {
  const stripped = stripQueryAndFragment(target);
  return stripped.length > 160 ? `${stripped.slice(0, 157)}...` : stripped;
}

function redactRemoteUrl(url: URL): string {
  const value = `${url.origin}${url.pathname}`;
  return value.length > 160 ? `${value.slice(0, 157)}...` : value;
}

function hasEncodedPathControl(decodedPath: string): boolean {
  return decodedPath.includes("..") || decodedPath.includes("/") || decodedPath.includes("\\");
}