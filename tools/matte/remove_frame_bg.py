#!/usr/bin/env python3
"""
Frame background removal.

Stage 1  Apple Vision subject lifting (liftmask) -> primary matte
Stage 2  background-plate estimation by inpainting the smooth cyc gradient
Stage 3  LAB colour-distance matte, used ONLY as a union safety net so that
         anything Vision missed (floating props, thin limbs) is kept
Stage 4  colour decontamination of the soft edge, so partial-alpha pixels
         carry true subject colour instead of blended background
"""
import sys, os, subprocess
import numpy as np, cv2
from PIL import Image
from scipy import ndimage

TOOL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "liftmask")

def vision_mask(jpg, tmp_png):
    r = subprocess.run([TOOL, jpg, tmp_png], capture_output=True, text=True)
    if r.returncode != 0:
        return None, r.stderr.strip()
    m = np.array(Image.open(tmp_png).convert("L")).astype(np.float32) / 255.0
    return m, r.stderr.strip()

def bg_plate(bgr, vm, order=3, iters=3):
    """Reconstruct the cyclorama as a smooth polynomial surface.

    Inpainting behind a mask cannot work here: it only removes what the mask
    already found, so a prop Vision missed gets smeared INTO the plate and
    then hides itself. A robust least-squares fit needs no mask - the cyc is
    a smooth low-order gradient, props and bears are outliers, and iterative
    outlier rejection drops them on its own.

    Returns the plate and the fit residual, so a frame the model cannot
    describe is visible rather than silently wrong."""
    H, W = bgr.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    xn, yn = (xx / W - 0.5), (yy / H - 0.5)
    terms = [xn ** i * yn ** j for i in range(order + 1) for j in range(order + 1 - i)]
    A = np.stack([t.ravel() for t in terms], axis=1)
    good0 = (vm < 0.02).ravel()
    if good0.mean() < 0.05:
        good0 = np.ones_like(good0)
    out = np.zeros_like(bgr, dtype=np.float32)
    resid = 0.0
    for c in range(3):
        b = bgr[..., c].astype(np.float32).ravel()
        m = good0.copy()
        pred = None
        for _ in range(iters):
            coef, *_ = np.linalg.lstsq(A[m], b[m], rcond=None)
            pred = A @ coef
            r = b - pred
            sd = float(np.std(r[m])) or 1.0
            nm = good0 & (np.abs(r) < 1.5 * sd)
            if nm.sum() > 1000:
                m = nm
        resid = max(resid, float(np.abs(b[m] - pred[m]).mean()))
        out[..., c] = pred.reshape(H, W)
    return np.clip(out, 0, 255).astype(np.uint8), resid


def lab_deltas(bgr, plate):
    """Split the difference from the background into luminance and chroma.

    A cast shadow moves L a long way but leaves a/b almost untouched, so
    chroma is what separates real subject matter from the shadow the bears
    throw on the cyc floor."""
    a = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    b = cv2.cvtColor(plate, cv2.COLOR_BGR2LAB).astype(np.float32)
    sL = cv2.medianBlur((a[..., 0] - b[..., 0]).astype(np.float32), 5)   # signed
    dC = cv2.medianBlur(np.linalg.norm(a[..., 1:] - b[..., 1:], axis=2).astype(np.float32), 5)
    return np.abs(sL), dC, sL


def edge_energy(bgr):
    """Local gradient energy. Shadows are smooth; real objects have edges."""
    g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    m = np.hypot(cv2.Scharr(g, cv2.CV_32F, 1, 0), cv2.Scharr(g, cv2.CV_32F, 0, 1))
    return cv2.GaussianBlur(m, (0, 0), 1.5)


def colour_alpha(bgr, plate, lo=7.0, hi=20.0):
    dL, dC, _ = lab_deltas(bgr, plate)
    d = np.hypot(dL, dC)
    return np.clip((d - lo) / (hi - lo), 0, 1)

def ground_shadow(vm, sL, dC, band=70):
    """The shadow the bears cast on the cyc floor.

    Colour cannot separate it from a white collar - both are darker than the
    cyc with little hue shift - but position can: the shadow only exists at
    the ground line, tens of pixels below anything Vision is confident about.
    Boots and soles sit in the same band but score vm ~1.0, so the confidence
    guard keeps them."""
    conf = vm > 0.9
    ys, _ = np.nonzero(conf)
    if len(ys) == 0:
        return np.zeros(vm.shape, dtype=bool)
    zone = np.zeros(vm.shape, dtype=bool)
    zone[max(0, int(ys.max()) - band):, :] = True
    return zone & (sL < -8.0) & (dC < 12.0) & (vm < 0.6)


def hysteresis(strong, weak):
    """Keep weak-threshold pixels only where they connect to a confident seed.

    Lets a low-contrast prop interior (the cream pizza dough on a warm-grey
    cyc) join its own confident rim without letting the same loose threshold
    admit unconnected noise elsewhere."""
    n, lab = cv2.connectedComponents(weak.astype(np.uint8), connectivity=8)[:2]
    ids = np.unique(lab[strong & (lab > 0)])
    return np.isin(lab, ids[ids > 0])


def keep_significant(binary, min_area=400):
    """Drop speckle; keep only components big enough to be real content."""
    n, lab, stats, _ = cv2.connectedComponentsWithStats(binary.astype(np.uint8), 8)
    out = np.zeros_like(binary, dtype=bool)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            out |= (lab == i)
    return out

