export type ActionErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED";

/**
 * Thrown by server actions for expected, user-facing failures. React Query
 * surfaces `error.message` directly, so keep messages safe to display.
 */
export class ActionError extends Error {
  code: ActionErrorCode;

  constructor(message: string, code: ActionErrorCode = "VALIDATION") {
    super(message);
    this.name = "ActionError";
    this.code = code;
  }
}
