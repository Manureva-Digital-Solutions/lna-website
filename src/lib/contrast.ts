/**
 * WCAG 2.1 contrast helpers for LNAW-84 token checks.
 * Ratios use relative luminance (sRGB) per WCAG.
 */

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Parse #RGB / #RRGGBB (case-insensitive). */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/** WCAG contrast ratio between two hex colours (order-independent). */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAa(
  foreground: string,
  background: string,
  { largeText = false }: { largeText?: boolean } = {}
): boolean {
  const min = largeText ? 3 : 4.5;
  return contrastRatio(foreground, background) >= min;
}

/** Brand tokens used by automated LNAW-84 contrast checks. */
export const LNA_A11Y_COLORS = {
  body: "#161616",
  navy: "#14366F",
  white: "#FFFFFF",
  gray10: "#F4F4F4",
  /** Footer surface (Gray 100). */
  gray100: "#161616",
  /** Footer control chrome (Gray 90). */
  gray90: "#262626",
  muted: "#525252",
  primaryForeground: "#FFFFFF",
} as const;
