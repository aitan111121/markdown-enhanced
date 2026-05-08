import { randomBytes, timingSafeEqual } from "node:crypto";

export function createServerToken(byteLength = 32): string {
  if (!Number.isInteger(byteLength) || byteLength < 16) {
    throw new Error("Security tokens must use at least 16 random bytes");
  }

  return randomBytes(byteLength).toString("base64url");
}

export function isTokenMatch(expected: string, actual: string | null | undefined): boolean {
  if (typeof actual !== "string" || actual.length === 0) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}