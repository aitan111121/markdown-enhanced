export const SERVICE_NAME = "zed-mpe-preview";
export const DEFAULT_HOST = "127.0.0.1";
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
export const MAX_JSON_BODY_BYTES = MAX_SOURCE_BYTES + 8192;

export const SECURITY_DEFAULTS = {
  enableScriptExecution: false,
  allowCustomParser: false,
  allowPublicBind: false,
  runAllCodeChunks: false,
  saveMode: "filesystem"
} as const;

export type RenderPayload = {
  html: string;
  plainText: string;
  sourcePath: string;
  sourceText?: string;
  sourceVersion?: SourceVersion;
  diagnostics: string[];
  linkDiagnostics?: WorkspaceLinkDiagnostic[];
  customStyle?: {
    css: string;
    sourcePath: string;
  };
  metadata?: {
    frontMatter?: Record<string, unknown>;
    toc?: TocEntry[];
  };
};

export type TocEntry = {
  level: number;
  text: string;
  slug: string;
};

export type SourceVersion = {
  hash: string;
  mtimeMs: number;
  sizeBytes: number;
};

export type WorkspaceLinkDiagnosticStatus =
  | "valid"
  | "missing"
  | "outside-workspace"
  | "unsupported-scheme"
  | "too-large"
  | "unsafe-path"
  | "remote";

export type WorkspaceLinkDiagnostic = {
  status: WorkspaceLinkDiagnosticStatus;
  severity: "info" | "warning" | "error";
  kind: "link" | "image" | "reference";
  target: string;
  line: number;
  message: string;
};

export type DraftRenderResult = RenderPayload;

export type DraftApplyResult = {
  applied: true;
  backupFileName: string;
  sourceVersion: SourceVersion;
};

export type PreviewSession = {
  id: string;
  previewToken: string;
  socketToken: string;
  styleNonce: string;
  previewTokenUsed: boolean;
  workspaceRoot: string;
  filePath: string;
  createdAt: string;
};