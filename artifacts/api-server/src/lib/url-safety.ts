import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * SSRF protections for user-supplied logo URLs that the server (or a
 * headless browser it controls) may fetch. Only https/http URLs that
 * resolve exclusively to public addresses are allowed; data: image URIs
 * are allowed as-is. Anything pointing at loopback, private, link-local,
 * or otherwise reserved ranges is rejected.
 */

function ipv4ToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let long = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    long = long * 256 + n;
  }
  return long >>> 0;
}

function inRange(ip: number, base: string, bits: number): boolean {
  const baseLong = ipv4ToLong(base);
  if (baseLong == null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ip & mask) === (baseLong & mask);
}

function isPrivateIpv4(ip: string): boolean {
  const long = ipv4ToLong(ip);
  if (long == null) return true; // treat unparseable as unsafe
  return (
    inRange(long, "0.0.0.0", 8) ||
    inRange(long, "10.0.0.0", 8) ||
    inRange(long, "100.64.0.0", 10) ||
    inRange(long, "127.0.0.0", 8) ||
    inRange(long, "169.254.0.0", 16) ||
    inRange(long, "172.16.0.0", 12) ||
    inRange(long, "192.0.0.0", 24) ||
    inRange(long, "192.168.0.0", 16) ||
    inRange(long, "198.18.0.0", 15) ||
    inRange(long, "224.0.0.0", 4) ||
    inRange(long, "240.0.0.0", 4)
  );
}

function isPrivateIpv6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0]; // strip zone id
  if (addr === "::1" || addr === "::") return true;
  // IPv4-mapped (::ffff:a.b.c.d) — evaluate the embedded IPv4.
  const mapped = addr.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  // Unique local (fc00::/7) and link-local (fe80::/10).
  if (/^f[cd]/.test(addr)) return true;
  if (/^fe[89ab]/.test(addr)) return true;
  // Multicast (ff00::/8).
  if (/^ff/.test(addr)) return true;
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) return isPrivateIpv4(ip);
  if (kind === 6) return isPrivateIpv6(ip);
  return true; // not a valid IP → treat as unsafe
}

export function isImageDataUri(value: string): boolean {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value.trim());
}

/**
 * Returns true if the given http(s) URL is safe to fetch server-side:
 * valid protocol, and every DNS-resolved address is a public IP.
 */
export async function isSafeHttpUrl(raw: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname;
  if (!host) return false;

  // If the host is an IP literal, check it directly.
  if (net.isIP(host)) return !isPrivateIp(host);

  // Reject obvious localhost aliases before resolving.
  const lower = host.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) return false;

  try {
    const addresses = await lookup(host, { all: true });
    if (!addresses.length) return false;
    return addresses.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

/**
 * Validates a user-supplied logo URL before persistence.
 * Returns an error message if unsafe, otherwise null.
 * Empty/null values and image data URIs are always allowed.
 */
export async function validateLogoUrl(
  raw?: string | null,
): Promise<string | null> {
  if (raw == null || raw.trim() === "") return null;
  const value = raw.trim();
  if (isImageDataUri(value)) return null;
  if (/^data:/i.test(value)) {
    return "Only image data URIs are allowed for the logo.";
  }
  if (!/^https?:/i.test(value)) {
    return "Logo URL must be an https/http address or an image data URI.";
  }
  const safe = await isSafeHttpUrl(value);
  if (!safe) {
    return "That logo URL could not be verified as a safe public address.";
  }
  return null;
}
