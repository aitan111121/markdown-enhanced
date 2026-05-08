import { randomBytes, randomUUID } from "node:crypto";
import type { PreviewSession } from "./contracts.js";

export class WorkspaceSessionStore {
  readonly #sessions = new Map<string, PreviewSession>();

  get size(): number {
    return this.#sessions.size;
  }

  createSession(input: { workspaceRoot: string; filePath: string }): PreviewSession {
    const session: PreviewSession = {
      id: randomUUID(),
      previewToken: randomToken(),
      socketToken: randomToken(),
      previewTokenUsed: false,
      workspaceRoot: input.workspaceRoot,
      filePath: input.filePath,
      createdAt: new Date().toISOString()
    };

    this.#sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): PreviewSession | undefined {
    return this.#sessions.get(sessionId);
  }

  consumePreviewToken(sessionId: string, token: string | null): PreviewSession | undefined {
    const session = this.#sessions.get(sessionId);
    if (!session || session.previewTokenUsed || session.previewToken !== token) {
      return undefined;
    }

    session.previewTokenUsed = true;
    return session;
  }
}

function randomToken(): string {
  return randomBytes(32).toString("base64url");
}