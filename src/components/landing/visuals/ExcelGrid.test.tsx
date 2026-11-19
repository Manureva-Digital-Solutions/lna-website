import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExcelGrid } from "@/components/landing/visuals/ExcelGrid";

describe("ExcelGrid", () => {
  it("renders the required caption and has no hardcoded filename fallback", () => {
    const source = readFileSync(resolve(__dirname, "ExcelGrid.tsx"), "utf8");
    expect(source).not.toMatch(/comparison-adp\.xlsx|comparatif-adp\.xlsx/);
    expect(source).not.toMatch(/caption\s*\?\?/);
    expect(source).toMatch(/caption:\s*string/);

    render(
      <ExcelGrid
        columns={["Guarantee", "Generali"]}
        rows={[{ label: "Rate", values: ["0.34%"] }]}
        caption="comparison-adp.xlsx"
      />
    );
    expect(screen.getByText("comparison-adp.xlsx")).toBeInTheDocument();
  });
});
