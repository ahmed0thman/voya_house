#!/usr/bin/env python3
"""
Frames 64-99 were duplicated from frame_0100. Unlike the previous two
duplicated ranges, there is no real frame immediately before 64 to measure
(64 is the very first frame the desktop panel shows), and in the original
footage the trio isn't reliably visible until frame ~87 anyway - before
that it's pure light-burst.

So the low-end scale/centre reference is Apple Vision's OWN foreground
mask run directly on frame_0087.jpg (bypassing the glow-crossfade PNG,
which at frame 87 is still ~85% glow and gives a garbage bbox merged with
light-ray speckle). This is the same clean measurement method used for the
high-end reference (frame_0100.jpg), so both ends are apples-to-apples.

Frame 64 lands near frame 87's real (small) scale; frame 99 lands near
frame 100's real scale; interpolation runs across a virtual span of 63..100
(37 steps) rather than 64..99, so both ends ease toward - but don't
exactly touch - their reference, consistent with how the previous two
ramps behaved at their real anchors.
"""
import sys, os
sys.path.insert(0, "/Users/ahmedhisham/Work/personal/voya/tools/matte")
import numpy as np, cv2
from PIL import Image
from zoom_ramp import measure, zoom_pan, W, H

def clean_vision_measure(jpg_path, liftmask_bin, tmp="/tmp/_emerge.png"):
    import subprocess
    r = subprocess.run([liftmask_bin, jpg_path, tmp], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    m = np.array(Image.open(tmp).convert("L"))
    mask = (m >= 128).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    areas = [(stats[i, cv2.CC_STAT_AREA], i) for i in range(1, n)]
    _, i = max(areas)
    x, y, w, h = stats[i, 0], stats[i, 1], stats[i, 2], stats[i, 3]
    return dict(w=w, h=h, cx=x + w / 2.0, cy=y + h / 2.0)

if __name__ == "__main__":
    native_path, frames_dir, liftmask_bin = sys.argv[1], sys.argv[2], sys.argv[3]
    LO_REF, HI_REF = 87, 100          # clean-measurement source frames (frames/*.jpg)
    VIRT_LO, VIRT_HI = 63, 100        # spacing used for the t(i) formula
    FIRST, LAST = 64, 99

    r_lo = clean_vision_measure(os.path.join(frames_dir, f"frame_{LO_REF:04d}.jpg"), liftmask_bin)
    r_hi = clean_vision_measure(os.path.join(frames_dir, f"frame_{HI_REF:04d}.jpg"), liftmask_bin)
    r_native = measure(native_path)   # frame_0100.png, alpha==255 method

    scale_lo = ((r_lo["w"] / r_hi["w"]) + (r_lo["h"] / r_hi["h"])) / 2.0
    scale_hi = 1.0
    c_lo = (r_lo["cx"], r_lo["cy"])
    c_hi = (r_native["cx"], r_native["cy"])
    c_native = c_hi

    print(f"low ref (frame {LO_REF}, clean Vision):  {r_lo}  -> scale={scale_lo:.4f}")
    print(f"high ref (frame {HI_REF}, clean Vision): {r_hi}")
    print(f"native (frame_0100.png, alpha==255):     {r_native}")

    src_im = np.array(Image.open(native_path).convert("RGBA"))
    span = VIRT_HI - VIRT_LO
    for i in range(FIRST, LAST + 1):
        t = (i - VIRT_LO) / span
        scale = scale_lo + t * (scale_hi - scale_lo)
        cx = c_lo[0] + t * (c_hi[0] - c_lo[0])
        cy = c_lo[1] + t * (c_hi[1] - c_lo[1])
        out = zoom_pan(src_im, scale, c_native, (cx, cy))
        Image.fromarray(out, "RGBA").save(os.path.join(frames_dir, "..", "frames-web", f"frame_{i:04d}.png"), optimize=True)
        print(f"frame {i:04d}  t={t:.3f}  scale={scale:.4f}  target_centre=({cx:.1f},{cy:.1f})")
