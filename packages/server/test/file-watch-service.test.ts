import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileWatchService, type FileChangeEvent, type FileWatchReadyEvent } from "../src/file-watch-service.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("FileWatchService", () => {
  let service: FileWatchService;

  beforeEach(() => {
    service = new FileWatchService();
  });

  afterEach(async () => {
    await service.unwatchAll();
  });

  it("starts watching a file", async () => {
    const { filePath } = await makeTempFile("initial");

    service.watch({ filePath });

    expect(service.isWatching(filePath)).toBe(true);
  });

  it("emits file:change event when file changes", async () => {
    const { filePath } = await makeTempFile("initial");
    const events: FileChangeEvent[] = [];

    service.on("file:change", (event: FileChangeEvent) => {
      events.push(event);
    });

    const ready = waitForWatchReady(service, filePath);
    service.watch({ filePath, debounceMs: 50 });
    await ready;

    await writeFile(filePath, "changed");
    await waitFor(() => events.length > 0);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].filePath).toBe(filePath);
    expect(events[0].event).toBe("change");
  });

  it("debounces rapid file changes", async () => {
    const { filePath } = await makeTempFile("initial");
    const events: FileChangeEvent[] = [];

    service.on("file:change", (event: FileChangeEvent) => {
      events.push(event);
    });

    const ready = waitForWatchReady(service, filePath);
    service.watch({ filePath, debounceMs: 100 });
    await ready;

    await writeFile(filePath, "change1");
    await new Promise((resolve) => setTimeout(resolve, 30));
    await writeFile(filePath, "change2");
    await new Promise((resolve) => setTimeout(resolve, 30));
    await writeFile(filePath, "change3");

    await waitFor(() => events.length === 1, 4000);
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(events.length).toBe(1);
  });

  it("stops watching after unwatch", async () => {
    const { filePath } = await makeTempFile("initial");

    service.watch({ filePath });
    expect(service.isWatching(filePath)).toBe(true);

    await service.unwatch(filePath);
    expect(service.isWatching(filePath)).toBe(false);
  });

  it("allows immediate rewatch while old watcher is closing", async () => {
    const { filePath } = await makeTempFile("initial");
    const events: FileChangeEvent[] = [];

    service.on("file:change", (event: FileChangeEvent) => {
      events.push(event);
    });

    service.watch({ filePath });
    expect(service.isWatching(filePath)).toBe(true);

    const closing = service.unwatch(filePath);
    expect(service.isWatching(filePath)).toBe(false);

    const ready = waitForWatchReady(service, filePath);
    service.watch({ filePath, debounceMs: 50 });
    expect(service.isWatching(filePath)).toBe(true);

    await Promise.all([closing, ready]);
    expect(service.isWatching(filePath)).toBe(true);

    await writeFile(filePath, "changed after rewatch");
    await waitFor(() => events.length > 0);

    expect(events[0].filePath).toBe(filePath);
  });

  it("stops all watchers with unwatchAll", async () => {
    const file1 = await makeTempFile("file1");
    const file2 = await makeTempFile("file2");

    service.watch({ filePath: file1.filePath });
    service.watch({ filePath: file2.filePath });

    expect(service.isWatching(file1.filePath)).toBe(true);
    expect(service.isWatching(file2.filePath)).toBe(true);

    await service.unwatchAll();

    expect(service.isWatching(file1.filePath)).toBe(false);
    expect(service.isWatching(file2.filePath)).toBe(false);
  });

  it("does not start duplicate watchers for same file", async () => {
    const { filePath } = await makeTempFile("initial");

    service.watch({ filePath });
    service.watch({ filePath });

    expect(service.isWatching(filePath)).toBe(true);
  });
});

async function makeTempFile(contents: string): Promise<{ root: string; filePath: string }> {
  const root = await mkdtemp(path.join(tmpdir(), "zed-mpe-watch-"));
  tempRoots.push(root);
  const filePath = path.join(root, "watched.md");
  await writeFile(filePath, contents);
  return { root, filePath };
}

async function waitForWatchReady(service: FileWatchService, filePath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      service.off("watch:ready", onReady);
      reject(new Error(`Timed out waiting for watcher readiness: ${filePath}`));
    }, 1000);

    const onReady = (event: FileWatchReadyEvent) => {
      if (event.filePath !== filePath) {
        return;
      }

      clearTimeout(timeout);
      service.off("watch:ready", onReady);
      resolve();
    };

    service.on("watch:ready", onReady);
  });
}

async function waitFor(predicate: () => boolean, timeoutMs = 1500): Promise<void> {
  const startedAt = Date.now();

  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Timed out waiting for condition");
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}
