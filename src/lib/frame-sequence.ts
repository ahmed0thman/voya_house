// Scroll-driven canvas frame sequence: ordered preloading + runtime lookup.
//
// Firing every frame's `img.src` at once (the naive approach) makes all
// in-flight requests share the same constrained bandwidth on a throttled
// connection — frame 1 might resolve, but frames 2+ trickle in together
// over the *entire* load and stay incomplete for a long time. Loading with
// a small concurrency window, strictly in frame order, keeps nearby frames
// arriving ahead of scroll position regardless of connection speed.

export interface FrameLoadHandle {
  cancel: () => void;
  /**
   * Resumes loading past `initialBatchSize`, if it was set below
   * `frameCount`. No-op if the full sequence is already loading/loaded, or
   * after `cancel()`.
   */
  resume: () => void;
}

export interface FrameLoadOptions {
  frameCount: number;
  concurrency?: number;
  /**
   * If less than `frameCount`, only this many leading frames are requested
   * up front — the rest wait until `resume()` is called. Fetching the whole
   * sequence unconditionally keeps the network busy for the entire session
   * (confirmed via Lighthouse: ~28MB of continuous background requests
   * pushed LCP/TTI past 50s even once the visible experience was fully
   * interactive), which is wasted cost for anyone who never scrolls past
   * the hero. Defaults to `frameCount` (load everything up front).
   */
  initialBatchSize?: number;
  srcFor: (frameNumber1Based: number) => string;
  /** Called after every frame settles (loaded or errored). */
  onFrameSettled?: (loadedCount: number, contiguousLoaded: number) => void;
}

/**
 * Preloads `frameCount` images into `images` (pre-sized array, mutated in
 * place) with a bounded number of concurrent requests, dispatched strictly
 * in order. Returns a handle to cancel any requests still pending, and to
 * resume loading past an initial capped batch (see `initialBatchSize`).
 */
export function preloadFrameSequence(
  images: HTMLImageElement[],
  {
    frameCount,
    concurrency = 6,
    initialBatchSize = frameCount,
    srcFor,
    onFrameSettled,
  }: FrameLoadOptions,
): FrameLoadHandle {
  let cancelled = false;
  let loadedCount = 0;
  let contiguousLoaded = 0; // highest N such that frames [0, N) are all settled
  let nextIndex = 0;
  let ceiling = Math.min(initialBatchSize, frameCount);

  const loadNext = () => {
    if (cancelled || nextIndex >= ceiling) return;
    const i = nextIndex++;
    const img = new window.Image();
    // Explicit, not left to Chrome's own heuristic: these must never queue
    // ahead of the LCP image or other critical resources under a
    // bandwidth-constrained connection.
    img.fetchPriority = "low";
    images[i] = img;
    img.onload = img.onerror = () => {
      if (cancelled) return;
      loadedCount++;
      while (
        contiguousLoaded < frameCount &&
        images[contiguousLoaded]?.complete
      ) {
        contiguousLoaded++;
      }
      onFrameSettled?.(loadedCount, contiguousLoaded);
      loadNext();
    };
    img.src = srcFor(i + 1);
  };

  for (let c = 0; c < concurrency && c < ceiling; c++) loadNext();

  return {
    cancel: () => {
      cancelled = true;
    },
    resume: () => {
      if (cancelled || ceiling >= frameCount) return;
      ceiling = frameCount;
      for (let c = 0; c < concurrency; c++) loadNext();
    },
  };
}

/**
 * Finds the closest frame to `target` that has finished loading, searching
 * outward on both sides. Used as a scroll-time fallback so the canvas keeps
 * tracking scroll position instead of freezing on stale content while the
 * exact frame is still in flight.
 */
export function findNearestLoadedFrame(
  images: HTMLImageElement[],
  target: number,
): HTMLImageElement | null {
  const exact = images[target];
  if (exact && exact.complete) return exact;

  const frameCount = images.length;
  for (let d = 1; d < frameCount; d++) {
    const back = images[target - d];
    if (back && back.complete) return back;
    const fwd = images[target + d];
    if (fwd && fwd.complete) return fwd;
  }
  return null;
}
