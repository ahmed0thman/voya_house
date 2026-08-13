# VOYA HOUSE - Project Documentation

## 1. Design System & Aesthetics
The overall aesthetic was engineered to feel **cinematic, high-end, and immersive**.

- **Color Palette:** 
  - Primary Background: Deep obsidian black (`#080907`) to create depth and contrast.
  - Accents: Subtle organic tones including warm coffee (`#F1E6C3`) and earthy matcha/green (`#B7D39A`).
- **Typography:** 
  - A mix of modern sans-serif for UI utility, paired with elegant serif treatments for primary brand messaging.
  - High-contrast font weights and tracking to invoke a premium editorial feel.
- **Branding Assets:**
  - Exchanged standard text for SVG branding logic.
  - Loading Screen uses the "Voya House" lockup (`Asset 11`).
  - Contact section utilizes a floating badge (`Asset 21`).
  - Footer utilizes an elegant emblem (`Asset 8`).

## 2. Technical Architecture
- **Framework:** Next.js 16 (App Router) + TypeScript.
- **Styling:** Tailwind CSS + Vanilla CSS (`index.css`) for complex pseudo-element interactions.
- **Animation Engine:** GSAP (GreenSock) core, utilizing `ScrollTrigger` and `ScrollToPlugin`.

## 3. The Canvas Image Sequence Pipeline (The "Apple" Method)
The most significant architectural decision was migrating from a standard HTML5 `<video>` tag to a `<canvas>` image sequence to handle the background cinematic.

- **The Problem:** Scrubbing an `.mp4` video backwards and forwards based on scroll position is notoriously laggy on mobile devices because hardware decoders struggle with rapid, random-access frame seeking.
- **The Solution:** We extracted all **361 frames** of `voya-motion-landing.mp4` into highly compressed `.jpg` images.
- **Execution:**
  - A custom preloader loops through and loads all 361 images into browser memory.
  - The loader screen blocks entry until the very first frame is safely loaded into the buffer (with a strict 3.5s fallback timer to prevent iOS Safari from hanging).
  - As the user scrolls, GSAP maps the exact scroll percentage (0 to 1) to an array index (0 to 360) and instantly draws the corresponding frame to a `<canvas>` context using `drawImage()`.
  - **Result:** Buttery-smooth, 60fps, zero-lag scrolling on all mobile devices.

## 4. Scroll Orchestration & Animations

### Scroll Hijacking
- Instead of relying on native scrollbars, we implemented a custom event interceptor for `wheel`, `touchmove`, and `keydown`.
- **Behavior:** Flicking the scroll wheel instantly calculates the target section and uses `gsap.scrollTo` to fluidly snap the user to the exact start/end of the semantic section.

### The Master Timeline (`masterTl`)
A single, massive GSAP timeline orchestrates the entire site based on the scroll position:
1. **Canvas Scrubbing:** Ties the drawn frame to the scroll progress.
2. **Dynamic Overlay:** Fades a dark overlay in and out (`rgba(0,0,0,0.4)`) to create contrast behind text elements exactly when they appear.
3. **Ground Glow:** Injects subtle, blurred, color-coded floor reflections (`blur-[30px]`) beneath the characters based on the scene (Coffee Glow vs. Papa Glow).
4. **Text Reveals:** Utilizes `y: 50, autoAlpha: 0` staggered animations to gracefully lift typography into the viewport.

## 5. UI & Component Details

### The Contact Section ("Theater Override")
- **Concept:** Because the cinematic ends abruptly at Section 5, we implemented a "theater override" effect. The video container becomes `fixed`, and the Contact section (`z-20`) slides up *over* the video, creating the illusion of a physical curtain closing on the stage.
- **Form UI:** 
  - Inputs utilize floating labels that translate upwards when focused (`peer-focus`).
  - Textareas use the bleeding-edge `field-sizing: content` CSS property to automatically grow exactly to the height of the user's text without needing JavaScript resize observers.
  - Focus states trigger a glowing bottom border implemented purely via `::after` pseudo-elements to prevent layout shifts.

### The Reveal Footer
- **Concept:** Designed as an "out of the box" premium footer.
- **Parallax:** It sits behind the content at the bottom of the DOM. As the user scrolls past the Contact section, the footer is slowly revealed via a negative z-index parallax effect.
- **Details:** Minimalist architecture, SVG branding, and clean SVG social icons (Instagram, Twitter, Location).
