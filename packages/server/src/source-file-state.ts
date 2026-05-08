import { createHash } from "node:crypto";
import { open } from "node:fs/promises";
import type { SourceVersion } from "./contracts.js";

export type SourceFileState = {
  contents: string;
  version: SourceVersion;
};

export async function readUtf8FileWithinLimit(filePath: string, maxBytes: number): Promise<SourceFileState> {
  const handle = await open(filePath, "r");

  try {
    const buffer = Buffer.alloc(maxBytes + 1);
    const result = await handle.read(buffer, 0, buffer.length, 0);

    if (result.bytesRead > maxBytes) {
      throw new Error(`Preview target exceeds ${maxBytes} bytes: ${filePath}`);
    }

    const contents = buffer.subarray(0, result.bytesRead).toString("utf8");
    const fileStat = await handle.stat();

    return {
      contents,
      version: {
        hash: createHash("sha256").update(contents).digest("hex"),
        mtimeMs: fileStat.mtimeMs,
        sizeBytes: fileStat.size
      }
    };
  } finally {
    await handle.close();
  }
}

export function sourceVersionMatches(left: SourceVersion, right: SourceVersion): boolean {
  return left.hash === right.hash && left.sizeBytes === right.sizeBytes;
}