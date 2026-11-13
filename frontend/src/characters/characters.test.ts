import { describe, it, expect, vi } from 'vitest';
import { drawCharacter } from './index';
import { drawOwl } from './owl';
import { drawBackground } from '../backgrounds';
import type { CharacterDrawState } from '@contracts';

describe('Character & Background Art Contract Verification', () => {
  // Mock canvas 2D context
  const createMockContext = () => {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      }))
    } as unknown as CanvasRenderingContext2D;
  };

  it('drawOwl executes deterministically without errors across all 8 poses', () => {
    const poses = ['idle', 'walk', 'talk', 'wave', 'laugh', 'listen', 'react', 'point'];
    const ctx = createMockContext();

    for (const pose of poses) {
      const state: CharacterDrawState = {
        characterId: 'pip_owl',
        species: 'owl',
        x: 640,
        y: 500,
        scale: 1.0,
        facing: 'right',
        palette: {
          primary: '#8b5e3c',
          secondary: '#d9b38c',
          accent: '#f2a65a',
          outline: '#3b2a1e'
        },
        accessories: ['scarf', 'glasses', 'hat', 'bow', 'backpack', 'cape'],
        expression: 'happy',
        mouth: 'half',
        pose,
        poseT: 0.5,
        time: 1.25
      };

      expect(() => drawOwl(ctx, state)).not.toThrow();
    }
  });

  it('drawCharacter handles missing/sparse data gracefully without throwing', () => {
    const ctx = createMockContext();
    const sparseState = {
      characterId: 'unknown_creature',
      species: 'mysterious_beast',
      x: 100,
      y: 200,
      scale: 1.0,
      facing: 'right'
    } as unknown as CharacterDrawState;

    expect(() => drawCharacter(ctx, sparseState)).not.toThrow();
  });

  it('drawBackground handles known and unknown IDs without throwing', () => {
    const ctx = createMockContext();
    expect(() => drawBackground(ctx, 'forest_day', 2.5, 1280, 720)).not.toThrow();
    expect(() => drawBackground(ctx, 'unknown_space', 2.5, 1280, 720)).not.toThrow();
  });
});
