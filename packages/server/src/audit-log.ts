export type SecurityEvent = {
  type:
    | "blocked_request"
    | "invalid_control_token"
    | "invalid_preview_token"
    | "invalid_websocket_token"
    | "invalid_export_token"
    | "invalid_draft_token"
    | "blocked_code_chunk";
  sessionId?: string;
  workspaceRoot?: string;
  reason: string;
};

export function logSecurityEvent(event: SecurityEvent): void {
  const context = [
    event.sessionId ? `session=${event.sessionId}` : undefined,
    event.workspaceRoot ? `workspace=${event.workspaceRoot}` : undefined
  ].filter(Boolean).join(" ");
  const suffix = context ? ` ${context}` : "";

  console.warn(`[zed-mpe] security ${event.type}: ${event.reason}${suffix}`);
}