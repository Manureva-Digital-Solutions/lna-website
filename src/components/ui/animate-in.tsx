"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { animateInMotionProps } from "@/components/ui/animate-in-props";

interface AnimateInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  children: React.ReactNode;
}

export { animateInMotionProps } from "@/components/ui/animate-in-props";

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/** True only after hydration — SSR and the first client paint both see false. */
function useHasMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

/**
 * Scroll-reveal wrapper that cannot blank the page or trip React #418.
 *
 * SSR + first client paint always render a plain visible `<div>` (same tree),
 * so prefers-reduced-motion cannot mismatch hydration and content is never
 * stuck at opacity:0 when IntersectionObserver/whileInView fails to fire.
 *
 * After mount, if motion is allowed, we upgrade to `motion.div` for reveal.
 */
export function AnimateIn({ children, delay = 0, className }: AnimateInProps) {
  const prefersReduced = useReducedMotion();
  const mounted = useHasMounted();
  const motionAllowed = mounted && !prefersReduced;

  if (!motionAllowed) {
    return <div className={cn(className)}>{children}</div>;
  }

  const motionProps = animateInMotionProps(false, delay);

  return (
    <motion.div className={cn(className)} {...motionProps}>
      {children}
    </motion.div>
  );
}
