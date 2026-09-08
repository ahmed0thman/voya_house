export type ActionErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  /** Never thrown by app code — what `defineAction` reports when it catches a real bug. */
  | "UNEXPECTED";

/** Per-field messages keyed by field name, in the shape Zod's `flattenError` produces. */
export type FieldErrors = Record<string, string[] | undefined>;

/**
 * Expected, user-facing failures. Thrown inside a `defineAction` handler on the
 * server, where the wrapper converts it to a plain result object — throwing is
 * *not* how it reaches the browser, since React scrubs thrown Server Action
 * errors to an opaque digest in production builds. `unwrap()` re-throws it on
 * the client so `error.message` stays readable at every call site.
 */
export class ActionError extends Error {
  code: ActionErrorCode;
  /** Set when the failure belongs to specific inputs, so a form can highlight them. */
  fieldErrors?: FieldErrors;

  constructor(
    message: string,
    code: ActionErrorCode = "VALIDATION",
    fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "ActionError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
