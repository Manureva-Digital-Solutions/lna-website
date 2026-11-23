import type { HTMLMotionProps } from "framer-motion";

/** Motion props for AnimateIn — kept pure so hydration behaviour is unit-tested. */
export function animateInMotionProps(
  reduced: boolean | null,
  delay = 0
): Pick<
  HTMLMotionProps<"div">,
  "initial" | "whileInView" | "viewport" | "transition"
> {
  if (reduced) {
    // Same DOM node as the animated path; only the motion config changes.
    return {
      initial: false,
      whileInView: undefined,
      viewport: undefined,
      transition: undefined,
    };
  }

  return {
    initial: { opacity: 0, y: 8 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.2, delay, ease: "easeOut" },
  };
}
