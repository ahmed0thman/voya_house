import { z } from "zod";

/** A brand's URL slug, as used by the public menu booklets. */
export const brandSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Unknown menu");
