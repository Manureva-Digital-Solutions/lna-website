import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PricingContent } from "./pricing-content";
import { renderWithIntl } from "@/test/render";
import { registerUrl } from "@/lib/app-urls";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

describe("PricingContent CTAs", () => {
  it("renders comparison category rows without unkeyed fragments", () => {
    const { container } = renderWithIntl(<PricingContent />);
    const categoryCells = container.querySelectorAll("tbody td[colspan='5']");
    expect(categoryCells.length).toBeGreaterThan(0);
    // Categories should be unique table section labels from the catalog.
    const labels = [...categoryCells].map((el) => el.textContent?.trim());
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("routes self-serve tier trials to register with plan + annual billing by default", () => {
    renderWithIntl(<PricingContent />);

    const trialLinks = screen.getAllByRole("link", {
      name: en.pricing.tiers.starter.cta,
    });
    // Starter, Professional, High share the same CTA label.
    expect(trialLinks).toHaveLength(3);
    expect(trialLinks[0]).toHaveAttribute(
      "href",
      registerUrl({ plan: "starter", billing: "annual" })
    );
    expect(trialLinks[1]).toHaveAttribute(
      "href",
      registerUrl({ plan: "professional", billing: "annual" })
    );
    expect(trialLinks[2]).toHaveAttribute(
      "href",
      registerUrl({ plan: "high", billing: "annual" })
    );
  });

  it("keeps Contact Sales on /contact (tier + final CTA)", () => {
    renderWithIntl(<PricingContent />);

    const salesLinks = screen.getAllByRole("link", {
      name: en.pricing.tiers.enterprise.cta,
    });
    expect(salesLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of salesLinks) {
      expect(link).toHaveAttribute("href", "/contact");
    }
  });

  it("sends the final free-trial CTA to register with the current billing period", () => {
    renderWithIntl(<PricingContent />);

    expect(
      screen.getByRole("link", { name: en.pricing.cta.buttonTrial })
    ).toHaveAttribute("href", registerUrl({ billing: "annual" }));
  });

  it("updates register hrefs when switching to monthly billing", async () => {
    const user = userEvent.setup();
    renderWithIntl(<PricingContent />);

    await user.click(
      screen.getByRole("button", { name: en.pricing.billing.monthly })
    );

    const trialLinks = screen.getAllByRole("link", {
      name: en.pricing.tiers.starter.cta,
    });
    expect(trialLinks[0]).toHaveAttribute(
      "href",
      registerUrl({ plan: "starter", billing: "monthly" })
    );
    expect(trialLinks[1]).toHaveAttribute(
      "href",
      registerUrl({ plan: "professional", billing: "monthly" })
    );
    expect(trialLinks[2]).toHaveAttribute(
      "href",
      registerUrl({ plan: "high", billing: "monthly" })
    );
    expect(
      screen.getByRole("link", { name: en.pricing.cta.buttonTrial })
    ).toHaveAttribute("href", registerUrl({ billing: "monthly" }));

    // Contact Sales stays on the sales form.
    for (const link of screen.getAllByRole("link", {
      name: en.pricing.tiers.enterprise.cta,
    })) {
      expect(link).toHaveAttribute("href", "/contact");
    }
  });

  it("uses FR CTA labels and the same register destinations", () => {
    renderWithIntl(<PricingContent />, { locale: "fr" });

    const trialLinks = screen.getAllByRole("link", {
      name: fr.pricing.tiers.starter.cta,
    });
    expect(trialLinks).toHaveLength(3);
    expect(trialLinks[0]).toHaveAttribute(
      "href",
      registerUrl({ plan: "starter", billing: "annual" })
    );
    expect(trialLinks[1]).toHaveAttribute(
      "href",
      registerUrl({ plan: "professional", billing: "annual" })
    );
    expect(trialLinks[2]).toHaveAttribute(
      "href",
      registerUrl({ plan: "high", billing: "annual" })
    );

    expect(
      screen.getByRole("link", { name: fr.pricing.cta.buttonTrial })
    ).toHaveAttribute("href", registerUrl({ billing: "annual" }));

    for (const link of screen.getAllByRole("link", {
      name: fr.pricing.tiers.enterprise.cta,
    })) {
      expect(link).toHaveAttribute("href", "/contact");
    }
  });
});
