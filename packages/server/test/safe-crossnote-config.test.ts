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
});
