import { randomUUID } from "node:crypto";
import type { PreviewSession } from "./contracts.js";
import { createServerToken, isTokenMatch } from "./server-token.js";

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
      styleNonce: randomToken(),
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

  getSessionsByFilePath(filePath: string): PreviewSession[] {
    return Array.from(this.#sessions.values()).filter((session) => session.filePath === filePath);
  }

  getSessionsByWorkspaceRoot(workspaceRoot: string): PreviewSession[] {
    return Array.from(this.#sessions.values()).filter((session) => session.workspaceRoot === workspaceRoot);
  }

  consumePreviewToken(sessionId: string, token: string | null): PreviewSession | undefined {
    const session = this.#sessions.get(sessionId);
    if (!session || session.previewTokenUsed || !isTokenMatch(session.previewToken, token)) {
      return undefined;
    }

    session.previewTokenUsed = true;
    return session;
  }
}

export function randomToken(): string {
  return createServerToken();
}