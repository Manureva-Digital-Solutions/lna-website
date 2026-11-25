import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEvent, fireEvent } from "@testing-library/react";
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

/**
 * LNAW-133 — custom render target passthrough and disabled anchors.
 *
 * `render` used to be dropped for anything that was not an `<a>` clone, so a
 * caller-supplied element lost its own semantics (e.g. `type="submit"`). A
 * cloned `<a>` also ignored `disabled` and navigated anyway.
 */
describe("LNAW-133 Button render passthrough and disabled anchors", () => {
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

  it("forwards a custom <button> render target and keeps type=submit", () => {
    const { container } = renderWithIntl(
      <Button render={<button type="submit" />}>Submit</Button>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element.tagName).toBe("BUTTON");
    expect(element).toHaveAttribute("type", "submit");
    expect(element).not.toHaveAttribute("role", "button");
    expect(baseUiWarnings()).toEqual([]);
  });

  it("forwards a non-anchor custom render target instead of dropping it", () => {
    const { container } = renderWithIntl(
      <Button nativeButton={false} render={<span data-target="row" />}>
        Open
      </Button>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element.tagName).toBe("SPAN");
    expect(element).toHaveAttribute("data-target", "row");
    expect(element).toHaveAttribute("role", "button");
    expect(baseUiWarnings()).toEqual([]);
  });

  it("exposes a cloned anchor with disabled as disabled", () => {
    const { container } = renderWithIntl(
      <Button render={<a href="#contact-form" />} disabled>
        Contact us
      </Button>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element.tagName).toBe("A");
    expect(element).toHaveAttribute("aria-disabled", "true");
    expect(element).toHaveAttribute("data-disabled", "");
    expect(element).toHaveAttribute("tabindex", "-1");
    // Styled like the `disabled:` utilities, which do not apply to anchors.
    expect(element).toHaveClass("pointer-events-none");
    expect(element).toHaveClass("opacity-50");
    // `disabled` is not a valid anchor attribute and must not leak to the DOM.
    expect(element).not.toHaveAttribute("disabled");
  });

  it("cannot activate a cloned anchor with disabled", () => {
    const onButtonClick = vi.fn();
    const onRenderClick = vi.fn();
    const { container } = renderWithIntl(
      <Button
        render={<a href="#contact-form" onClick={onRenderClick} />}
        disabled
        onClick={onButtonClick}
      >
        Contact us
      </Button>
    );

    const element = container.firstElementChild as HTMLElement;
    const clickEvent = createEvent.click(element);
    fireEvent(element, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(onButtonClick).not.toHaveBeenCalled();
    expect(onRenderClick).not.toHaveBeenCalled();
  });

  it("blocks Enter and Space on a disabled cloned anchor with explicit tabIndex", () => {
    const onButtonClick = vi.fn();
    const onRenderClick = vi.fn();
    const { container } = renderWithIntl(
      <Button
        render={<a href="#contact-form" tabIndex={0} onClick={onRenderClick} />}
        disabled
        onClick={onButtonClick}
      >
        Contact us
      </Button>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element).toHaveAttribute("tabindex", "0");
    expect(element).toHaveAttribute("aria-disabled", "true");

    for (const key of ["Enter", " "] as const) {
      const keyEvent = createEvent.keyDown(element, { key });
      fireEvent(element, keyEvent);
      expect(keyEvent.defaultPrevented).toBe(true);
    }

    expect(onButtonClick).not.toHaveBeenCalled();
    expect(onRenderClick).not.toHaveBeenCalled();
  });

  it("still activates a cloned anchor that is not disabled", () => {
    const onButtonClick = vi.fn();
    const { container } = renderWithIntl(
      <Button render={<a href="#contact-form" />} onClick={onButtonClick}>
        Contact us
      </Button>
    );

    const element = container.firstElementChild as HTMLElement;
    expect(element).toHaveAttribute("href", "#contact-form");
    expect(element).not.toHaveAttribute("aria-disabled");
    expect(element).not.toHaveClass("pointer-events-none");

    const clickEvent = createEvent.click(element);
    fireEvent(element, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(false);
    expect(onButtonClick).toHaveBeenCalledTimes(1);
  });
});
