import type { CharacterDrawState } from '@contracts';

export function drawCharacter(ctx: CanvasRenderingContext2D, state: CharacterDrawState): void {
  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.scale(state.scale, state.scale);

  // Body: colored rounded rect
  ctx.fillStyle = state.palette.primary || '#8b5e3c';
  ctx.strokeStyle = state.palette.outline || '#000000';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(-40, -120, 80, 120, [20, 20, 10, 10]);
  ctx.fill();
  ctx.stroke();

  // Head: circle
  ctx.fillStyle = state.palette.secondary || '#d9b38c';
  ctx.beginPath();
  ctx.arc(0, -150, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Face / eyes
  ctx.fillStyle = state.palette.accent || '#3b2a1e';
  ctx.beginPath();
  ctx.arc(15, -155, 6, 0, Math.PI * 2);
  ctx.fill();

  // Label species
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.species, 0, -60);

  ctx.restore();
}

export default drawCharacter;

