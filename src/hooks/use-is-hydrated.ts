"use client";

import { useSyncExternalStore } from "react";

/** Nothing ever changes, so a no-op unsubscribe is the whole subscription. */
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `false` on the server and throughout the hydration render, `true` from the
 * first client render after that.
 *
 * Use it to withhold anything the server could not possibly have rendered —
 * live query data, `localStorage`, the clock — from the one render that has to
 * match the server's HTML exactly. React reads `getServerSnapshot` for the
 * whole hydration pass, including a Suspense boundary that hydrates late, which
 * a plain `useEffect` flag cannot promise.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
