import { SECURITY_DEFAULTS } from "./contracts.js";

export type SafeMarkdownConfig = {
  enableScriptExecution: false;
  allowCustomParser: false;
  runAllCodeChunks: false;
  html: boolean;
  breaks: boolean;
  linkify: boolean;
  typographer: boolean;
};

export function getSafeMarkdownConfig(): SafeMarkdownConfig {
  return {
    enableScriptExecution: SECURITY_DEFAULTS.enableScriptExecution,
    allowCustomParser: SECURITY_DEFAULTS.allowCustomParser,
    runAllCodeChunks: SECURITY_DEFAULTS.runAllCodeChunks,
    html: false,
    breaks: true,
    linkify: true,
    typographer: true
  };
}

export function assertSafeConfig(config: SafeMarkdownConfig): void {
  if (config.enableScriptExecution) {
    throw new Error("Script execution must be disabled by default");
  }

  if (config.allowCustomParser) {
    throw new Error("Custom parser must be disabled by default");
  }

  if (config.runAllCodeChunks) {
    throw new Error("Code chunk execution must be disabled by default");
  }
}
