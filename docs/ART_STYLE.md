# VoxFable Art Style Guide

**Owner**: Nigel  
**Target Resolution**: 1280x720 Canvas 2D  
**Aesthetic**: Warm, comforting, child-friendly storybook cartoon (handcrafted 2D vector look; distinctly original).

---

## 1. Core Palette & Shading

- **Universal Outlines**: `#3b2a1e` (Woodland Umber) or `#1e293b` (Deep Slate). Always rounded caps and joins (`lineCap = 'round'`, `lineJoin = 'round'`).
- **Core Environment & Accent Swatches**:
  - Sky: `#70d6ff`, `#b8e0d2`, `#e8f5e9`
  - Foliage & Meadow: `#2d6a4f` (deep), `#52b788` (vibrant), `#95d5b2` (pale)
  - Sun & Accent Gold: `#ffb703`, `#ffd166`
  - Earth & Path: `#6f4e37` (bark), `#e9c46a` (path), `#d4a373` (sand)
  - Hero Accents: `#e63946` (warm scarlet), `#457b9d` (storybook navy)
- **Species Defaults**:
  - `owl` (`pip_owl`): Primary `#8b5e3c`, Secondary `#d9b38c`, Accent `#f2a65a`, Outline `#3b2a1e`.
  - `fox` (`rusty_fox`): Primary `#d95f32`, Secondary `#f4c28d`, Accent `#2f3e46`, Outline `#2b1e1a`.
  - `kid` (`mia_kid`): Primary `#3a86ff`, Secondary `#ffbe0b`, Accent `#ff006e`, Outline `#1e293b`.

## 2. Proportions, Origin & Outlines

- **Height at Scale 1.0**: ~280 to 310 px.
- **Origin**: Center of feet `(0, 0)` on the ground.
- **Shape Language**: Big soft round heads (40-45% of total height), compact expressive bodies, big warm eyes.
- **Outline Width**: 3.5 to 4.5 px on 1280x720 canvas. Inner details use 2.0 to 2.5 px.
- **Ground Shadow**: Soft ellipse `shadow(ctx, 0, 0, 140, 36, 0.25)` anchored under the feet.

## 3. Facial Construction & Expressions

- **Eyes**: Large expressive sclera with high pupil contrast and dual sparkle highlights. Blink is a deterministic function of `time` (`computeBlink(time)`).
- **6 Expressions**:
  - `neutral`: Soft curved resting brows, centered pupils.
  - `happy`: Cheek-squinted upward eye arcs, raised happy brows.
  - `sad`: Drooped outer brows, slightly lowered gaze.
  - `surprised`: Wide circular pupils, high raised brows.
  - `worried`: Inward-tilted furrowed brows, small pupils.
  - `excited`: Tilted perky brows, enlarged pupils with double sparkles.
- **3 Mouth Shapes**:
  - `closed`: Gentle resting smile or subtle curve.
  - `half`: Half-open bean/crescent with pink tongue.
  - `wide`: Wide joyful open mouth with inner shadow, tongue, and upper tooth accent.

## 4. 8 Animation Poses

All motion is a deterministic function of continuous `time` and `poseT`:
1. `idle`: Soft breathing body bob (`sin(t * 2.5) * 3`), subtle head tilt, natural periodic blink.
2. `walk`: Dynamic leg swing cycle (`sin(t * 7)`), vertical bounce on each step, alternating arm/wing swing.
3. `talk`: Rhythmic head nod/bob and communicative hand/wing gesture (`sin(t * 6)`).
4. `wave`: Right arm/wing raised high waving back and forth (`sin(t * 12) * 0.3`).
5. `laugh`: Cheerful rapid body bounce (`-abs(sin(t * 15)) * 6`), squinching eyes, bouncing ears/tufts.
6. `listen`: Head tilted attentively (`+0.18 rad`), stationary body, alert ears.
7. `react`: Expressive vertical hop (`-jump * 28`), arms/wings flaring, wide eyes.
8. `point`: Right arm/wing extended straight forward pointing to the right.

## 5. 6 Standard Accessories

Drawn in strict depth-layer order:
1. `cape`: Flows behind back, gentle wave flutter driven by `t`.
2. `backpack`: Worn on back with shoulder strap and gold buckle.
3. `scarf`: Cozy wrapped neckband with trailing patterned end waving gently.
4. `bow`: Cute center bow tie at collar.
5. `glasses`: Warm brass rounded frames resting comfortably on bridge of nose.
6. `hat`: Stylized feathered acorn cap, beret, or sunhat resting atop head.

## 6. Background Layering Rules

Every background strictly obeys depth planes:
1. **Sky**: Soft gradients and atmospheric mist.
2. **Far Distance**: Rolling hills, distant mountain peaks, or horizon silhouettes.
3. **Midground**: Environmental features (trees, buildings, foliage) with gentle ambient sway (`sin(t)`).
4. **Ground Band**: Strictly bounded between `y = 0.62 * h` and `y = 0.92 * h`. Characters stand on this band.
5. **Foreground Accents**: Grassy tufts, rocks, flowers, or path verges.
6. **Ambient Motion**: Drifting clouds, fireflies, falling leaves, or dust sparkles.
*Rule*: Backgrounds never apply color tinting; Maegan's engine applies mood tints overlay.

## 7. "Is This Polished?" Checklist

- [ ] **Contrast**: Character silhouettes clearly stand out against all 5 backgrounds.
- [ ] **Legibility**: Faces and poses remain readable down to 0.5x thumbnail scale.
- [ ] **Outline Consistency**: Round line joins throughout; no jagged spikes or missing strokes.
- [ ] **No Clipping**: Arms, wings, and accessories stay within reasonable bounding boxes across all poses.
- [ ] **Zero Randomness**: 100% deterministic rendering for any given timestamp `t`.
