import { SECURITY_DEFAULTS } from "./contracts.js";
import type { NotebookConfig } from "crossnote";

export type SafeMarkdownConfig = {
  enableScriptExecution: false;
  allowCustomParser: false;
  runAllCodeChunks: false;
  html: boolean;
  breaks: boolean;
  linkify: boolean;
  typographer: boolean;
  crossnote: Partial<NotebookConfig>;
};

export function getSafeMarkdownConfig(): SafeMarkdownConfig {
  return {
    enableScriptExecution: SECURITY_DEFAULTS.enableScriptExecution,
    allowCustomParser: SECURITY_DEFAULTS.allowCustomParser,
    runAllCodeChunks: SECURITY_DEFAULTS.runAllCodeChunks,
    html: false,
    breaks: true,
    linkify: true,
    typographer: true,
    crossnote: getSafeCrossnoteConfig()
  };
}

export function getSafeCrossnoteConfig(): Partial<NotebookConfig> {
  return {
    markdownParser: "markdown-it",
    enableScriptExecution: SECURITY_DEFAULTS.enableScriptExecution,
    breakOnSingleNewLine: true,
    enableTypographer: true,
    enableLinkify: true,
    protocolsWhiteList: "http://, https://, file://, mailto:, tel:",
    mathRenderingOption: "KaTeX",
    frontMatterRenderingOption: "table",
    mermaidTheme: "default",
    enableHTML5Embed: false,
    HTML5EmbedUseImageSyntax: false,
    HTML5EmbedUseLinkSyntax: false,
    HTML5EmbedIsAllowedHttp: false,
    HTML5EmbedAudioAttributes: "",
    HTML5EmbedVideoAttributes: "",
    plantumlServer: "",
    plantumlJarPath: "",
    krokiServer: "",
    webSequenceDiagramsServer: "",
    webSequenceDiagramsApiKey: "",
    d2Path: "",
    includeInHeader: "",
    globalCss: "",
    isVSCode: false,
    maxNoteFileSize: 5 * 1024 * 1024,
    parserConfig: {
      onWillParseMarkdown: async (markdown: string) => markdown,
      onDidParseMarkdown: async (html: string) => html
    }
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

  if (config.crossnote.enableScriptExecution) {
    throw new Error("Crossnote script execution must be disabled by default");
  }

  if (config.crossnote.enableHTML5Embed) {
    throw new Error("Crossnote HTML5 embeds must be disabled by default");
  }

  if (config.crossnote.HTML5EmbedUseImageSyntax || config.crossnote.HTML5EmbedUseLinkSyntax) {
    throw new Error("Crossnote HTML5 embed syntaxes must be disabled by default");
  }

  if (config.crossnote.HTML5EmbedIsAllowedHttp) {
    throw new Error("Crossnote HTML5 embed HTTP fetches must be disabled by default");
  }

  if (config.crossnote.parserConfig) {
    const parserConfig = config.crossnote.parserConfig;
    if (
      parserConfig.onWillParseMarkdown("probe") instanceof Promise === false ||
      parserConfig.onDidParseMarkdown("probe") instanceof Promise === false
    ) {
      throw new Error("Crossnote parser hooks must be inert async pass-through functions");
    }
  }
}
