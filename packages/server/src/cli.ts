#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { openPreviewUrl } from "./browser-launch.js";
import { startPreviewServer } from "./server.js";

type CliOptions = {
  command: "preview";
  workspace: string;
  file: string;
  port: number;
  open: boolean;
  saveMode: "filesystem";
};

export function parseCliArgs(args: string[]): CliOptions {
  const [command, ...rest] = args;

  if (command !== "preview") {
    throw new Error(usage());
  }

  const values = new Map<string, string | boolean>();

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--open") {
      values.set("open", true);
      continue;
    }

    if (arg === "--no-open") {
      values.set("open", false);
      continue;
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const value = rest[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    values.set(arg.slice(2), value);
    index += 1;
  }

  const workspace = requiredString(values, "workspace");
  const file = requiredString(values, "file");
  const port = Number(values.get("port") ?? 0);
  const saveMode = values.get("save-mode") ?? "filesystem";

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("--port must be an integer from 0 to 65535");
  }

  if (saveMode !== "filesystem") {
    throw new Error("Only --save-mode filesystem is supported in the MVP contract");
  }

  return {
    command: "preview",
    workspace,
    file,
    port,
    open: values.get("open") !== false,
    saveMode
  };
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(args);
  const started = await startPreviewServer({
    workspacePath: options.workspace,
    filePath: options.file,
    port: options.port
  });

  console.log(`[zed-mpe] preview ${started.url}`);
  console.log(`[zed-mpe] health http://127.0.0.1:${started.port}/health`);

  if (options.open) {
    await openPreviewUrl(started.url).catch((error: unknown) => {
      console.warn(`[zed-mpe] browser open failed: ${String(error)}`);
      console.warn(`[zed-mpe] open manually: ${started.url}`);
    });
  }
}

function requiredString(values: Map<string, string | boolean>, key: string): string {
  const value = values.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required --${key}`);
  }

  return value;
}

function usage(): string {
  return "Usage: zed-mpe preview --workspace <path> --file <path> --port <0-65535> [--open|--no-open] --save-mode filesystem";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(`[zed-mpe] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}