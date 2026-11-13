/**
 * VoxFable Character Renderer & Dispatcher
 *
 * Art Contract (Frozen):
 * - Characters ALWAYS draw facing right (engine handles left mirroring via ctx.scale(-1, 1)).
 * - Origin is at feet center (0, 0).
 * - Base height is ~300 px at scale 1.0.
 * - Missing data must never throw.
 * - Unknown species draws a visible placeholder and warns once.
 */

import type { CharacterDrawState } from '@contracts';
import { drawOwl } from './owl';
import { shadow, roundedBody } from './kit';

// Track warned species to avoid console spam in 60fps render loops
const warnedSpecies = new Set<string>();

export function drawCharacter(ctx: CanvasRenderingContext2D, state: CharacterDrawState): void {
  if (!state || !ctx) return;

  const species = (state.species || '').toLowerCase();

  switch (species) {
    case 'owl':
      drawOwl(ctx, state);
      break;

    default:
      if (!warnedSpecies.has(species)) {
        console.warn(`[VoxFable Art] Unknown or unreleased character species: "${species}". Drawing placeholder.`);
        warnedSpecies.add(species);
      }
      drawPlaceholderCharacter(ctx, state);
      break;
  }
}

/**
 * Friendly, robust visual placeholder that never throws.
 */
function drawPlaceholderCharacter(
  ctx: CanvasRenderingContext2D,
  state: CharacterDrawState
): void {
  const scale = state.scale || 1.0;
  const palette = state.palette || {
    primary: '#64748b',
    secondary: '#cbd5e1',
    accent: '#f59e0b',
    outline: '#1e293b'
  };

  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.scale(scale, scale);

  // Ground shadow
  shadow(ctx, 0, 0, 120, 30, 0.25);

  // Body capsule
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  roundedBody(ctx, -45, -180, 90, 175, [40, 40, 20, 20]);
  ctx.fill();
  ctx.stroke();

  // Belly patch
  ctx.fillStyle = palette.secondary;
  roundedBody(ctx, -30, -120, 60, 100, [20, 20, 15, 15]);
  ctx.fill();
  ctx.stroke();

  // Head circle
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.arc(0, -220, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Friendly placeholder eyes
  ctx.fillStyle = palette.outline;
  ctx.beginPath();
  ctx.arc(-15, -225, 6, 0, Math.PI * 2);
  ctx.arc(15, -225, 6, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -215, 12, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Badge with species name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.species || 'Unknown', 0, -80);

  ctx.restore();
}

export { drawOwl } from './owl';
export default drawCharacter;
