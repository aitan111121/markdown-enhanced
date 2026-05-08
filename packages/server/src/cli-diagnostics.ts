export class CliDiagnosticError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly hint?: string
  ) {
    super(message);
    this.name = "CliDiagnosticError";
  }
}

export type CliDiagnostic = {
  code: string;
  message: string;
  hint?: string;
};

export function toCliDiagnostic(error: unknown): CliDiagnostic {
  if (error instanceof CliDiagnosticError) {
    return { code: error.code, message: error.message, hint: error.hint };
  }

  const message = error instanceof Error ? error.message : String(error);
  return classifyMessage(message);
}

export function formatCliDiagnostic(diagnostic: CliDiagnostic): string {
  const hint = diagnostic.hint ? `\n[zed-mpe] hint: ${diagnostic.hint}` : "";
  return `[zed-mpe] ${diagnostic.code}: ${redactSensitiveUrlParts(diagnostic.message)}${hint}`;
}

export function redactSensitiveUrlParts(value: string): string {
  return value.replace(/([?&](?:token|previewToken|socketToken|controlToken)=)[^\s&]+/gi, "$1<redacted>");
}

function classifyMessage(message: string): CliDiagnostic {
  if (/usage:|missing required|unexpected argument|--port|--save-mode/i.test(message)) {
    return { code: "E_CLI_USAGE", message, hint: "Check the zed-mpe preview command arguments." };
  }

  if (/blocked by browsers|browser-safe localhost port/i.test(message)) {
    return { code: "E_BROWSER_PORT", message, hint: "Use --port 0 or choose a different localhost port." };
  }

  if (/workspace|path escapes|preview target|encoded traversal|UNC paths|not a file|no such file/i.test(message)) {
    return { code: "E_WORKSPACE_FILE", message, hint: "Verify --workspace and --file point to a saved file inside the workspace." };
  }

  return { code: "E_PREVIEW_START", message, hint: "Run npm run build, then retry the preview command." };
}