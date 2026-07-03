---
name: Unscoped router.use() middleware intercepts unrelated routes
description: Express router.use(middleware) with no path arg applies to every request reaching that router, not just its own routes — dangerous when routers are flat-mounted with no prefix.
---

When multiple Express routers are mounted flat (no path prefix) on a parent router via `router.use(subRouter)`, a call like `subRouter.use(attachUser, requireSchool)` inside one sub-router (with no path argument) intercepts **every** request that reaches that point in the middleware chain — including requests destined for routers mounted later, not just that router's own paths (e.g. `/teachers/*`).

**Why:** This caused super_admin users (who by design have `schoolId: null`) to get falsely blocked with 403 "School membership required" on `/admin/*` routes, because an earlier-mounted router (`teachers.ts`) had `router.use(attachUser, requireSchool)` with no path scoping, and it ran before the request ever reached the correctly-guarded `adminRouter`.

**How to apply:** Whenever routers are flat-mounted (no `app.use("/prefix", subRouter)`), always scope any `router.use(middleware)` call to explicit path(s) matching that router's own routes, e.g. `router.use("/teachers", attachUser, requireSchool)` or `router.use(["/classes","/subjects"], ...)`. Audit for this pattern whenever a role/permission check on one route (like an admin route) is being unexpectedly rejected for reasons that belong to a different route/domain (like school membership) — the real culprit is often an unrelated router earlier in the mount order.
