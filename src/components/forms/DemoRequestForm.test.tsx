import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { DemoRequestForm } from "@/components/forms/DemoRequestForm";
import { renderWithIntl } from "@/test/render";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

const ICP_ROLE_KEYS = [
  "accountant",
  "insuranceBroker",
  "propertyManager",
  "other",
] as const;

describe("DemoRequestForm ICP roles", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps EN/FR role keys in parity for the ICP", () => {
    expect(Object.keys(en.demoForm.roles).sort()).toEqual(
      Object.keys(fr.demoForm.roles).sort()
    );
    expect(Object.keys(en.demoForm.roles).sort()).toEqual(
      [...ICP_ROLE_KEYS].sort()
    );

    expect(en.demoForm.roles.accountant).toBe("Accountant");
    expect(en.demoForm.roles.insuranceBroker).toBe("Insurance broker");
    expect(en.demoForm.roles.propertyManager).toBe("Property manager");

    expect(fr.demoForm.roles.accountant).toBe("Expert-comptable");
    expect(fr.demoForm.roles.insuranceBroker).toBe("Courtier en assurance");
    expect(fr.demoForm.roles.propertyManager).toBe("Gestionnaire de biens");
  });

  it("renders ICP labels and submits the stable role key to the API", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DemoRequestForm />);

    for (const key of ICP_ROLE_KEYS) {
      expect(
        screen.getByRole("option", { name: en.demoForm.roles[key] })
      ).toHaveValue(key);
    }
    expect(
      screen.queryByRole("option", { name: "CEO" })
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText(new RegExp(en.demoForm.nameLabel)),
      "Ada Broker"
    );
    await user.type(
      screen.getByLabelText(new RegExp(en.demoForm.emailLabel)),
      "ada@cabinet.fr"
    );
    await user.type(
      screen.getByLabelText(new RegExp(en.demoForm.companyLabel)),
      "Cabinet Ada"
    );
    await user.selectOptions(
      screen.getByLabelText(new RegExp(en.demoForm.roleLabel)),
      "insuranceBroker"
    );
    await user.click(screen.getByRole("button", { name: en.demoForm.submit }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/demo-request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Ada Broker",
          email: "ada@cabinet.fr",
          company: "Cabinet Ada",
          role: "insuranceBroker",
          message: "",
          locale: "en",
        }),
      })
    );
  });

  it("includes the FR locale on submit so the acknowledgement is localized", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DemoRequestForm />, { locale: "fr" });

    await user.type(
      screen.getByLabelText(new RegExp(fr.demoForm.nameLabel)),
      "Léa Martin"
    );
    await user.type(
      screen.getByLabelText(new RegExp(fr.demoForm.emailLabel)),
      "lea@cabinet.fr"
    );
    await user.type(
      screen.getByLabelText(new RegExp(fr.demoForm.companyLabel)),
      "Cabinet Léa"
    );
    await user.selectOptions(
      screen.getByLabelText(new RegExp(fr.demoForm.roleLabel)),
      "accountant"
    );
    await user.click(screen.getByRole("button", { name: fr.demoForm.submit }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/demo-request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Léa Martin",
          email: "lea@cabinet.fr",
          company: "Cabinet Léa",
          role: "accountant",
          message: "",
          locale: "fr",
        }),
      })
    );
  });

  it("shows success without the confirmation-email line when acknowledged is false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, acknowledged: false }),
      })
    );
    const user = userEvent.setup();
    renderWithIntl(<DemoRequestForm />);

    await user.type(
      screen.getByLabelText(new RegExp(en.demoForm.nameLabel)),
      "Ada Broker"
    );
    await user.type(
      screen.getByLabelText(new RegExp(en.demoForm.emailLabel)),
      "ada@cabinet.fr"
    );
    await user.type(
      screen.getByLabelText(new RegExp(en.demoForm.companyLabel)),
      "Cabinet Ada"
    );
    await user.selectOptions(
      screen.getByLabelText(new RegExp(en.demoForm.roleLabel)),
      "other"
    );
    await user.click(screen.getByRole("button", { name: en.demoForm.submit }));

    expect(
      await screen.findByText(en.demoForm.success.heading)
    ).toBeInTheDocument();
    expect(
      screen.getByText(en.demoForm.success.description)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(en.demoForm.success.descriptionWithEmail)
    ).not.toBeInTheDocument();
  });

  it("mentions the confirmation email when acknowledgement succeeded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, acknowledged: true }),
      })
    );
    const user = userEvent.setup();
    renderWithIntl(<DemoRequestForm />);

    await user.type(
      screen.getByLabelText(new RegExp(en.demoForm.nameLabel)),
      "Ada Broker"
    );
    await user.type(
      screen.getByLabelText(new RegExp(en.demoForm.emailLabel)),
      "ada@cabinet.fr"
    );
    await user.type(
      screen.getByLabelText(new RegExp(en.demoForm.companyLabel)),
      "Cabinet Ada"
    );
    await user.selectOptions(
      screen.getByLabelText(new RegExp(en.demoForm.roleLabel)),
      "other"
    );
    await user.click(screen.getByRole("button", { name: en.demoForm.submit }));

    expect(
      await screen.findByText(en.demoForm.success.descriptionWithEmail)
    ).toBeInTheDocument();
  });

  it("renders FR ICP labels with the same stable option values", () => {
    renderWithIntl(<DemoRequestForm />, { locale: "fr" });

    for (const key of ICP_ROLE_KEYS) {
      expect(
        screen.getByRole("option", { name: fr.demoForm.roles[key] })
      ).toHaveValue(key);
    }
  });
});
