import { ZodError } from "zod";
import { DomainError, ErrorCode, getExitCodeForError } from "../../domain/errors.js";

export type CliError = {
  code: ErrorCode;
  message: string;
  exitCode: 1 | 2;
};

export function toCliError(error: unknown): CliError {
  if (error instanceof DomainError) {
    return {
      code: error.code,
      message: error.message,
      exitCode: getExitCodeForError(error.code),
    };
  }

  if (error instanceof ZodError) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: error.issues.map((issue) => issue.message).join("; "),
      exitCode: 2,
    };
  }

  if (error instanceof Error) {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
      exitCode: 1,
    };
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: "Unknown error",
    exitCode: 1,
  };
}
