---
name: testClerkAuth actor claim
description: runTest's testClerkAuth sign-in mechanism sets a real Clerk session.actor claim, which collides with any app-level "is this session impersonated" check.
---

`runTest({ testClerkAuth: true })` signs test users in through a mechanism that
itself uses Clerk's actor-token/agent feature. The resulting session has:

```json
{ "sub": "agt_...", "type": "agent", "task_id": "agttsk_..." }
```

populated on `session.actor` (frontend `useSession()`/`useClerk()`) and on
`getAuth(req).actor` (backend, via `@clerk/express`/`@clerk/backend`) — even
for a completely fresh, never-impersonated test user. This is indistinguishable
from a real impersonation session unless you check the claim shape.

**Why:** Clerk's own docs say `session.actor` is only non-null when a user is
impersonated (via `actorTokens.create`), so it's the documented way to detect
impersonation. Real production users signing in through normal UI flows will
never have this claim. But the test harness's own programmatic sign-in
apparently reuses Clerk's actor/agent mechanism to create sessions, which
makes `!!session.actor` produce false positives for every single test user
signed in via `testClerkAuth`, not just intentionally-impersonated ones.

**How to apply:** Any code (frontend hook, backend middleware/route) that
gates behavior on "is this session an impersonation session" must check both
presence AND that it isn't the test harness's own actor:

```ts
const actor = session?.actor as { sub?: string; type?: string } | null | undefined;
const isImpersonating = !!actor && actor.type !== "agent";
```

Apply the same guard on the backend wherever `getAuth(req)?.actor` is used to
gate impersonation-only logic (e.g. a "stop impersonation" endpoint). Confirmed
via direct instrumentation: added a temporary `console.log` in an Express
route reading `getAuth(req)?.actor`, and a temporary DOM element rendering
`JSON.stringify(session?.actor)` — both showed the claim was absent when
signing in with plain curl-created Clerk users but present with `type:"agent"`
when signed in through `runTest`'s `testClerkAuth`.
