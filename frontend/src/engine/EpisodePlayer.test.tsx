import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render } from '@testing-library/react';
import quickDemoPlan from '@fixtures/episode_quick_demo.json';
import type { EpisodePlan } from '@contracts';
import { EpisodePlayer, type EpisodePlayerHandle } from './index';

describe('EpisodePlayer', () => {
  const plan = quickDemoPlan as unknown as EpisodePlan;

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      roundRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders canvas element and exposes EpisodePlayerHandle methods', () => {
    const ref = createRef<EpisodePlayerHandle>();
    const onChoice = vi.fn();
    const onEnd = vi.fn();

    const { container } = render(
      <EpisodePlayer
        ref={ref}
        plan={plan}
        audio={null}
        mode="watch"
        onChoice={onChoice}
        onEnd={onEnd}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.width).toBe(1280);
    expect(canvas?.height).toBe(720);

    expect(ref.current).toBeTruthy();
    expect(typeof ref.current?.play).toBe('function');
    expect(typeof ref.current?.pause).toBe('function');
    expect(typeof ref.current?.seek).toBe('function');
    expect(typeof ref.current?.resolveChoice).toBe('function');
    expect(typeof ref.current?.getTime).toBe('function');
    expect(typeof ref.current?.getDuration).toBe('function');
    expect(typeof ref.current?.getChosenPath).toBe('function');

    expect(ref.current?.getTime()).toBe(0);
    expect(ref.current?.getDuration()).toBeGreaterThan(0);
  });
});
