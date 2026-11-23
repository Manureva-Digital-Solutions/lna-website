import { describe, expect, it } from "vitest";
import { animateInMotionProps } from "./animate-in-props";

describe("animateInMotionProps", () => {
  it("uses a non-animating config when reduced motion is preferred (SSR-safe)", () => {
    expect(animateInMotionProps(true, 0.2)).toEqual({
      initial: false,
      whileInView: undefined,
      viewport: undefined,
      transition: undefined,
    });
  });

  it("treats null (SSR default from useReducedMotion) like motion-enabled", () => {
    const props = animateInMotionProps(null);
    expect(props.initial).toEqual({ opacity: 0, y: 8 });
    expect(props.whileInView).toEqual({ opacity: 1, y: 0 });
  });

  it("keeps scroll-reveal props when reduced motion is off", () => {
    const props = animateInMotionProps(false, 0.15);
    expect(props.initial).toEqual({ opacity: 0, y: 8 });
    expect(props.whileInView).toEqual({ opacity: 1, y: 0 });
    expect(props.viewport).toEqual({ once: true, margin: "-60px" });
    expect(props.transition).toMatchObject({ delay: 0.15, duration: 0.2 });
  });

  it("never switches element type — callers always mount motion.div", () => {
    for (const reduced of [true, false, null] as const) {
      const props = animateInMotionProps(reduced);
      expect(props).toHaveProperty("initial");
      expect(props).toHaveProperty("whileInView");
    }
  });

  it("matches SSR (null) to the motion-on config used after mount", () => {
    // AnimateIn SSR/first paint is a plain visible div; after mount (when
    // motion is allowed) null ≡ false so the motion config stays consistent.
    expect(animateInMotionProps(null)).toEqual(animateInMotionProps(false));
  });
});
