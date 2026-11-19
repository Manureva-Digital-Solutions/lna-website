// The product app lives on the product domain. This used to fall back to the
// legacy `lna.manurevasolutions.com`, which meant the vitrine's register/login
// links sent visitors to the host we are retiring (LAUNCH-01 blocker B1).
// Keep this in step with the app's own APP_URL.
const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.lnaflow.com";

/** Liens vers l'app produit. Absolus : ils sortent du site vitrine. LinkButton utilise
 *  désormais le Link localisé de next-intl ; les URL absolues le traversent sans
 *  préfixe de locale (vérifié sur le build de prod pour LNA-297). */
export const appUrls = {
  register: APP_BASE + "/register",
  login: APP_BASE + "/login",
} as const;

/** Self-serve tiers that map to the product app's PlanTier query values. */
export const registerPlans = ["starter", "professional", "high"] as const;
export type RegisterPlan = (typeof registerPlans)[number];
export type RegisterBilling = "monthly" | "annual";

const planQueryValue: Record<RegisterPlan, string> = {
  starter: "STARTER",
  professional: "PROFESSIONAL",
  high: "HIGH",
};

/**
 * Registration URL with optional plan / billing preselection for the product app.
 * Keeps the chosen pricing tier across the vitrine → app handoff.
 */
export function registerUrl(options?: {
  plan?: RegisterPlan;
  billing?: RegisterBilling;
}): string {
  if (!options?.plan && !options?.billing) {
    return appUrls.register;
  }

  const url = new URL(appUrls.register);
  if (options.plan) {
    url.searchParams.set("plan", planQueryValue[options.plan]);
  }
  if (options.billing) {
    url.searchParams.set("billing", options.billing);
  }
  return url.toString();
}
