import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render } from '@testing-library/react';
import liveDemoPlan from '@fixtures/episode_live_demo.json';
import type { EpisodePlan } from '@contracts';
import { LiveController } from './LiveController';

describe('LiveController', () => {
  const plan = liveDemoPlan as unknown as EpisodePlan;

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

  it('renders without throwing and mounts EpisodePlayer', () => {
    const onChoiceSelected = vi.fn();
    const onEnd = vi.fn();

    const { container } = render(
      <LiveController
        plan={plan}
        audio={null}
        onChoiceSelected={onChoiceSelected}
        onEnd={onEnd}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});
