/**
 * Base URL for the shared paperz.pk API server.
 * Derived from EXPO_PUBLIC_DOMAIN (injected by scripts/build.js and the dev script).
 */
const domain = process.env.EXPO_PUBLIC_DOMAIN;

export const apiBaseUrl = domain ? `https://${domain}` : "";
