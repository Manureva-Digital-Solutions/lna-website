import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Footer } from "@/components/layout/footer";
import { renderWithIntl } from "@/test/render";
import { appUrls } from "@/lib/app-urls";
import { openCookiePreferences } from "@/components/integrations/CookieConsent";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

vi.mock("next/image", () => ({
  default: ({
    alt,
    ...props
  }: {
    alt: string;
    src: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

describe("Footer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps EN/FR footer + cookieSettings + langsel keys in parity", () => {
    const enKeys = Object.keys(en.footer).sort();
    const frKeys = Object.keys(fr.footer).sort();
    expect(frKeys).toEqual(enKeys);

    expect(en.footer.cookieSettings).toBe("Cookie settings");
    expect(fr.footer.cookieSettings).toBe("Gérer les cookies");
    expect(en.languageSwitcher.english).toBe("English");
    expect(en.languageSwitcher.francais).toBe("Français");
    expect(fr.languageSwitcher.english).toBe("English");
    expect(fr.languageSwitcher.francais).toBe("Français");
    expect(en.newsletter.error).toBeTruthy();
    expect(fr.newsletter.error).toBeTruthy();
  });

  it("renders Gray 100 band, EN columns, cookie settings, and no social icons", () => {
    renderWithIntl(<Footer />);

    const footer = document.querySelector("[data-footer]") as HTMLElement;
    expect(footer).not.toBeNull();
    expect(footer).toHaveClass("bg-gray-100");
    expect(footer).toHaveClass("text-gray-30");

    const cols = footer.querySelector("[data-footer-link-cols]") as HTMLElement;
    expect(cols).toHaveClass("contents");

    const copy = en.footer;
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText(copy.stayUpdated)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: copy.product })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: copy.company })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: copy.legal })
    ).toBeInTheDocument();

    const product = screen.getByRole("heading", { name: copy.product })
      .parentElement as HTMLElement;
    const company = screen.getByRole("heading", { name: copy.company })
      .parentElement as HTMLElement;
    const legal = screen.getByRole("heading", { name: copy.legal })
      .parentElement as HTMLElement;
    // Frozen v4: Product c9-11, Company c11-13, Legal c13-17; ≤671 Product|Company span-2.
    expect(product.className).toMatch(/min-\[1056px\]:col-start-9/);
    expect(product.className).toMatch(/min-\[1056px\]:col-span-2/);
    expect(company.className).toMatch(/min-\[1056px\]:col-start-11/);
    expect(legal.className).toMatch(/min-\[1056px\]:col-start-13/);
    expect(legal.className).toMatch(/col-span-full/);
    expect(product.className).toMatch(/col-span-2/);
    expect(company.className).toMatch(/col-span-2/);

    expect(screen.getByRole("link", { name: copy.features })).toHaveAttribute(
      "href",
      "/features"
    );
    expect(screen.getByRole("link", { name: copy.pricing })).toHaveAttribute(
      "href",
      "/pricing"
    );
    expect(screen.getByRole("link", { name: copy.blog })).toHaveAttribute(
      "href",
      "/blog"
    );
    expect(screen.getByRole("link", { name: copy.signIn })).toHaveAttribute(
      "href",
      appUrls.login
    );
    expect(screen.getByRole("link", { name: copy.about })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(screen.getByRole("link", { name: copy.contact })).toHaveAttribute(
      "href",
      "/contact"
    );
    expect(
      screen.getByRole("link", { name: copy.privacyPolicy })
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: copy.termsOfService })
    ).toHaveAttribute("href", "/terms");
    expect(
      within(legal).getByRole("link", { name: copy.legalNotice })
    ).toHaveAttribute("href", "/legal-notice");
    expect(screen.getByRole("link", { name: copy.security })).toHaveAttribute(
      "href",
      "/security"
    );
    expect(screen.getByRole("link", { name: copy.dpa })).toHaveAttribute(
      "href",
      "/dpa"
    );
    expect(
      screen.getByRole("link", { name: copy.subProcessors })
    ).toHaveAttribute("href", "/sub-processors");

    expect(
      within(footer).getByRole("link", { name: copy.privacy })
    ).toHaveAttribute("href", "/privacy");
    expect(
      within(footer).getByRole("link", { name: copy.terms })
    ).toHaveAttribute("href", "/terms");
    expect(
      within(footer)
        .getAllByRole("link", { name: copy.legalNoticeShort })
        .some((el) => el.getAttribute("href") === "/legal-notice")
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: copy.cookieSettings })
    ).toBeInTheDocument();
    expect(screen.getByText(copy.copyright)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: en.newsletter.subscribe })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(en.newsletter.emailLabel)).toHaveAttribute(
      "placeholder",
      en.newsletter.emailPlaceholder
    );

    expect(screen.queryByLabelText("LinkedIn")).toBeNull();
    expect(screen.queryByLabelText("X")).toBeNull();
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(footer.querySelectorAll('a[href*="linkedin"]').length).toBe(0);
    expect(footer.querySelectorAll('a[href*="twitter"]').length).toBe(0);
    expect(footer.querySelectorAll('a[href*="x.com"]').length).toBe(0);

    expect(
      screen.getByRole("button", { name: en.languageSwitcher.label })
    ).toHaveAttribute("aria-haspopup", "listbox");
  });

  it("opens the language menu with English and Français options", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Footer />);

    await user.click(
      screen.getByRole("button", { name: en.languageSwitcher.label })
    );

    expect(
      screen.getByRole("option", { name: en.languageSwitcher.english })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("option", { name: en.languageSwitcher.francais })
    ).toHaveAttribute("aria-selected", "false");
  });

  it("renders matching FR labels including cookie settings and newsletter", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Footer />, { locale: "fr" });

    const copy = fr.footer;
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText(copy.stayUpdated)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: copy.product })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: copy.company })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: copy.legal })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.cookieSettings })
    ).toHaveTextContent(copy.cookieSettings);
    expect(screen.getByText(copy.copyright)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: fr.newsletter.subscribe })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: fr.languageSwitcher.label })
    );
    expect(
      screen.getByRole("option", { name: fr.languageSwitcher.francais })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("option", { name: fr.languageSwitcher.english })
    ).toBeInTheDocument();
  });

  it("opens cookie preferences when Cookie settings is activated", async () => {
    const user = userEvent.setup();
    localStorage.setItem("lna-cookie-consent", "all");

    const openSpy = vi.fn();
    window.addEventListener("cookie-consent-open", openSpy);

    renderWithIntl(<Footer />);
    await user.click(
      screen.getByRole("button", { name: en.footer.cookieSettings })
    );

    expect(localStorage.getItem("lna-cookie-consent")).toBeNull();
    expect(openSpy).toHaveBeenCalled();
    window.removeEventListener("cookie-consent-open", openSpy);

    // Hook remains callable for non-footer callers
    openCookiePreferences();
    expect(localStorage.getItem("lna-cookie-consent")).toBeNull();
  });
});
