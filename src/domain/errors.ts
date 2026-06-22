export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFIG_ERROR: "CONFIG_ERROR",
  RUNTIME_ERROR: "RUNTIME_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly cause?: unknown;

  constructor(code: ErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.cause = cause;
  }
}

export function getExitCodeForError(code: ErrorCode): 1 | 2 {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.CONFIG_ERROR:
      return 2;
    case ErrorCode.RUNTIME_ERROR:
    case ErrorCode.UNKNOWN_ERROR:
      return 1;
  }
}
