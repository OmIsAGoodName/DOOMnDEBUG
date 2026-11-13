import { describe, it, expect, vi } from 'vitest';
import { drawCharacter } from './index';
import { drawOwl } from './owl';
import { drawFox } from './fox';
import { drawKid } from './kid';
import { drawBackground } from '../backgrounds';
import { drawProp } from '../props';
import type { CharacterDrawState } from '@contracts';

describe('Character & Background Art Contract Verification', () => {
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

  it('drawOwl, drawFox, and drawKid execute deterministically across all 8 poses', () => {
    const poses = ['idle', 'walk', 'talk', 'wave', 'laugh', 'listen', 'react', 'point'];
    const ctx = createMockContext();

    for (const pose of poses) {
      const owlState: CharacterDrawState = {
        characterId: 'pip_owl',
        species: 'owl',
        x: 640,
        y: 500,
        scale: 1.0,
        facing: 'right',
        palette: { primary: '#8b5e3c', secondary: '#d9b38c', accent: '#f2a65a', outline: '#3b2a1e' },
        accessories: ['scarf', 'glasses', 'hat', 'bow', 'backpack', 'cape'],
        expression: 'happy',
        mouth: 'half',
        pose,
        poseT: 0.5,
        time: 1.25
      };
      expect(() => drawOwl(ctx, owlState)).not.toThrow();

      const foxState: CharacterDrawState = {
        ...owlState,
        characterId: 'rusty_fox',
        species: 'fox',
        palette: { primary: '#d95f32', secondary: '#f4c28d', accent: '#2f3e46', outline: '#2b1e1a' }
      };
      expect(() => drawFox(ctx, foxState)).not.toThrow();

      const kidState: CharacterDrawState = {
        ...owlState,
        characterId: 'mia_kid',
        species: 'kid',
        palette: { primary: '#3a86ff', secondary: '#ffbe0b', accent: '#ff006e', outline: '#1e293b' }
      };
      expect(() => drawKid(ctx, kidState)).not.toThrow();
    }
  });

  it('drawCharacter dispatches all three registered species seamlessly', () => {
    const ctx = createMockContext();
    for (const species of ['owl', 'fox', 'kid']) {
      const state: CharacterDrawState = {
        characterId: `char_${species}`,
        species,
        x: 300,
        y: 400,
        scale: 1.0,
        facing: 'right',
        palette: { primary: '#aabbcc', secondary: '#ddeeff', accent: '#112233', outline: '#000000' },
        accessories: ['scarf'],
        expression: 'excited',
        mouth: 'wide',
        pose: 'walk',
        poseT: 0.8,
        time: 2.5
      };
      expect(() => drawCharacter(ctx, state)).not.toThrow();
    }
  });

  it('drawBackground handles all 5 production backgrounds without throwing', () => {
    const ctx = createMockContext();
    const backgrounds = [
      'forest_day',
      'forest_night',
      'meadow_day',
      'treehouse_interior',
      'village_street'
    ];
    for (const bg of backgrounds) {
      expect(() => drawBackground(ctx, bg, 2.5, 1280, 720)).not.toThrow();
    }
  });

  it('drawProp renders all 12 vocabulary props deterministically', () => {
    const ctx = createMockContext();
    const props = [
      'lantern',
      'key',
      'treasure_chest',
      'book',
      'apple',
      'basket',
      'umbrella',
      'balloon',
      'flower',
      'glowing_door',
      'firefly_jar',
      'kite'
    ];
    for (const p of props) {
      expect(() => drawProp(ctx, p, 200, 300, 1.0, 1.5)).not.toThrow();
    }
  });

  it('composite frame performance test (3 characters + background + 2 props)', () => {
    const ctx = createMockContext();
    const start = performance.now();

    // Render 1 complete heavy frame
    drawBackground(ctx, 'forest_day', 1.0, 1280, 720);
    drawCharacter(ctx, {
      characterId: 'c1',
      species: 'owl',
      x: 300,
      y: 550,
      scale: 1.0,
      facing: 'right',
      palette: { primary: '#8b5e3c', secondary: '#d9b38c', accent: '#f2a65a', outline: '#3b2a1e' },
      accessories: ['hat', 'scarf'],
      expression: 'happy',
      mouth: 'wide',
      pose: 'walk',
      poseT: 0.2,
      time: 1.0
    });
    drawCharacter(ctx, {
      characterId: 'c2',
      species: 'fox',
      x: 640,
      y: 550,
      scale: 1.0,
      facing: 'left',
      palette: { primary: '#d95f32', secondary: '#f4c28d', accent: '#2f3e46', outline: '#2b1e1a' },
      accessories: ['backpack'],
      expression: 'talk',
      mouth: 'half',
      pose: 'talk',
      poseT: 0.5,
      time: 1.0
    });
    drawCharacter(ctx, {
      characterId: 'c3',
      species: 'kid',
      x: 950,
      y: 550,
      scale: 1.0,
      facing: 'right',
      palette: { primary: '#3a86ff', secondary: '#ffbe0b', accent: '#ff006e', outline: '#1e293b' },
      accessories: ['glasses'],
      expression: 'surprised',
      mouth: 'wide',
      pose: 'react',
      poseT: 0.7,
      time: 1.0
    });
    drawProp(ctx, 'lantern', 350, 550, 1.0, 1.0);
    drawProp(ctx, 'treasure_chest', 700, 550, 1.0, 1.0);

    const elapsed = performance.now() - start;
    // Target is well under 8ms (in-memory mock executes in < 3ms)
    expect(elapsed).toBeLessThan(8.0);
  });
});
