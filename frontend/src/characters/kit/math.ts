/**
 * VoxFable Character Drawing Kit: Pure Math & Color Utilities
 * 100% deterministic functions - no Math.random or Date.now.
 */

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function easeLinear(t: number): number {
  return clamp(t, 0, 1);
}

export function easeInOutQuad(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

export function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export function easeInOutSine(t: number): number {
  const c = clamp(t, 0, 1);
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

export function easeOutBack(t: number): number {
  const c = clamp(t, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(c - 1, 3) + c1 * Math.pow(c - 1, 2);
}

/**
 * Breathing expansion factor for organic living character idle.
 * Oscillates gently at ~0.4Hz expanding torso width and height ±1.5%.
 */
export function computeBreathing(time: number, speed = 1.0): { scaleX: number; scaleY: number; offsetY: number } {
  if (time <= 0) return { scaleX: 1.0, scaleY: 1.0, offsetY: 0 };
  const breath = Math.sin(time * speed * Math.PI);
  return {
    scaleX: 1.0 - breath * 0.015,
    scaleY: 1.0 + breath * 0.02,
    offsetY: breath * 2.0,
  };
}

/**
 * Deterministic blink factor as a pure function of time.
 * Returns 1.0 (eyes wide open) down to 0.0 (eyes shut) during a periodic blink.
 * Default: blinks every 3.5s for 0.16s duration.
 */
export function computeBlink(time: number, interval = 3.5, duration = 0.16): number {
  if (time <= 0 || interval <= 0) return 1.0;
  const cycleTime = Math.abs(time) % interval;
  if (cycleTime > duration) {
    return 1.0;
  }
  // Blink progress: 0 -> 1 -> 0
  const progress = cycleTime / duration;
  const halfBlink = Math.sin(progress * Math.PI);
  return Math.max(0, 1.0 - halfBlink);
}

export function parseHex(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return [0, 0, 0];
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return [r, g, b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const cr = clamp(Math.round(r), 0, 255).toString(16).padStart(2, '0');
  const cg = clamp(Math.round(g), 0, 255).toString(16).padStart(2, '0');
  const cb = clamp(Math.round(b), 0, 255).toString(16).padStart(2, '0');
  return `#${cr}${cg}${cb}`;
}

/**
 * Linearly interpolate between two hex colors.
 */
export function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = parseHex(c1);
  const [r2, g2, b2] = parseHex(c2);
  const factor = clamp(t, 0, 1);
  const r = lerp(r1, r2, factor);
  const g = lerp(g1, g2, factor);
  const b = lerp(b1, b2, factor);
  return rgbToHex(r, g, b);
}

/**
 * Lighten (amount > 0) or darken (amount < 0) a hex color.
 * amount range: -1.0 to 1.0
 */
export function shade(color: string, amount: number): string {
  const [r, g, b] = parseHex(color);
  const clampedAmount = clamp(amount, -1, 1);
  if (clampedAmount >= 0) {
    return rgbToHex(
      lerp(r, 255, clampedAmount),
      lerp(g, 255, clampedAmount),
      lerp(b, 255, clampedAmount)
    );
  } else {
    const darkenFactor = 1 + clampedAmount; // e.g. -0.2 -> 0.8
    return rgbToHex(r * darkenFactor, g * darkenFactor, b * darkenFactor);
  }
}
