/**
 * VoxFable Background Renderer & Dispatcher
 *
 * Contract:
 * - drawBackground(ctx, id, t, w, h): void
 * - No mood tint applied here (the engine applies tinting).
 * - Deterministic pure function of t, w, h.
 * - Missing/unknown ids draw a safe placeholder and warn once. Never throw.
 */

import { drawForestDay } from './forest_day';

const warnedBackgrounds = new Set<string>();

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  id: string,
  t: number,
  w: number,
  h: number
): void {
  if (!ctx) return;

  const bgId = (id || '').toLowerCase().trim();

  switch (bgId) {
    case 'forest_day':
      drawForestDay(ctx, t, w, h);
      break;

    default:
      if (!warnedBackgrounds.has(bgId)) {
        console.warn(`[VoxFable Background] Unknown or unreleased background id: "${bgId}". Drawing placeholder.`);
        warnedBackgrounds.add(bgId);
      }
      drawPlaceholderBackground(ctx, bgId || 'unknown', t, w, h);
      break;
  }
}

function drawPlaceholderBackground(
  ctx: CanvasRenderingContext2D,
  id: string,
  t: number,
  w: number,
  h: number
): void {
  ctx.save();

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  skyGrad.addColorStop(0, '#94a3b8');
  skyGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Ground band (0.62 to 0.92)
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  // Ground band indicator line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.lineTo(w, h * 0.62);
  ctx.moveTo(0, h * 0.92);
  ctx.lineTo(w, h * 0.92);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Background Placeholder: ${id} (ground band 0.62 - 0.92)`, 30, 45);

  ctx.restore();
}

export { drawForestDay } from './forest_day';
export default drawBackground;
