---
name: Clerk causes blank prod page when proxyUrl/publishableKeyFromHost missing
description: Diagnosing an indefinite blank white screen on a published Replit-managed-Clerk app
---

If a published Replit-managed-Clerk web app returns HTTP 200 for `/`, its JS/CSS assets load fine, but the rendered page is a blank white/gray screen with no console error, suspect `ClerkProvider` hanging during init rather than a build/deploy failure.

**Why:** the raw Clerk publishable key encodes a `clerk.<app-domain>` Frontend API host, but that raw subdomain is not meant to be hit directly in production — Replit's managed-Clerk setup routes browser↔Clerk traffic through the app's own `/api/__clerk` proxy path instead. If the client's `<ClerkProvider>` is missing `proxyUrl` (and/or uses the raw `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` instead of `publishableKeyFromHost`), the SDK tries to reach the raw `clerk.*` subdomain directly, which 502s, and the provider never resolves — so the app just spins forever with nothing rendered and no thrown error.

**How to apply:** confirm the raw `clerk.<domain>/v1/environment` returns non-200 (502 is expected/normal — it's not meant to be reachable directly), then diff the app's `ClerkProvider` wiring against the clerk-auth skill's canonical `setup-and-customization.md` snippet. The fix is almost always missing `proxyUrl={import.meta.env.VITE_CLERK_PROXY_URL}` and/or missing `publishableKeyFromHost(window.location.hostname, ...)` for the `publishableKey` prop.
