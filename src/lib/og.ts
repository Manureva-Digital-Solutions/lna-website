/**
 * Site-wide locale share cards (LNAW-122).
 * Blog posts keep their own ogImage when set.
 */
export function localeOgImagePath(locale: string): string {
  return locale === "en"
    ? "/brand/og-en-1200x630.png"
    : "/brand/og-fr-1200x630.png";
}
