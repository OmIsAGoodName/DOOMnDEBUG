/**
 * VoxFable Character Drawing Kit: Canvas 2D Primitives & Facial Features
 * Pure drawing helpers used across characters.
 */

import { clamp } from './math';

export function setupOutline(ctx: CanvasRenderingContext2D, width: number, color: string): void {
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

export function ellipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation = 0
): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), rotation, 0, Math.PI * 2);
}

export function roundedBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: number | [number, number, number, number] = 20
): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radii);
  } else {
    // Fallback for environments lacking roundRect
    const r = typeof radii === 'number' ? radii : radii[0] || 10;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/**
 * Soft ground shadow beneath character's feet.
 */
export function shadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number = w * 0.28,
  alpha = 0.25
): void {
  ctx.save();
  ctx.fillStyle = `rgba(30, 41, 59, ${clamp(alpha, 0, 1)})`;
  ellipse(ctx, x, y, w / 2, h / 2);
  ctx.fill();
  ctx.restore();
}

export interface EyeOptions {
  x: number;
  y: number;
  size: number;
  expression: string;
  blink: number; // 1 = open, 0 = closed
  outlineColor?: string;
  pupilColor?: string;
  scleraColor?: string;
}

export function eye(ctx: CanvasRenderingContext2D, opts: EyeOptions): void {
  const {
    x,
    y,
    size,
    expression,
    blink,
    outlineColor = '#1e293b',
    pupilColor = '#1e293b',
    scleraColor = '#ffffff'
  } = opts;

  ctx.save();
  ctx.translate(x, y);

  const effectiveBlink = clamp(blink, 0, 1);

  // If eye is closed or squinching in laugh/happy
  if (effectiveBlink < 0.15 || expression === 'laugh') {
    ctx.beginPath();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = Math.max(2, size * 0.15);
    ctx.lineCap = 'round';
    // Happy arch curve
    ctx.arc(0, 0, size * 0.65, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Sclera (eyeball)
  const ry = size * effectiveBlink;
  const rx = size;

  ctx.fillStyle = scleraColor;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.lineJoin = 'round';

  ellipse(ctx, 0, 0, rx, ry);
  ctx.fill();
  ctx.stroke();

  // Clip within sclera for pupil & shine
  ctx.save();
  ctx.clip();

  // Pupil position & size based on expression
  let pupilSize = size * 0.52;
  let pupilOffsetX = size * 0.2; // default looking right
  let pupilOffsetY = 0;

  if (expression === 'surprised') {
    pupilSize = size * 0.35;
    pupilOffsetX = size * 0.1;
  } else if (expression === 'excited') {
    pupilSize = size * 0.58;
    pupilOffsetX = size * 0.22;
  } else if (expression === 'sad' || expression === 'worried') {
    pupilOffsetY = size * 0.15;
    pupilOffsetX = size * 0.05;
  }

  // Pupil
  ctx.fillStyle = pupilColor;
  ellipse(ctx, pupilOffsetX, pupilOffsetY, pupilSize, pupilSize * effectiveBlink);
  ctx.fill();

  // Highlight twinkle (sparkle dots)
  if (effectiveBlink > 0.4) {
    ctx.fillStyle = '#ffffff';
    // Main highlight
    ellipse(
      ctx,
      pupilOffsetX - pupilSize * 0.3,
      pupilOffsetY - pupilSize * 0.3 * effectiveBlink,
      pupilSize * 0.35,
      pupilSize * 0.35 * effectiveBlink
    );
    ctx.fill();

    // Secondary sparkle
    if (expression === 'excited' || expression === 'happy') {
      ellipse(
        ctx,
        pupilOffsetX + pupilSize * 0.25,
        pupilOffsetY + pupilSize * 0.25 * effectiveBlink,
        pupilSize * 0.18,
        pupilSize * 0.18 * effectiveBlink
      );
      ctx.fill();
    }
  }

  ctx.restore(); // restore clip
  ctx.restore(); // restore translate
}

export interface BrowOptions {
  x: number;
  y: number;
  size: number;
  expression: string;
  color?: string;
  width?: number;
}

export function brows(ctx: CanvasRenderingContext2D, opts: BrowOptions): void {
  const {
    x,
    y,
    size,
    expression,
    color = '#1e293b',
    width = Math.max(2.5, size * 0.2)
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  switch (expression) {
    case 'happy':
    case 'laugh':
      // Gentle cheerful arch raised
      ctx.arc(0, size * 0.4, size * 0.8, Math.PI * 1.25, Math.PI * 1.75, false);
      break;

    case 'sad':
      // Inner side raised, outer drooped
      ctx.moveTo(-size * 0.7, size * 0.1);
      ctx.quadraticCurveTo(0, -size * 0.4, size * 0.7, size * 0.3);
      break;

    case 'surprised':
      // High dramatic arch
      ctx.arc(0, 0, size * 0.85, Math.PI * 1.2, Math.PI * 1.8, false);
      break;

    case 'worried':
      // Tilted furrowed brows
      ctx.moveTo(-size * 0.7, -size * 0.1);
      ctx.lineTo(size * 0.6, -size * 0.45);
      break;

    case 'excited':
      // High perky angled brow
      ctx.moveTo(-size * 0.6, -size * 0.3);
      ctx.quadraticCurveTo(0, -size * 0.6, size * 0.7, -size * 0.2);
      break;

    case 'neutral':
    default:
      // Subtle friendly resting curve
      ctx.moveTo(-size * 0.6, 0);
      ctx.quadraticCurveTo(0, -size * 0.2, size * 0.6, 0);
      break;
  }
  ctx.stroke();
  ctx.restore();
}

export interface MouthOptions {
  x: number;
  y: number;
  size: number;
  shape: 'closed' | 'half' | 'wide';
  expression: string;
  color?: string;
  tongueColor?: string;
  innerColor?: string;
}

export function mouth(ctx: CanvasRenderingContext2D, opts: MouthOptions): void {
  const {
    x,
    y,
    size,
    shape,
    expression,
    color = '#1e293b',
    tongueColor = '#ff6b6b',
    innerColor = '#7f1d1d'
  } = opts;

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.16);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (shape === 'closed') {
    ctx.beginPath();
    if (expression === 'sad' || expression === 'worried') {
      // Small downturned curve
      ctx.arc(0, size * 0.6, size * 0.6, Math.PI * 1.25, Math.PI * 1.75, true);
    } else if (expression === 'surprised') {
      // Small "o" dot
      ctx.ellipse(0, 0, size * 0.3, size * 0.38, 0, 0, Math.PI * 2);
    } else {
      // Cheerful subtle smile
      ctx.arc(0, -size * 0.2, size * 0.6, Math.PI * 0.2, Math.PI * 0.8, false);
    }
    ctx.stroke();
  } else if (shape === 'half') {
    // Half-open crescent / bean mouth
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, 0);
    ctx.quadraticCurveTo(0, size * 0.9, size * 0.7, 0);
    ctx.closePath();

    ctx.fillStyle = innerColor;
    ctx.fill();
    ctx.stroke();

    // Tongue
    ctx.save();
    ctx.clip();
    ctx.fillStyle = tongueColor;
    ctx.beginPath();
    ctx.arc(0, size * 0.85, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Wide open expressive mouth
    ctx.beginPath();
    ctx.ellipse(0, size * 0.2, size * 0.85, size * 0.95, 0, 0, Math.PI * 2);

    ctx.fillStyle = innerColor;
    ctx.fill();
    ctx.stroke();

    // Tongue
    ctx.save();
    ctx.clip();
    ctx.fillStyle = tongueColor;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.75, size * 0.65, size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Small upper tooth accent for cute cartoon kid/creature look
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-size * 0.25, -size * 0.7, size * 0.5, size * 0.35, [0, 0, 4, 4]);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Two-segment cartoon limb (for arms or legs).
 */
export function limb(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  angle1: number,
  len1: number,
  angle2: number,
  len2: number,
  width: number,
  fillColor: string,
  outlineColor: string
): void {
  const [x0, y0] = from;
  const x1 = x0 + Math.cos(angle1) * len1;
  const y1 = y0 + Math.sin(angle1) * len1;
  const x2 = x1 + Math.cos(angle2) * len2;
  const y2 = y1 + Math.sin(angle2) * len2;

  ctx.save();
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = width + 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = fillColor;
  ctx.lineWidth = width;
  ctx.stroke();

  ctx.restore();
}
