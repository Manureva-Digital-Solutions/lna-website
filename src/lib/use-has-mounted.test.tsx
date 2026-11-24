import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useHasMounted } from "@/lib/use-has-mounted";

function Probe() {
  const mounted = useHasMounted();
  return (
    <span data-mounted={String(mounted)}>{mounted ? "client" : "ssr"}</span>
  );
}

describe("useHasMounted (LNAW-119)", () => {
  it("uses the server snapshot (false) while rendering on the server", () => {
    expect(renderToString(<Probe />)).toContain('data-mounted="false"');
  });

  it("switches to true once the client has hydrated", () => {
    render(<Probe />);
    expect(screen.getByText("client")).toHaveAttribute("data-mounted", "true");
  });
});
