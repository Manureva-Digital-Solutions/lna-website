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
        }),
      })
    );
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
