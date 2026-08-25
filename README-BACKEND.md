# Backend Setup — Control Board Foundation

This covers what was just built: the database, storage, and server-action layer
for managing **categories** and **items**. Nothing here is wired into the
public landing page yet — the control board UI itself is a separate, later
step.

## Stack

| Concern | Choice |
|---|---|
| Database | Postgres (local now, Neon-ready for staging/prod) |
| ORM | Prisma 7 (new TS query-compiler client, driver adapter required) |
| Object storage | Cloudflare R2, signed via `aws4fetch` (not the AWS SDK) |
| Validation | Zod v4 |
| Forms | React Hook Form (+ `@hookform/resolvers`) |
| Server state | TanStack Query — every read/write goes through `useQuery`/`useMutation`, never `useEffect` |
| Mutations/reads | Next.js Server Actions, called directly as query/mutation functions |
| UI kit | shadcn/ui (Base UI primitives, `base-nova` preset) — components added, no screens built yet |

## What exists right now

```
prisma/schema.prisma          Brand, Category, Item models
prisma/seed.ts                 seeds the 3 brands (coffee/papa/mama)
src/lib/prisma.ts              Prisma client singleton (server-only)
src/lib/storage/r2.ts          R2 presign/delete/resolve-url helpers (server-only)
src/lib/validations/*.ts       Zod schemas (category, item, upload)
src/lib/action-error.ts        Typed error class for server actions
src/lib/slug.ts                Title -> URL-safe slug helper
src/server/actions/brands.ts   listBrands() — read-only for now
src/server/actions/categories.ts   CRUD + reorder
src/server/actions/items.ts        CRUD + reorder
src/server/actions/uploads.ts      presigned R2 upload URL + delete
src/hooks/use-*.ts             React Query hooks wrapping the actions above
src/components/providers/query-provider.tsx   QueryClientProvider (not mounted anywhere yet)
src/components/ui/*            shadcn primitives (button, input, form/field, table, dialog, etc.)
```

**Brand is intentionally minimal.** It exists because categories need a
parent, but there's no brand CRUD yet — just the 3 seeded rows matching the
existing `coffee` / `papa` / `mama` booklets.

**Auth is in.** `/control/*` is session-gated — see the
[Authentication](#authentication) section below.

## Local development

A local Postgres 18 (installed via Homebrew, already running on your machine)
now has a dedicated `voya` database — I didn't touch your other local
databases (`backend_course`, `nestdb`).

```bash
npm run db:migrate    # create/apply a new migration after editing schema.prisma
npm run db:seed       # re-run the brand seed (safe — it's an upsert)
npm run db:studio     # visual DB browser at localhost:5555
npm run db:generate   # regenerate the Prisma client (also runs automatically on npm install)
```

`.env` already points at the local DB:
```
DATABASE_URL="postgresql://ahmedhisham@localhost:5432/voya?schema=public"
```

## Moving the database to Neon (staging/prod)

1. Go to https://neon.tech, sign in (GitHub SSO is easiest), and create a
   project. Pick a region close to wherever you'll deploy (e.g. Vercel's
   region).
2. In the Neon console, open **Connection Details** and copy the **pooled**
   connection string (the one with `-pooler` in the hostname) — that's the
   one safe to use from a serverless/Node runtime with lots of short-lived
   connections. It looks like:
   ```
   postgresql://<user>:<password>@ep-xxxx-pooler.<region>.aws.neon.tech/<db>?sslmode=require
   ```
3. Set that as `DATABASE_URL` in your deployment environment (Vercel project
   settings, etc.) — **don't** commit it.
4. Run `npx prisma migrate deploy` against it once (from CI or locally with
   `DATABASE_URL` temporarily pointed at Neon) to apply the same migrations
   you already generated locally. Then `npx prisma db seed` once to seed the
   3 brands.

No code changes needed — `@prisma/adapter-pg` talks to Neon over the same
Postgres wire protocol it uses locally.

## Setting up Cloudflare R2 (object storage for item images)

1. In the Cloudflare dashboard, go to **R2 Object Storage** → **Create
   bucket**. Name it e.g. `voya-assets`. Region: Automatic.
2. **Get your Account ID**: it's shown on the R2 overview page (right-hand
   side), a 32-character hex string. → `CLOUDFLARE_R2_ACCOUNT_ID`
3. **Create API credentials**: R2 → **Manage API tokens** → **Create API
   token**. Scope it to "Object Read & Write" and (ideally) restrict it to
   the `voya-assets` bucket only. Save the **Access Key ID** and **Secret
   Access Key** it shows you (the secret is shown once). →
   `CLOUDFLARE_R2_ACCESS_KEY_ID` / `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
4. **Make images publicly readable** — pick one:
   - Quick/dev: bucket → **Settings** → **Public Access** → enable the
     `r2.dev` subdomain. You'll get a URL like
     `https://pub-xxxxxxxx.r2.dev`. → `CLOUDFLARE_R2_PUBLIC_URL`
   - Production: bucket → **Settings** → **Custom Domains** → connect a
     subdomain you own (e.g. `assets.voyahouse.com`) through Cloudflare DNS.
     Use that as `CLOUDFLARE_R2_PUBLIC_URL` instead.
