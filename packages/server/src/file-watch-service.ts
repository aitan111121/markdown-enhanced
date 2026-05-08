import { watch, type FSWatcher } from "chokidar";
import { EventEmitter } from "node:events";

export type FileWatchOptions = {
  filePath: string;
  debounceMs?: number;
};

export type FileChangeEvent = {
  filePath: string;
  event: "add" | "change" | "unlink";
};

export type FileWatchReadyEvent = {
  filePath: string;
};

const DEFAULT_DEBOUNCE_MS = 300;

export class FileWatchService extends EventEmitter {
  readonly #watchers = new Map<string, WatcherState>();

  watch(options: FileWatchOptions): void {
    if (this.#watchers.has(options.filePath)) {
      return;
    }

    const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    const watcher = watch(options.filePath, {
      persistent: false,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    const state: WatcherState = {
      watcher,
      debounceTimer: null
    };

    const emitChange = (event: FileChangeEvent["event"]) => {
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
      }

      state.debounceTimer = setTimeout(() => {
        state.debounceTimer = null;
        this.emit("file:change", { filePath: options.filePath, event } as FileChangeEvent);
      }, debounceMs);
    };

    watcher.on("add", () => emitChange("add"));
    watcher.on("change", () => emitChange("change"));
    watcher.on("unlink", () => emitChange("unlink"));

    watcher.on("ready", () => {
      this.emit("watch:ready", { filePath: options.filePath } as FileWatchReadyEvent);
    });

    watcher.on("error", (error) => {
      console.error(`[zed-mpe] file watch error for ${options.filePath}:`, error);
      void this.unwatch(options.filePath);
    });

    this.#watchers.set(options.filePath, state);
  }

  async unwatch(filePath: string): Promise<void> {
    const state = this.#watchers.get(filePath);
    if (!state) {
      return;
    }

    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }

    this.#watchers.delete(filePath);

    await state.watcher.close().catch((error) => {
      console.error(`[zed-mpe] failed to close watcher for ${filePath}:`, error);
    });
  }

  async unwatchAll(): Promise<void> {
    await Promise.all(Array.from(this.#watchers.keys()).map((filePath) => this.unwatch(filePath)));
  }

  isWatching(filePath: string): boolean {
    return this.#watchers.has(filePath);
  }
}

type WatcherState = {
  watcher: FSWatcher;
  debounceTimer: NodeJS.Timeout | null;
};
