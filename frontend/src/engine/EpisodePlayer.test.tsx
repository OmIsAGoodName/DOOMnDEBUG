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

  it('handles multi-tier choices without repeating earlier choices in a loop', () => {
    const multiChoicePlan: EpisodePlan = {
      schema_version: '1.0.0',
      episode_id: 'ep_multi_test',
      title: 'Multi Choice Test',
      age_band: '4-6',
      start_scene: 'sc1',
      interactive: true,
      cast: [
        {
          character_id: 'pip',
          name: 'Pip',
          species: 'owl',
          palette: { primary: '#3b82f6', secondary: '#60a5fa', accent: '#fbbf24', outline: '#1e293b' },
          voice: { engine_voice: 'en-US-Standard-C' },
        },
      ],
      scenes: [
        {
          scene_id: 'sc1',
          background_id: 'forest_day',
          mood: 'day',
          characters: [{ character_id: 'pip', position: [640, 360], facing: 'right' }],
          beats: [
            {
              beat_id: 'b1',
              min_duration: 1.0,
              choice: {
                default: 'c1_a',
                options: [
                  { id: 'c1_a', label: 'Go Left', next_scene: 'sc2a' },
                  { id: 'c1_b', label: 'Go Right', next_scene: 'sc2b' },
                ],
              },
            },
          ],
        },
        {
          scene_id: 'sc2a',
          background_id: 'forest_day',
          mood: 'day',
          characters: [{ character_id: 'pip', position: [640, 360], facing: 'right' }],
          beats: [
            {
              beat_id: 'b2a',
              min_duration: 1.0,
              choice: {
                default: 'c2_a',
                options: [
                  { id: 'c2_a', label: 'Climb Tree', next_scene: 'sc3a' },
                  { id: 'c2_b', label: 'Enter Cave', next_scene: 'sc3b' },
                ],
              },
            },
          ],
        },
        {
          scene_id: 'sc3a',
          background_id: 'forest_day',
          mood: 'day',
          characters: [{ character_id: 'pip', position: [640, 360], facing: 'right' }],
          beats: [
            {
              beat_id: 'b3',
              min_duration: 1.0,
            },
          ],
        },
      ],
    };

    const ref = createRef<EpisodePlayerHandle>();
    const choicesReceived: string[] = [];
    render(
      <EpisodePlayer
        ref={ref}
        plan={multiChoicePlan}
        audio={null}
        mode="live"
        onChoice={(info) => {
          choicesReceived.push(info.beatId);
        }}
      />
    );

    expect(ref.current).toBeTruthy();
    // Resolve choice 1
    ref.current?.resolveChoice('c1_a');
    expect(ref.current?.getChosenPath()).toContain('c1_a');
  });
});
