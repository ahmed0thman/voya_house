#!/usr/bin/env python3
"""
Feathered treatment for the through-the-door light burst (frames 64-125).

There is no subject to lift here - the glow IS the image - so instead of a
matte these frames get:
  * a glow term, so warm light shows and the neutral cyc floor does not
  * an edge feather, so the panel never shows a hard canvas rectangle
  * a cross-fade that hands over to the real cutout as the trio resolves
"""
import os, sys, subprocess
import numpy as np, cv2
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout import (bg_plate, lab_deltas, vision_mask, ground_shadow,
                    fill_small_holes, keep_significant)

VISION_FROM = 87     # first frame Vision returns a clean trio
HANDOVER    = 126    # first frame the plain cutout stands on its own

def smootherstep(x):
    x = np.clip(x, 0, 1)
    return x * x * x * (x * (x * 6 - 15) + 10)

def edge_feather(H, W, mx=110, my=130):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    fx = smootherstep(np.minimum(xx, W - 1 - xx) / mx)
    fy = smootherstep(np.minimum(yy, H - 1 - yy) / my)
    return fx * fy

def glow_alpha(bgr, lo=222.0, hi=248.0):
    """How much brighter than the destination panel this pixel burns."""
    v = bgr.max(axis=2).astype(np.float32)
    return np.clip((v - lo) / (hi - lo), 0, 1)

def subject_alpha(jpg, bgr, tmp):
    """Vision-only matte - no safety net, because here the safety net would
    just re-admit the very glow the glow term already handles."""
    vm, info = vision_mask(jpg, tmp)
    if vm is None:
        return np.zeros(bgr.shape[:2], np.float32), None, info
    plate, resid = bg_plate(bgr, vm)
    dL, dC, sL = lab_deltas(bgr, plate)
    a = vm.copy()
    a[ground_shadow(vm, sL, dC)] = 0.0
    a = np.maximum(a, fill_small_holes(a > 0.5, dC < 4.0).astype(np.float32))
    a = keep_significant(a > 0.02, min_area=300) * a
    return cv2.GaussianBlur(a, (0, 0), 0.6), plate, info

def process(frame, src, dst, tmp="/tmp/_burst.png"):
    jpg = os.path.join(src, f"frame_{frame:04d}.jpg")
    bgr = cv2.imread(jpg)
    H, W = bgr.shape[:2]

    if frame >= VISION_FROM:
        sub, plate, info = subject_alpha(jpg, bgr, tmp)
        t = float(np.clip((frame - VISION_FROM) / (HANDOVER - VISION_FROM), 0, 1))
    else:
        sub, plate, info, t = np.zeros((H, W), np.float32), None, "burst-only", 0.0

    glow = glow_alpha(bgr) * edge_feather(H, W) * (1.0 - t)
    alpha = np.clip(np.maximum(sub, glow), 0, 1)

    rgba = np.dstack([bgr[..., ::-1].astype(np.float32), alpha * 255]).astype(np.uint8)
    rgba[alpha <= 0.004] = 0
    Image.fromarray(rgba, "RGBA").save(os.path.join(dst, f"frame_{frame:04d}.png"), optimize=True)
    return {"frame": frame, "t": round(t, 2), "subject%": round(100 * float((sub > 0.5).mean()), 2),
            "glow%": round(100 * float((glow > 0.02).mean()), 2),
            "total%": round(100 * float((alpha > 0.02).mean()), 2), "vision": info}

if __name__ == "__main__":
    src, dst, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    os.makedirs(dst, exist_ok=True)
    for f in range(a, b + 1):
        print(process(f, src, dst), flush=True)
