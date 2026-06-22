import type { ErrorCode } from "../../domain/errors.js";

export function formatJsonSuccess<T>(data: T): string {
  return JSON.stringify({ ok: true, data }, null, 2);
}

export function formatJsonError(code: ErrorCode, message: string): string {
  return JSON.stringify({ ok: false, error: { code, message } }, null, 2);
}
