import type { IncomingMessage } from "node:http";
import { DEFAULT_HOST } from "./contracts.js";

const LOCAL_HOSTNAMES = new Set([DEFAULT_HOST, "localhost", "[::1]", "::1"]);

export function assertAllowedBindHost(host: string): void {
  if (host !== DEFAULT_HOST) {
    throw new Error(`Public bind is disabled by default. Use ${DEFAULT_HOST}.`);
  }
}

export function isAllowedRequest(request: IncomingMessage): boolean {
  return isAllowedHostHeader(request.headers.host) && isAllowedOriginHeader(request.headers.origin);
}

export function isAllowedHostHeader(value: string | string[] | undefined): boolean {
  if (typeof value !== "string" || value.trim() === "") {
    return false;
  }

  try {
    const host = new URL(`http://${value}`).hostname;
    return LOCAL_HOSTNAMES.has(host);
  } catch {
    return false;
  }
}

export function isAllowedOriginHeader(value: string | string[] | undefined): boolean {
  if (typeof value === "undefined") {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  try {
    const origin = new URL(value);
    return (origin.protocol === "http:" || origin.protocol === "https:") && isAllowedHostHeader(origin.host);
  } catch {
    return false;
  }
}