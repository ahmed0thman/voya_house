import { ActionError, type ActionErrorCode, type FieldErrors } from "@/lib/action-error";

/**
 * What every `defineAction` action returns. Deliberately a plain value rather
 * than a thrown error: React replaces anything *thrown* out of a Server Action
 * with an opaque digest in production builds, so a thrown message that reads
 * fine in `next dev` reaches real users as "Minified React error #441".
 * Returning the failure keeps it intact across the network boundary.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { message: string; code: ActionErrorCode; fieldErrors?: FieldErrors };
    };

/**
 * Unpacks an action result at the call site, throwing on failure so React Query's
 * `onError` (and every `catch`) keeps working exactly as before. The throw happens
 * here — in the browser — so nothing scrubs it.
 */
export async function unwrap<T>(promise: Promise<ActionResult<T>>): Promise<T> {
  const result = await promise;
  if (result.ok) return result.data;
  throw new ActionError(result.error.message, result.error.code, result.error.fieldErrors);
}
