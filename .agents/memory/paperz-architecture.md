---
name: paperz.pk architecture
description: Key structural facts and non-obvious conventions for the paperz.pk exam-paper maker.
---

# paperz.pk

Multi-tenant school exam-paper maker. pnpm monorepo. Stack: React+Vite+Tailwind
(artifacts/web), Express 5 (artifacts/api-server), PostgreSQL+Drizzle (lib/db),
Clerk auth. 3 roles: super_admin / school_admin / teacher; every row is scoped by
schoolId.

## API contract is codegen'd — never hand-edit generated clients
- Source of truth: `lib/api-spec/openapi.yaml`.
- After editing the spec run `pnpm --filter @workspace/api-spec run codegen`
  (orval → regenerates `@workspace/api-zod` request/response zod + query keys, and
  `@workspace/api-client-react` hooks; then runs `typecheck:libs`).
- Adding a field to a request schema = spec edit + codegen, THEN wire backend + UI.

## API base path (do NOT "fix" this)
- Web calls relative `/api/...` and deliberately does NOT call `setBaseUrl`.
- The api-server artifact owns the `/api` prefix via the shared proxy; prepending
  the web BASE_URL would break routing. Reviewers have flagged this as a false
  positive before.

## Tenant isolation
- **Why:** cross-school data access is the main security risk in this app.
- **How to apply:** any route accepting class/subject/chapter/topic/question IDs
  must verify they belong to the caller's schoolId before use. Helpers:
  `lib/ownership.ts` (ownsClassSubject, ownsQuestionIds) and questions.ts
  `ownsTaxonomy`.

## Plan limits are enforced from onboarding
- Packages seeded at startup (`lib/seed.ts` seedPlatformPackages). Onboarding
  (`routes/session.ts`) auto-assigns the cheapest active package as an active
  subscription so `lib/limits.ts` enforceLimit() caps apply immediately.
- enforceLimit treats "no active subscription" or null cap as unlimited — so the
  onboarding auto-assign is what makes gating real. Don't remove it.

## api-server build/runtime
- Bundled with esbuild (`build.mjs`), not tsc emit; puppeteer externalized.
- Node 24: tests use built-in `node:test`, run with `node --test src/lib/*.test.ts`
  (`pnpm --filter @workspace/api-server test`). Test files import with explicit
  `.ts` extension and are excluded from tsconfig `include` to keep tsc build clean.
- PDF default logo read from `attached_assets/` at runtime via cwd candidate paths
  (cwd is the package dir; the working candidate is `../../attached_assets`).
