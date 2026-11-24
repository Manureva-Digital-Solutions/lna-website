"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to — we only need the server/client snapshot split. */
function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * True only after hydration — SSR and the first client paint both see false.
 *
 * Anything that reads a client-only signal (prefers-reduced-motion, viewport
 * width, visibility) on the render path must be gated on this flag, otherwise
 * the server HTML and the hydrating client tree disagree and React reports a
 * hydration mismatch.
 */
export function useHasMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
