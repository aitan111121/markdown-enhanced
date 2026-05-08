export const SERVICE_NAME = "zed-mpe-preview";
export const DEFAULT_HOST = "127.0.0.1";
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024;

export const SECURITY_DEFAULTS = {
  enableScriptExecution: false,
  allowCustomParser: false,
  allowPublicBind: false,
  runAllCodeChunks: false,
  saveMode: "filesystem"
} as const;

export type RenderPayload = {
  html: string;
  sourcePath: string;
  diagnostics: string[];
};

export type PreviewSession = {
  id: string;
  previewToken: string;
  socketToken: string;
  previewTokenUsed: boolean;
  workspaceRoot: string;
  filePath: string;
  createdAt: string;
};