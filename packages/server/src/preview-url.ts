import { DEFAULT_HOST } from "./contracts.js";

export function buildPreviewUrl(input: {
  port: number;
  sessionId: string;
  token: string;
  host?: string;
}): string {
  const host = input.host ?? DEFAULT_HOST;
  const params = new URLSearchParams({ token: input.token });
  return `http://${host}:${input.port}/preview/${input.sessionId}?${params.toString()}`;
}