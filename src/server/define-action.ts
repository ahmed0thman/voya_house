import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { ActionError } from "@/lib/action-error";
import type { ActionResult } from "@/lib/action-result";
import { requireUser, requireAdmin } from "@/lib/dal";
import { checkRateLimit, getClientIp, type RateLimitConfig } from "@/lib/rate-limit";
import type { SessionUser } from "@/lib/session";

/**
 * Who may run the action. `"user"` and `"admin"` delegate to the DAL, which is
 * still the real security boundary — this just moves the call out of every
 * handler's first line so it can't be forgotten.
 */
export type AuthMode = "public" | "user" | "admin";

/** A public action can run signed-out, so only there is `user` nullable. */
type ActionContext<TAuth extends AuthMode> = TAuth extends "public"
  ? { user: SessionUser | null }
  : { user: SessionUser };

type BaseConfig<TAuth extends AuthMode> = {
  auth: TAuth;
  /** Uses the default below unless an action needs a tighter request budget. */
  rateLimit?: RateLimitConfig;
};

/** Applies to every Server Action, including authenticated control-board actions. */
const DEFAULT_RATE_LIMIT: RateLimitConfig = { limit: 60, windowMs: 60_000 };

/** The most useful message for a toast: the first thing that actually failed. */
function firstIssueMessage(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback;
}

export function defineAction<TAuth extends AuthMode, TInput, TOutput>(
  config: BaseConfig<TAuth> & {
    schema: z.ZodType<TInput>;
    handler: (input: TInput, ctx: ActionContext<TAuth>) => Promise<TOutput>;
  },
): (input: TInput) => Promise<ActionResult<TOutput>>;

export function defineAction<TAuth extends AuthMode, TOutput>(
  config: BaseConfig<TAuth> & {
    schema?: undefined;
    handler: (input: undefined, ctx: ActionContext<TAuth>) => Promise<TOutput>;
  },
): () => Promise<ActionResult<TOutput>>;

/**
 * Wraps a Server Action with the three things every one of them needs: an auth
 * check, rate limit, schema validation, and a failure channel that survives a
 * production build. The handler stays free to `throw new ActionError(...)` for
 * expected problems — that's caught here and returned as data.
 */
export function defineAction<TAuth extends AuthMode>(config: BaseConfig<TAuth> & {
  schema?: z.ZodType<unknown>;
  handler: (input: never, ctx: { user: SessionUser | null }) => Promise<unknown>;
}) {
  return async (rawInput?: unknown): Promise<ActionResult<unknown>> => {
    // Only public actions run in the guest's own locale — `/control` never
    // renders in Arabic, and resolving it there risks a stale NEXT_LOCALE
    // cookie (left over from the same browser visiting the guest site)
    // bleeding an Arabic fallback into the staff UI. Admin/user actions keep
    // these two generic fallbacks in English, unconditionally.
    const t = config.auth === "public" ? await getTranslations("errors") : null;

    try {
      // Order matters: authenticate before looking at anything the caller sent.
      const user =
        config.auth === "admin"
          ? await requireAdmin()
          : config.auth === "user"
            ? await requireUser()
            : null;

      const rateLimit = checkRateLimit(
        await getClientIp(),
        config.rateLimit ?? DEFAULT_RATE_LIMIT,
        config,
      );
      if (!rateLimit.allowed) {
        return {
          ok: false,
          error: {
            message: `Too many requests. Please try again in ${Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000))} seconds.`,
            code: "RATE_LIMITED",
          },
        };
      }

      let input = rawInput;
      if (config.schema) {
        const parsed = config.schema.safeParse(rawInput);
        if (!parsed.success) {
          return {
            ok: false,
            error: {
              message: firstIssueMessage(
                parsed.error,
                t ? t("checkDetails") : "Please check the details you entered.",
              ),
              code: "VALIDATION",
              fieldErrors: z.flattenError(parsed.error).fieldErrors,
            },
          };
        }
        input = parsed.data;
      }

      const data = await config.handler(input as never, { user });
      return { ok: true, data };
    } catch (error) {
      // Must come first. `redirect()`, `notFound()` and the request-time APIs
      // (`cookies()`, `headers()`) signal Next.js by *throwing*; swallowing one
      // here would turn an auth redirect into a generic error. Notably
      // `requireUser()`/`requireAdmin()` above redirect exactly this way.
      unstable_rethrow(error);

      if (error instanceof ActionError) {
        return {
          ok: false,
          error: { message: error.message, code: error.code, fieldErrors: error.fieldErrors },
        };
      }

      // A genuine bug. Log it server-side (where the detail is safe) and hand
      // the browser something sayable rather than an opaque React digest.
      console.error("[action] unhandled error:", error);
      return {
        ok: false,
        error: {
          message: t ? t("unexpected") : "Something went wrong on our side. Please try again.",
          code: "UNEXPECTED",
        },
      };
    }
  };
}
