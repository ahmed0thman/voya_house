# Voya Motion — Desktop (right-panel) version

Target: the 58%-wide right column of the desktop scrollytelling stage
(`src/app/page.tsx`, "RIGHT COLUMN" block). Replaces the 9:16
`voya-motion-landing.mp4` on `md:` and up. Mobile keeps the 9:16 original.

Generator: **Seedance 2.0** (1:1 native, 15 s max, 9 reference images,
`@ImageN` mention syntax).

## Generation settings

| Param | Value | Note |
|---|---|---|
| `aspect_ratio` | `1:1` | Panel measures 0.89–1.03 aspect across desktops |
| `duration` | `15` | Exactly at Seedance's ceiling — no headroom |
| `resolution` | highest offered (1080p) | 720p → 720×720 upscaled ~3x at DPR2, visibly soft |
| references | 6 images | Limit is 9; all six below pass the 300–6000px / 0.4–2.5 ar / 30 MB rules |

Beats must land on exact 3.000 s boundaries — the scroll timeline maps
progress 0/.2/.4/.6/.8/1.0 → frames 0/72/144/216/288/360.

### ⚠ The one big risk

Seedance 2.0 is *built and marketed for multi-shot* generation. This
sequence must be a single unbroken take or the scroll scrub will jump.
Expect to fight the model on this — the anti-cut language is stated
three times below and stacked in the negative prompt. Check the first
render for shot changes before doing anything else.

### Composition geometry (in the 1:1 frame)

The layout paints overlays on top of the video that the model can't see:

| Layout element | Where it lands in the frame |
|---|---|
| Black scrim, ≥40% opacity | x 0% → 21% |
| Black scrim, dimming falloff | x 21% → 35% |
| Bottom vignette | y 78% → 100% |
| Fixed header chrome | y 0% → 10% |
| `object-cover` edge crop | up to 5.5% off each side |
| **Subject safe zone** | **x 40% → 94%, y 12% → 78%** |
| **Character anchor** | **body centre x 64%, feet y 78%, eyeline y 34%** |

## The prompt

Reference roles: @Image1 is the environment and architecture reference.
@Image2, @Image3, @Image4, @Image5 and @Image6 are character identity
references only — lock faces, fur, sunglasses and wardrobe from them, and
take nothing else.

Square 1:1. Exactly 15 seconds. ONE SINGLE CONTINUOUS SHOT — this is a
single-shot generation, not a multi-shot sequence. No cuts, no shot
changes, no scene changes, no transitions, no fades, no camera switches
at any point. The camera never stops rolling. Locked-off exposure and
locked white balance for the entire take.

BACKGROUND — non-negotiable: from 3s onward the environment is a seamless
infinity cyclorama in flat warm off-white, exactly #F0ECE7 at the centre
falling to #E5E1DA at the extreme edges. Perfectly even, edge-to-edge
studio light. Absolutely NO vignette, no corner darkening, no gradient
falloff, no film grain, no lens shading. All four corners must read the
same value as the centre. The frame must butt seamlessly against a flat
#E5E1DA web panel with no visible seam.

COMPOSITION: keep every character, prop and highlight inside x = 40%–94%
and y = 12%–78% of the frame. Anchor every character's body centre at
x = 64%, feet at y = 78%, eyeline at y = 34%. Do NOT alternate characters
left and right — all three land on the same right-of-centre mark at the
same scale and the same eyeline, so the shot reads as one steady move.
The left 35% of the frame stays empty background at all times. Camera
moves are small and drifting, never travelling far enough to carry a
subject outside x = 40%–94%.

LIGHTING: soft key from camera-right at 45 degrees, gentle fill from
camera-left, warm 5200K. Characters carry a soft contact shadow directly
under the feet only — no long cast shadows reaching into the left 35%.

0-3s: The camera dollies smoothly forward into the Voya House storefront,
matching the architecture, pastel colour blocking and signage of @Image1.
The facade fills the square frame with the illuminated central doorway at
x = 64%. The glass doors open inward and brilliant warm golden light
floods the lens, blooming outward from the doorway.

3-6s: Without cutting, the camera passes through the light bloom, which
dissolves into the clean #F0ECE7 cyclorama, revealing the three mascot
bears standing together as a trio. The group spans x = 40%–92%, feet at
y = 78%. Fine warm-gold sparkle bokeh drifts through the air on the right
two-thirds of the frame only — never into the left 35%.