5. Fill in `.env`:
   ```
   CLOUDFLARE_R2_ACCOUNT_ID="..."
   CLOUDFLARE_R2_ACCESS_KEY_ID="..."
   CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
   CLOUDFLARE_R2_BUCKET_NAME="voya-assets"
   CLOUDFLARE_R2_PUBLIC_URL="https://pub-xxxxxxxx.r2.dev"
   CLOUDFLARE_R2_MAX_STORAGE_GB="9"   # optional, see below
   ```

Until these are set, `requestItemImageUpload`/`deleteItemImage` (and any item
with images) will throw a clear "object storage is not configured" error
rather than failing silently — categories/items without images work fine
without any of this.

**How uploads work:** the control board asks `requestItemImageUpload({
fileName, contentType, fileSize })` for a presigned PUT URL, then the browser
uploads the file straight to R2 (never through our server) — the same
`Content-Type` used to request the URL must be sent on the PUT, since it's
part of the signed request.

### Staying on the free tier (no surprise charges)

Cloudflare requires a card on file to enable R2 at all, even for free-tier
usage — that's unavoidable at the platform level. But Cloudflare has **no
built-in hard cutoff** for R2; only usage *alerts* (emails you, doesn't stop
anything). So the app enforces its own cap instead:

- Every upload request first lists the bucket's actual current usage (a live
  `ListObjectsV2` call — not a cached counter, so it can't drift) and refuses
  the upload with a clear error if it would push the bucket over
  `CLOUDFLARE_R2_MAX_STORAGE_GB` (defaults to 9 GiB, a safety margin under
  R2's 10 GiB/month free tier).
- Each individual file is also capped at 5 MB (`MAX_IMAGE_FILE_SIZE_BYTES` in
  `src/lib/validations/upload.ts`), checked both client- and server-side, so
  one large photo can't eat the whole budget at once.
- R2's *operation* limits (1M writes / 10M reads per month, also free) aren't
  separately guarded — a restaurant menu control board is nowhere near that
  volume, so it wasn't worth the added complexity.

This guarantees the app itself never pushes you into paid usage through
normal use. It doesn't protect against someone uploading directly to the
bucket through another tool, outside this app — for that, Cloudflare's own
usage notifications (dashboard → Notifications → add one for R2) are worth
turning on as a second, informational layer.

## Authentication

Session-based, not JWT — a `Session` row per login, not a self-contained
token. This means instant revocation (delete the row, they're logged out)
and no signing-secret key management, at the cost of a DB read per request —
a non-issue at this app's scale.

- `src/lib/session.ts` — token generation (`crypto.randomBytes`, base64url)
  and validation. Only the token's **SHA-256 hash** is stored in the
  `sessions` table; the raw token lives solely in an httpOnly cookie, so a
  leaked DB row can't be replayed as a session.
- **7-day sliding expiry.** Any validated request within a day of expiry
  pushes `expiresAt` back out another 7 days. The cookie itself is set with a
  30-day Max-Age as a safety ceiling — `expiresAt` in the database is the
  real gate (a Server Component render is allowed to update the DB row, but
  Next.js forbids updating the cookie itself outside a Server Action).
- `src/lib/password.ts` — passwords are hashed with Node's built-in `scrypt`
  (stdlib, no extra dependency), not bcrypt/argon2.
- `src/lib/dal.ts` — `requireUser()` / `requireAdmin()`, called at the top of
  every control-board Server Action and in the relevant page/layout. This is
  the actual security boundary.
- `src/proxy.ts` — Next 16 renamed `middleware.ts` to `proxy.ts`. This one
  only does an **optimistic** check (cookie presence, no DB hit) to redirect
  signed-out visitors away from `/control/*` before any page renders; it is
  not the real gate, per Next's own guidance that Proxy shouldn't be the
  only line of defense.
- **Roles**: `ADMIN` and `STAFF`, a fixed Postgres enum (not free text).
  Staff can sign in and manage the Dashboard/Menu; `/control/users` and
  `/control/settings` redirect Staff back to the dashboard (`requireAdmin()`
  in both the page and its backing Server Actions).

No self-serve signup, no password reset, no "log out everywhere" — accounts
are created by an Admin from the Users page. Expired session rows aren't
swept by a cron job; they just get skipped as invalid until whoever wrote
the row logs in again and any *unrelated* session happens to be validated
past its refresh threshold. At this app's traffic that's not worth building
yet, but it's the first thing to add if the `sessions` table ever grows
noticeably.

## What I deliberately did not do

- No brand CRUD — only the 3 seeded rows exist; categories reference them by
  ID.
- No drag-and-drop reordering — categories/items use simple up/down buttons
  instead, to avoid pulling in a DnD library for v1.
