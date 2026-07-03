---
name: Expo Router group routing in the mobile artifact
description: Why the tab screens are not named index, and how the auth/onboarding gate is wired without redirect loops.
---

# Expo Router route layout (mobile artifact)

Route groups in parentheses (`(auth)`, `(home)`, `(tabs)`) are stripped from the
URL. This creates a subtle collision risk.

**Rule:** the authenticated tab screens must be named `dashboard.tsx`,
`questions.tsx`, `papers.tsx`, `settings.tsx` — NOT `index.tsx`.

**Why:** an `app/index.tsx` root gate resolves to `/`. A `(tabs)/index.tsx`
also resolves to `/` (group stripped), which is a hard route collision that
breaks the bundler. Naming the tabs explicitly resolves them to `/dashboard`,
`/questions`, etc., leaving `/` free for the gate.

**How the gate works:**
- `app/index.tsx` reads Clerk `useAuth()` and `<Redirect>`s to `/dashboard`
  (signed in) or `/sign-in` (signed out).
- Auth screens navigate to `/` after finalize; the gate re-evaluates and routes.
- `(home)/_layout.tsx` calls `setAuthTokenGetter(() => getToken())`
  **synchronously during render** (not in `useEffect`) so the token is set
  before any child query observer fires — an effect runs too late and the first
  request goes out unauthenticated (401).
- Onboarding gate lives in `(tabs)/_layout.tsx`: if `me.needsOnboarding`,
  `<Redirect href="/onboarding" />`. `onboarding.tsx` is a `(home)` sibling of
  `(tabs)`, so there is no redirect loop.

**PDF export:** `useGetPaper`'s generated options type requires `queryKey`, so do
not pass `{ query: { enabled } }` — just call `useGetPaper(id)` and handle
`isError`. Download uses `expo-file-system/legacy` `downloadAsync` with a
`Bearer` token header, then `Sharing.shareAsync`.
