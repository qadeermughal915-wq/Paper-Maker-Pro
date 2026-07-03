---
name: SSRF on user-supplied URLs fetched server-side
description: Any user-controlled URL that the server or a headless browser fetches must be SSRF-validated.
---

# SSRF: validate user URLs before the server (or Puppeteer) fetches them

**Rule:** when a user-controlled URL is fetched server-side — directly, or by a
headless browser rendering HTML we build (e.g. a logo `<img src>` in a
Puppeteer-generated PDF) — validate it against an allowlist of protocols and block
any host that resolves to a non-public address.

**Why:** an authenticated user could set a logo URL to `http://169.254.169.254/...`
(cloud metadata) or an internal service and make the PDF renderer fetch it — a
classic SSRF. This was a blocking code-review finding on paperz.pk.

**How to apply (see `artifacts/api-server/src/lib/url-safety.ts`):**
- Allow image `data:` URIs as-is; allow only `http(s)` remote URLs.
- Reject if the host is an IP literal in, or DNS-resolves to, any loopback /
  private / link-local / reserved range. Cover IPv4 (incl. 127/8, 10/8, 172.16/12,
  192.168/16, 169.254/16, 100.64/10, 0/8, multicast, reserved), IPv6 (::1, fc00::/7
  ULA, fe80::/10 link-local, IPv4-mapped `::ffff:a.b.c.d`), and `localhost`.
- Apply at BOTH layers: reject unsafe URLs at save time (400) AND re-validate at
  render time, falling back to a safe default if a bad value was somehow persisted
  (defense-in-depth against DNS rebinding / pre-existing rows).
