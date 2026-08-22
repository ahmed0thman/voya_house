# Frame background removal

Cuts the studio cyclorama out of `public/assets/frames/*.jpg` and writes
RGBA PNGs for `public/assets/frames-web/`, which the desktop hero canvas
composites over the panel gradient.

    swiftc -O -o tools/matte/liftmask tools/matte/liftmask.swift
    python3 tools/matte/remove_frame_bg.py \
        public/assets/frames /tmp/out 140 361

Stages:
1. `liftmask` — Apple Vision `VNGenerateForegroundInstanceMaskRequest`,
   union of every instance so floating props are never dropped.
2. Background plate — the cyc is a smooth gradient, so it is reconstructed
   by inpainting behind the subject and used as the matting reference.
3. Safety net — anything Vision dropped is recovered if it is chromatically
   unlike the cyc, or much darker/lighter *and* carrying real edge detail
   (catches the low-chroma silver kettle and glass carafe).
4. Ground-shadow gate — the cast shadow is hueless and darker, exactly like
   a white collar, so colour alone cannot reject it. It is rejected by
   position instead: only at the ground line, and only where Vision is
   unconfident, which leaves boots and soles intact.
5. Colour decontamination — partial-alpha pixels get true subject colour
   solved out of the observed blend rather than keeping a grey fringe.

Requires numpy, opencv-python, scipy, pillow. No model downloads.

## Burst frames (64–125)

`feather_burst.py` handles the through-the-door light burst. There is no
subject to lift there — the glow *is* the image — so those frames get a
glow term (warm light shows, the neutral cyc floor does not), an edge
feather (so the panel never shows a hard canvas rectangle), and a
cross-fade that hands over to the plain cutout as the trio resolves.

    python3 tools/matte/feather_burst.py public/assets/frames /tmp/out 64 125

Boundaries, both measured rather than chosen:
- **64** — the first frame the panel is visible at all (`.desktop-editorial-stage`
  fades in at scroll progress 0.18, and frame = floor(progress × 360)).
- **87** — the first frame Apple Vision returns a clean trio silhouette.
  Below it Vision latches onto the lit doorway and returns 36–73% blobs.
- **126** — where the plain cutout stands on its own; the safety net is
  contributing under 0.5% by then, so the handover is invisible
  (frame 125 = 24.05% coverage, frame 126 = 24.31%).
