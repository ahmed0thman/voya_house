#!/usr/bin/env python3
"""
Rebuilds a duplicated-frame run as a measured zoom/pan ramp instead of a
frozen hold. A duplicated span erases whatever camera motion was in that
part of the footage, and simply guessing a zoom direction can overshoot -
the first attempt on 104-120 assumed monotonic zoom-in and blew past frame
121's real scale, because frame 116 (the duplication source) turned out to
be the LARGEST of the nearby real frames, not the smallest.

This version measures the real subject scale and centre at the two real
frames bracketing the duplicated span (anchor_lo = first duplicated frame
minus 1, anchor_hi = last duplicated frame plus 1) via the largest opaque
connected component, then interpolates scale and pan linearly across the
duplicated span by true frame distance from those anchors - so the frame
right after anchor_lo sits almost exactly at anchor_lo's scale, and the
frame right before anchor_hi sits almost exactly at anchor_hi's scale.

Usage:
    zoom_ramp.py <native_frame.png> <anchor_lo_num> <anchor_hi_num>

native_frame.png is the single image every duplicated frame currently holds
(the source of the cp). anchor_lo/anchor_hi name the two real, untouched
frames immediately outside the duplicated span; every frame strictly
between them is rewritten.
"""
import sys
import numpy as np, cv2
from PIL import Image

W, H = 720, 1280

def measure(path, thresh=255):
    a = np.array(Image.open(path).convert("RGBA"))
    al = a[..., 3]
    mask = (al >= thresh).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    areas = [(stats[i, cv2.CC_STAT_AREA], i) for i in range(1, n)]
    _, i = max(areas)
    x, y, w, h = stats[i, 0], stats[i, 1], stats[i, 2], stats[i, 3]
    return dict(w=w, h=h, cx=x + w / 2.0, cy=y + h / 2.0)

def zoom_pan(im_rgba, scale, native_c, target_c):
    """Scale the whole cutout about native_c, then place it so native_c lands
    on target_c in a fresh transparent WxH canvas. Handles scale<1 (more
    transparent canvas revealed around a smaller subject) and scale>1
    (crops) the same way, since there is no background pixel data here -
    frames-web PNGs composite over the page's own panel gradient."""
    a = im_rgba[..., 3:4].astype(np.float32) / 255.0
    premul = im_rgba[..., :3].astype(np.float32) * a
    nw, nh = max(1, int(round(W * scale))), max(1, int(round(H * scale)))

    chans = [np.array(Image.fromarray(premul[..., c], mode="F").resize((nw, nh), Image.LANCZOS))
             for c in range(3)]
    a_big = np.clip(np.array(Image.fromarray(im_rgba[..., 3].astype(np.float32), mode="F")
                             .resize((nw, nh), Image.LANCZOS)), 0, 255)
    safe_a = np.maximum(a_big, 1.0)
    rgb_big = np.clip(np.stack(chans, axis=-1) / (safe_a[..., None] / 255.0), 0, 255)

    # where native_c*scale must land in canvas coords: canvas_origin = target_c - native_c*scale
    ox = int(round(target_c[0] - native_c[0] * scale))
    oy = int(round(target_c[1] - native_c[1] * scale))

    canvas_rgb = np.zeros((H, W, 3), np.float32)
    canvas_a = np.zeros((H, W), np.float32)

    sx0, sy0 = max(0, -ox), max(0, -oy)
    dx0, dy0 = max(0, ox), max(0, oy)
    cw = min(nw - sx0, W - dx0)
    ch = min(nh - sy0, H - dy0)
    if cw > 0 and ch > 0:
        canvas_rgb[dy0:dy0 + ch, dx0:dx0 + cw] = rgb_big[sy0:sy0 + ch, sx0:sx0 + cw]
        canvas_a[dy0:dy0 + ch, dx0:dx0 + cw] = a_big[sy0:sy0 + ch, sx0:sx0 + cw]

    out = np.dstack([canvas_rgb, canvas_a]).astype(np.uint8)
    out[canvas_a <= 0.5] = 0
    return out

if __name__ == "__main__":
    native_path = sys.argv[1]
    ANCHOR_LO, ANCHOR_HI = int(sys.argv[2]), int(sys.argv[3])
    FIRST, LAST = ANCHOR_LO + 1, ANCHOR_HI - 1
    lo_path = f"frame_{ANCHOR_LO:04d}.png"
    hi_path = f"frame_{ANCHOR_HI:04d}.png"
    r_lo = measure(lo_path)
    r_hi = measure(hi_path)
    r_native = measure(native_path)

    s_lo = ((r_lo["w"] / r_native["w"]) + (r_lo["h"] / r_native["h"])) / 2.0
    s_hi = ((r_hi["w"] / r_native["w"]) + (r_hi["h"] / r_native["h"])) / 2.0
    c_native = (r_native["cx"], r_native["cy"])
    print(f"anchor {ANCHOR_LO}: scale={s_lo:.4f} centre=({r_lo['cx']:.1f},{r_lo['cy']:.1f})")
    print(f"anchor {ANCHOR_HI}: scale={s_hi:.4f} centre=({r_hi['cx']:.1f},{r_hi['cy']:.1f})")
    print(f"native (116): centre=({c_native[0]:.1f},{c_native[1]:.1f})")

    src_im = np.array(Image.open(native_path).convert("RGBA"))
    span = ANCHOR_HI - ANCHOR_LO
    for i in range(FIRST, LAST + 1):
        t = (i - ANCHOR_LO) / span
        scale = s_lo + t * (s_hi - s_lo)
        cx = r_lo["cx"] + t * (r_hi["cx"] - r_lo["cx"])
        cy = r_lo["cy"] + t * (r_hi["cy"] - r_lo["cy"])
        out = zoom_pan(src_im, scale, c_native, (cx, cy))
        Image.fromarray(out, "RGBA").save(f"frame_{i:04d}.png", optimize=True)
        print(f"frame {i:04d}  t={t:.3f}  scale={scale:.4f}  target_centre=({cx:.1f},{cy:.1f})")
