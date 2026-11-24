import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { Button, LinkButton } from "@/components/ui/button";

/**
 * LNAW-118 — element semantics.
 *
 * Base UI warns when `nativeButton` disagrees with the rendered element: an
 * action must be a real <button>, and anything rendered through `render` that is
 * not a <button> must not inherit native button semantics (or `role="button"`).
 */
describe("LNAW-118 Button / LinkButton semantics", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  function baseUiWarnings() {
    return errorSpy.mock.calls
      .map((call) => String(call[0]))
      .filter((message) => message.includes("Base UI:"));
  }

  it("renders a native <button> for an action", () => {
    const { container } = renderWithIntl(<Button>Save</Button>);

    const element = container.firstElementChild as HTMLElement;
    expect(element.tagName).toBe("BUTTON");
    expect(element).toHaveAttribute("type", "button");
    expect(element).not.toHaveAttribute("role", "button");
    expect(container.querySelector("a")).toBeNull();
    expect(baseUiWarnings()).toEqual([]);
  });

  it("renders an <a> without role=button when render supplies an anchor", () => {
    const { container } = renderWithIntl(
      <Button render={<a href="#steps" />}>Jump to steps</Button>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element.tagName).toBe("A");
    expect(element).toHaveAttribute("href", "#steps");
    expect(element).not.toHaveAttribute("role", "button");
    expect(container.querySelector("button")).toBeNull();
    expect(baseUiWarnings()).toEqual([]);
  });

  it("renders a native <button> when render supplies a button", () => {
    const { container } = renderWithIntl(
      <Button nativeButton render={<button type="submit" />}>
        Submit
      </Button>
    );

    expect(container.firstElementChild?.tagName).toBe("BUTTON");
    expect(baseUiWarnings()).toEqual([]);
  });

  it("renders LinkButton as a real anchor with link semantics", () => {
    const { container } = renderWithIntl(
      <LinkButton href="/contact">Contact us</LinkButton>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element.tagName).toBe("A");
    expect(element).toHaveAttribute("href", "/contact");
    expect(element).not.toHaveAttribute("role", "button");
    expect(container.querySelector("button")).toBeNull();
    expect(baseUiWarnings()).toEqual([]);
  });

  it("keeps LinkButton styling and focus ring classes", () => {
    const { container } = renderWithIntl(
      <LinkButton href="/contact">Contact us</LinkButton>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element).toHaveClass("bg-primary");
    expect(element).toHaveClass("h-12");
    expect(element).toHaveClass("focus-visible:outline-2");
    expect(element).toHaveClass("focus-visible:outline-primary");
  });
});
