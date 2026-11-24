import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { renderWithIntl } from "@/test/render";
import { showToast } from "@/components/ui/toast";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

vi.mock("@/components/ui/toast", () => ({ showToast: vi.fn() }));

const showToastMock = vi.mocked(showToast);

async function submit(email: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(en.newsletter.emailLabel), email);
  await user.click(
    screen.getByRole("button", { name: en.newsletter.subscribe })
  );
}

describe("NewsletterForm", () => {
  beforeEach(() => {
    showToastMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("promises a confirmation email only when one was sent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, confirmed: true }),
      })
    );
    renderWithIntl(<NewsletterForm />);

    await submit("lea@example.fr");

    expect(showToastMock).toHaveBeenCalledWith(
      en.newsletter.success,
      "success"
    );
  });

  it("does not say 'check your email' when confirmed is false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          delivered: false,
          confirmed: false,
        }),
      })
    );
    renderWithIntl(<NewsletterForm />);

    await submit("lea@example.fr");

    expect(showToastMock).toHaveBeenCalledWith(
      en.newsletter.successNoConfirm,
      "success"
    );
    expect(showToastMock).not.toHaveBeenCalledWith(
      en.newsletter.success,
      "success"
    );
    expect(en.newsletter.successNoConfirm).not.toMatch(/check your email/i);
  });

  it("toasts locale copy — never the raw API string — on a 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: "rate_limited" }),
      })
    );
    renderWithIntl(<NewsletterForm />);

    await submit("lea@example.fr");

    expect(showToastMock).toHaveBeenCalledWith(
      en.newsletter.rateLimited,
      "error"
    );
    expect(showToastMock).not.toHaveBeenCalledWith("rate_limited", "error");
  });

  it("uses the FR rate-limit copy in the French locale", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: "rate_limited" }),
      })
    );
    renderWithIntl(<NewsletterForm />, { locale: "fr" });

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(fr.newsletter.emailLabel),
      "lea@example.fr"
    );
    await user.click(
      screen.getByRole("button", { name: fr.newsletter.subscribe })
    );

    expect(showToastMock).toHaveBeenCalledWith(
      fr.newsletter.rateLimited,
      "error"
    );
  });

  it("falls back to locale error copy for other failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Failed to subscribe. Please try again." }),
      })
    );
    renderWithIntl(<NewsletterForm />);

    await submit("lea@example.fr");

    expect(showToastMock).toHaveBeenCalledWith(en.newsletter.error, "error");
  });
});