def fill_small_holes(binary, bg_like, max_area=60000):
    """Close interior holes, but never seal a gap that is really background.

    The contact shadow under the bears joins their feet into a closed loop, so
    the gap between the boots reads as an interior hole. `bg_like` marks pixels
    that match the reconstructed cyc, and those are left transparent."""
    filled = ndimage.binary_fill_holes(binary)
    holes = filled & ~binary
    n, lab, stats, _ = cv2.connectedComponentsWithStats(holes.astype(np.uint8), 8)
    out = binary.copy()
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > max_area:
            continue
        comp = (lab == i)
        if bg_like[comp].mean() > 0.5:
            continue
        out |= comp
    return out

def process(jpg, out_png, tmp_png, report=None):
    bgr = cv2.imread(jpg, cv2.IMREAD_COLOR)
    H, W = bgr.shape[:2]
    vm, info = vision_mask(jpg, tmp_png)
    if vm is None:
        return {"frame": os.path.basename(jpg), "error": info}

    # Two-pass background plate. The first pass can only inpaint what Vision
    # found, so anything Vision missed - the kettle, the carafe, the salad -
    # gets smeared INTO the plate and then makes its own surroundings look
    # foreground, which is where the halos came from. Pass two re-inpaints
    # using a generous colour-based foreground estimate so the props are
    # genuinely removed from the reference.
    plate, resid = bg_plate(bgr, vm)
    dL, dC, sL = lab_deltas(bgr, plate)
    ee = edge_energy(bgr)
    shadow = ground_shadow(vm, sL, dC)

    # Safety net for anything Vision dropped. Two independent ways to qualify:
    #   chromatic  - the pixel is a different colour from the cyc (fur, leaves)
    #   structural - much darker/lighter AND carrying real edge detail, which
    #                catches low-chroma props (silver kettle, glass carafe)
    #                while rejecting the smooth, hueless contact shadow.
    chromatic = dC > 6.0
    structural = (dL > 14.0) & (ee > 18.0)
    strong = (chromatic | structural) & (vm < 0.25) & ~shadow
    weak = ((dC > 3.2) | (dL > 9.0)) & (vm < 0.25) & ~shadow
    region = keep_significant(hysteresis(strong, weak), min_area=400)
    # grow slightly so a prop's soft rim is inside the region it is matted in
    region = cv2.dilate(region.astype(np.uint8), np.ones((3, 3), np.uint8), 2).astype(bool)
    ca = np.clip((np.hypot(dL, dC) - 7.0) / (20.0 - 7.0), 0, 1)
    core = cv2.erode(region.astype(np.uint8), np.ones((5, 5), np.uint8), iterations=2)
    extra = np.maximum(region * ca, core.astype(np.float32)) * (~shadow)
    extra_px = int((extra > 0.5).sum())
    alpha = np.maximum(vm, extra)


    alpha[shadow] = 0.0

    # Chroma alone decides whether an enclosed gap is real background.
    # Edge energy cannot help here: the gap between the boots scores ee~47
    # purely from the boot edges bleeding into it. Measured on this footage,
    # the boots gap sits at dChroma 2.2 and the pizza-dough interior at 6.4.
    bg_like = dC < 4.0
    core = fill_small_holes(alpha > 0.5, bg_like)
    alpha = np.maximum(alpha, core.astype(np.float32) * 1.0)
    alpha[shadow] = 0.0
    alpha = keep_significant(alpha > 0.02, min_area=300) * alpha

    # feather the boundary very slightly so the edge is not aliased
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.6)
    alpha = np.clip(alpha, 0, 1)

    # colour decontamination: recover true subject colour under partial alpha
    a3 = alpha[..., None]
    obs = bgr.astype(np.float32)
    safe = np.maximum(a3, 0.35)
    fg = (obs - (1 - a3) * plate.astype(np.float32)) / safe
    fg = np.clip(fg, obs - 45, obs + 45)          # cap the correction
    blend = np.clip((a3 - 0.20) / 0.25, 0, 1)     # trust it only once alpha is real
    fg = obs + (fg - obs) * blend
    fg = np.where(a3 > 0.995, obs, fg)
    fg = np.clip(fg, 0, 255)

    rgba = np.dstack([fg[..., ::-1], alpha * 255]).astype(np.uint8)
    rgba[alpha <= 0.004] = 0
    Image.fromarray(rgba, "RGBA").save(out_png, optimize=True)

    ys, xs = np.nonzero(alpha > 0.03)
    return {
        "frame": os.path.basename(jpg), "instances": info,
        "cov": round(100 * float((alpha > 0.03).mean()), 2),
        "solid": round(100 * float((alpha > 0.97).mean()), 2),
        "safety_net_px": extra_px, "shadow_px": int(shadow.sum()),
        "fit_resid": round(resid, 2),
        "bbox": (int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())) if len(xs) else None,
    }

if __name__ == "__main__":
    src, dst, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    os.makedirs(dst, exist_ok=True)
    tmp = "/tmp/_liftmask_tmp.png"
    for i in range(a, b + 1):
        name = f"frame_{i:04d}"
        r = process(os.path.join(src, name + ".jpg"), os.path.join(dst, name + ".png"), tmp)
        print(r, flush=True)
