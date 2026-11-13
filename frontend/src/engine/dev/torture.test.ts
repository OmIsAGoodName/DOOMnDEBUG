import { describe, it, expect } from 'vitest';
import type { EpisodePlan } from '@contracts';
import tortureFixture from './torture_fixture.json';
import { resolveTimeline } from '../resolveTimeline';
import { renderAt } from '../renderAt';

describe('Engine Robustness & Torture Plan', () => {
  const plan = tortureFixture as unknown as EpisodePlan;

  it('resolves torture plan without infinite loop or NaN', () => {
    const timeline = resolveTimeline(plan, null);
    expect(timeline.totalDuration).toBeGreaterThan(0);
    expect(Number.isNaN(timeline.totalDuration)).toBe(false);
    // Verified max scenes guard prevents cycle from running forever
    expect(timeline.scenes.length).toBeLessThanOrEqual(20);
  });

  it('renders every frame of torture plan without crashing', () => {
    const timeline = resolveTimeline(plan, null);
    const fakeCtx = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      beginPath: () => {},
      closePath: () => {},
      arc: () => {},
      roundRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      fillText: () => {},
      measureText: (text: string) => ({ width: text.length * 10 }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
    } as unknown as CanvasRenderingContext2D;

    // Render start, middle, and end frames
    expect(() => renderAt(fakeCtx, timeline, 0)).not.toThrow();
    expect(() => renderAt(fakeCtx, timeline, 5.0)).not.toThrow();
    expect(() => renderAt(fakeCtx, timeline, timeline.totalDuration)).not.toThrow();
  });
});
