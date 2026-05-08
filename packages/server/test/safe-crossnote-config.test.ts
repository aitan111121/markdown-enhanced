import { describe, expect, it } from "vitest";
import { assertSafeConfig, getSafeMarkdownConfig } from "../src/safe-crossnote-config.js";

describe("getSafeMarkdownConfig", () => {
  it("returns config with all script execution disabled", () => {
    const config = getSafeMarkdownConfig();

    expect(config.enableScriptExecution).toBe(false);
    expect(config.allowCustomParser).toBe(false);
    expect(config.runAllCodeChunks).toBe(false);
  });

  it("enables safe markdown features", () => {
    const config = getSafeMarkdownConfig();

    expect(config.breaks).toBe(true);
    expect(config.linkify).toBe(true);
    expect(config.typographer).toBe(true);
  });

  it("disables HTML rendering by default", () => {
    const config = getSafeMarkdownConfig();

    expect(config.html).toBe(false);
  });

  it("disables Crossnote HTML5 embed and remote diagram services by default", () => {
    const config = getSafeMarkdownConfig();

    expect(config.crossnote.enableHTML5Embed).toBe(false);
    expect(config.crossnote.HTML5EmbedUseImageSyntax).toBe(false);
    expect(config.crossnote.HTML5EmbedUseLinkSyntax).toBe(false);
    expect(config.crossnote.HTML5EmbedIsAllowedHttp).toBe(false);
    expect(config.crossnote.plantumlServer).toBe("");
    expect(config.crossnote.krokiServer).toBe("");
    expect(config.crossnote.webSequenceDiagramsServer).toBe("");
  });
});

describe("assertSafeConfig", () => {
  it("passes for safe default config", () => {
    const config = getSafeMarkdownConfig();

    expect(() => assertSafeConfig(config)).not.toThrow();
  });

  it("rejects config with script execution enabled", () => {
    const config = { ...getSafeMarkdownConfig(), enableScriptExecution: true as const };

    expect(() => assertSafeConfig(config as any)).toThrow("Script execution must be disabled");
  });

  it("rejects config with custom parser enabled", () => {
    const config = { ...getSafeMarkdownConfig(), allowCustomParser: true as const };

    expect(() => assertSafeConfig(config as any)).toThrow("Custom parser must be disabled");
  });

  it("rejects config with code chunk execution enabled", () => {
    const config = { ...getSafeMarkdownConfig(), runAllCodeChunks: true as const };

    expect(() => assertSafeConfig(config as any)).toThrow("Code chunk execution must be disabled");
  });

  it("rejects config with Crossnote HTML5 embeds enabled", () => {
    const config = {
      ...getSafeMarkdownConfig(),
      crossnote: { ...getSafeMarkdownConfig().crossnote, enableHTML5Embed: true }
    };

    expect(() => assertSafeConfig(config)).toThrow("Crossnote HTML5 embeds must be disabled");
  });

  it("rejects custom header and global CSS injection", () => {
    const config = {
      ...getSafeMarkdownConfig(),
      crossnote: { ...getSafeMarkdownConfig().crossnote, includeInHeader: "<script></script>" }
    };

    expect(() => assertSafeConfig(config)).toThrow("custom header and global CSS");
  });

  it("rejects remote diagram services", () => {
    const config = {
      ...getSafeMarkdownConfig(),
      crossnote: { ...getSafeMarkdownConfig().crossnote, krokiServer: "https://kroki.example" }
    };

    expect(() => assertSafeConfig(config)).toThrow("remote diagram services");
  });

  it("rejects file URL protocol support", () => {
    const config = {
      ...getSafeMarkdownConfig(),
      crossnote: { ...getSafeMarkdownConfig().crossnote, protocolsWhiteList: "http://, file://" }
    };

    expect(() => assertSafeConfig(config)).toThrow("file URL protocols");
  });
});
