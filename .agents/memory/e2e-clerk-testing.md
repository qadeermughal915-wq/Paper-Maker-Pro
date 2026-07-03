---
name: e2e testing Clerk apps
description: How to correctly drive runTest against a Clerk-authenticated app without dead-ending in Google OAuth.
---

`runTest` must be called with `testClerkAuth: true` when the app uses Clerk auth. When this flag is omitted, a test plan step like `[Clerk Auth] Sign in as {...}` gets executed by literally interacting with Clerk's real sign-in widget instead of the programmatic test-auth path. In this app the widget defaults to "Continue with Google", so the automated browser gets stuck on Google's OAuth consent/error page ("Couldn't sign you in") and the whole test plan is aborted as "unable".

**Why:** the testing subagent has a separate programmatic Clerk sign-in capability, but it's opt-in per `runTest` call, not auto-detected from the test plan text.

**How to apply:** whenever a test plan includes a `[Clerk Auth] Sign in as ...` step, pass `testClerkAuth: true` alongside `testPlan` in the same `runTest` call. Also note: the `screenshot` tool (`app_preview`) uses its own fresh, unauthenticated browser context — it cannot see the session created inside a `runTest` run, so it will always show the login page for authenticated routes. Rely on the test's own pass/fail + description for authenticated-page verification, not a follow-up `screenshot` call.