6-9s: Still the same continuous shot, the camera pushes in gently and
settles on the smallest bear, identity locked to @Image2, now alone on
the mark at x = 64%. He extends both arms and a silver gooseneck kettle,
a ceramic V60 dripper and a glass carafe levitate and slowly orbit at
shoulder height, spread laterally to his left and right — never above his
head, never left of x = 40%, never past x = 94%.

9-12s: The same unbroken camera sweeps smoothly a short distance right
and back, landing on the muscular bear, identity locked to @Image3 and
@Image5, on the same mark at x = 64%. He flicks his wrist and salad
leaves, cherry tomatoes and basil arc through the air in slow motion in a
compact lateral fan, staying inside x = 40%–94% and y = 12%–60%.

12-15s: The same unbroken camera continues its gentle drift to the mother
bear, identity locked to @Image4 and @Image6, same mark at x = 64%. She
spins a circle of raw pizza dough into the air — the dough apex stays
below y = 14% — and waves warmly with her free paw. The camera eases to a
complete stop with her still on the mark.

STRICT CHARACTER FIDELITY: @Image2 locks the small bear (black beanie,
black tee with V, cream apron, grey cuffed trousers, round black
sunglasses). @Image3 and @Image5 lock the muscular bear (black pompadour,
round black sunglasses, black polo with V, black belt, cream trousers,
dark sneakers). @Image4 and @Image6 lock the mother bear (polka-dot
headband, round black sunglasses, black collared dress with white trim,
orange/tan belt). No character may change wardrobe, lose sunglasses or
drift in facial structure at any point in the 15 seconds.

STYLE: 3D vinyl designer toy, luxury claymation, ultra-photorealistic
soft plush fibre detail, shallow depth of field on the background only,
premium commercial product cinematography.

## Negative prompt

Multi-shot, shot change, scene change, cuts, editing, jump cut,
crossfade, transition, black frames, fading to black, camera switch,
static camera, morphing, identity drift, changing clothes, removing
sunglasses, removing headband, removing beanie, losing hair, extra limbs,
distorted faces, 2D, cartoon, text, watermarks, fast chaotic camera,
shaky cam, wide camera travel, walking, running, talking, blinking,
multiple cameras, vignette, corner darkening, dark corners, grey
background, gradient background, coloured backdrop, film grain,
letterboxing, pillarboxing, subject centred in frame, subject on the left
side of frame, characters entering the left 35%, cast shadows on the
left, props above the head, props leaving the safe zone, exposure shift,
white balance shift.

## Reference image mapping

| Mention | File | Size | Role |
|---|---|---|---|
| `@Image1` | `3d-renders/entrance_3d.png` | 1282x724 | Environment |
| `@Image2` | `3d-renders/voya_char_4_3d_corrected.jpeg` | 2048x2048 | Barista bear |
| `@Image3` | `3d-renders/papa_char_1_3d.png` | 1024x1024 | Papa bear |
| `@Image4` | `3d-renders/mama_char_1_3d.png` | 1024x1024 | Mama bear |
| `@Image5` | `3d-renders/papa_char_3_3d.png` | 1024x1024 | Papa bear alt |
| `@Image6` | `3d-renders/mama_char_3_3d.png` | 1024x1024 | Mama bear alt |

`@Image1` is 16:9, so it works as a *reference* but not as a locked
1:1 first frame. If beat 1 drifts, crop it square with the doorway at
x = 64% and feed it as the start frame instead.

## Post steps

    ffmpeg -i voya-motion-desktop.mp4 -vf fps=24 -q:v 2 \
      public/assets/frames-desktop/frame_%04d.jpg

15 s @ 24 fps yields 360 frames; the site expects 361
(`frameCount` at `src/app/page.tsx:51`) — set it to the actual count.
If Seedance renders at 30 fps the `fps=24` filter resamples it.

Then in `src/app/page.tsx`: point the desktop branch (line ~209) at
`frames-desktop`, drop the `frames-web` alpha-cutout hack entirely, and
change the hardcoded canvas `720`/`1280` (lines 221-233, 346, 353) to the
square size for the desktop canvas. In the RIGHT COLUMN markup, replace
the `h-full aspect-[9/16]` wrapper with a full-bleed
`absolute inset-0 w-full h-full object-cover` canvas.
