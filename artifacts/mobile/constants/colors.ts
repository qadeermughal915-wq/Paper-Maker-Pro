/**
 * Semantic design tokens for the paperz.pk mobile app.
 *
 * Derived from the sibling web artifact (artifacts/web/src/index.css) so both
 * apps share one visual identity. Web HSL values were converted to hex.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: "#0F172A",
    tint: "#14A6B3",

    // Core surfaces
    background: "#F8FAFC",
    foreground: "#0F172A",

    // Cards / elevated surfaces
    card: "#FFFFFF",
    cardForeground: "#0F172A",

    // Primary action color (teal) — hsl(185 80% 39%)
    primary: "#14A6B3",
    primaryForeground: "#FFFFFF",

    // Subtle primary tint (chips, selected backgrounds)
    primaryTint: "#E6F6F8",

    // Secondary / navy — hsl(217 33% 17%)
    secondary: "#1D283A",
    secondaryForeground: "#FFFFFF",

    // Muted / subdued elements
    muted: "#F1F5F9",
    mutedForeground: "#64748B",

    // Accent highlights
    accent: "#E6F6F8",
    accentForeground: "#0F172A",

    // Destructive actions
    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",

    // Positive / success
    success: "#16A34A",

    // Borders and input outlines
    border: "#E2E8F0",
    input: "#E2E8F0",
  },

  // Border radius (in px). Synced from web --radius: 0.5rem.
  radius: 8,
};

export default colors;
