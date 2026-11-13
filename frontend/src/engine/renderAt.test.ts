import { describe, it, expect } from 'vitest';
import quickDemoFixture from '@fixtures/episode_quick_demo.json';
import type { EpisodePlan } from '@contracts';
import { resolveTimeline } from './resolveTimeline';
import { renderAt } from './renderAt';

// Call-recording fake 2D rendering context
function createCallRecordingContext(): { ctx: CanvasRenderingContext2D; calls: string[] } {
  const calls: string[] = [];

  const record = (method: string, args: unknown[]) => {
    calls.push(`${method}(${args.map((a) => (typeof a === 'number' ? a.toFixed(2) : String(a))).join(',')})`);
  };

  const fakeCtx = {
    save: () => record('save', []),
    restore: () => record('restore', []),
    translate: (x: number, y: number) => record('translate', [x, y]),
    scale: (x: number, y: number) => record('scale', [x, y]),
    beginPath: () => record('beginPath', []),
    closePath: () => record('closePath', []),
    arc: (...args: unknown[]) => record('arc', args),
    roundRect: (...args: unknown[]) => record('roundRect', args),
    fillRect: (...args: unknown[]) => record('fillRect', args),
    strokeRect: (...args: unknown[]) => record('strokeRect', args),
    fill: () => record('fill', []),
    stroke: () => record('stroke', []),
    fillText: (text: string, x: number, y: number) => record('fillText', [text, x, y]),
    measureText: (text: string) => ({ width: text.length * 10 }),
    createLinearGradient: () => ({
      addColorStop: (offset: number, color: string) => record('addColorStop', [offset, color]),
    }),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1,
    font: '10px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
  } as unknown as CanvasRenderingContext2D;

  return { ctx: fakeCtx, calls };
}

describe('renderAt', () => {
  const plan = quickDemoFixture as unknown as EpisodePlan;
  const timeline = resolveTimeline(plan, null);

  it('renders at t=0, t=5, t=15 without throwing', () => {
    const { ctx } = createCallRecordingContext();
    expect(() => renderAt(ctx, timeline, 0)).not.toThrow();
    expect(() => renderAt(ctx, timeline, 5.0)).not.toThrow();
    expect(() => renderAt(ctx, timeline, 15.0)).not.toThrow();
  });

  it('is completely deterministic: calling renderAt twice with the same t produces identical call sequences', () => {
    const rec1 = createCallRecordingContext();
    const rec2 = createCallRecordingContext();

    renderAt(rec1.ctx, timeline, 2.5);
    renderAt(rec2.ctx, timeline, 2.5);

    expect(rec1.calls.length).toBeGreaterThan(0);
    expect(rec1.calls).toEqual(rec2.calls);
  });

  it('handles unknown character or background ids gracefully with placeholder and no throw', () => {
    const mutatedTimeline = JSON.parse(JSON.stringify(timeline));
    mutatedTimeline.scenes[0].backgroundId = 'unknown_alien_planet';
    mutatedTimeline.scenes[0].initialCharacters[0].character_id = 'unknown_creature';

    const { ctx } = createCallRecordingContext();
    expect(() => renderAt(ctx, mutatedTimeline, 1.0)).not.toThrow();
  });
});

