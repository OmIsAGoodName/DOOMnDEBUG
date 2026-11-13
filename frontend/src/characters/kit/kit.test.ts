import { describe, it, expect } from 'vitest';
import {
  clamp,
  lerp,
  easeLinear,
  easeInOutQuad,
  easeInOutSine,
  easeOutBack,
  computeBlink,
  parseHex,
  rgbToHex,
  lerpColor,
  shade
} from './math';

describe('Drawing Kit Pure Math', () => {
  it('clamp restricts values to min and max', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('lerp interpolates between a and b', () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it('easing functions adhere to boundary conditions [0, 1]', () => {
    for (const easeFn of [easeLinear, easeInOutQuad, easeInOutSine, easeOutBack]) {
      expect(easeFn(0)).toBeCloseTo(0, 4);
      expect(easeFn(1)).toBeCloseTo(1, 4);
    }
    expect(easeInOutQuad(0.5)).toBeCloseTo(0.5, 4);
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 4);
  });

  it('computeBlink is deterministic and cycles predictably', () => {
    // Exactly at time 0, blink is 1 (eyes open)
    expect(computeBlink(0)).toBe(1);
    // At t = 1.0, outside blink duration (0.16s), eyes are open (1)
    expect(computeBlink(1.0)).toBe(1);
    // During midpoint of blink duration (e.g. at 0.08s of a 3.5s cycle)
    const midBlink = computeBlink(0.08, 3.5, 0.16);
    expect(midBlink).toBeCloseTo(0, 1); // Eyes nearly or fully closed
    // Periodic repetition at t = 3.58s
    const nextMidBlink = computeBlink(3.58, 3.5, 0.16);
    expect(nextMidBlink).toBeCloseTo(0, 1);
  });

  it('hex parsing and formatting works correctly', () => {
    expect(parseHex('#ff00aa')).toEqual([255, 0, 170]);
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(rgbToHex(255, 0, 170)).toBe('#ff00aa');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('lerpColor smoothly blends between two colors', () => {
    const black = '#000000';
    const white = '#ffffff';
    expect(lerpColor(black, white, 0)).toBe('#000000');
    expect(lerpColor(black, white, 1)).toBe('#ffffff');
    expect(lerpColor(black, white, 0.5)).toBe('#808080');
  });

  it('shade lightens and darkens colors properly', () => {
    const base = '#808080';
    const lighter = shade(base, 0.5);
    const darker = shade(base, -0.5);
    expect(lighter).toBe('#c0c0c0');
    expect(darker).toBe('#404040');
  });
});
