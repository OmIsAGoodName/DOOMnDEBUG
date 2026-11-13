/**
 * VoxFable Character: Toby the Turtle (`toby_turtle`, species: 'turtle')
 *
 * Requirements:
 * - Faces RIGHT (engine handles left mirroring via ctx.scale(-1, 1))
 * - Origin at feet center (0, 0)
 * - Reference height ~300 px at scale 1.0
 * - 8 poses, 6 expressions, 3 mouth shapes, 6 accessories
 * - Pure & deterministic from state inputs
 */

import type { CharacterDrawState, Palette } from '@contracts';
import {
  setupOutline,
  roundedBody,
  ellipse,
  shadow,
  eye,
  brows,
  computeBlink,
  shade,
  clamp
} from './kit';

const DEFAULT_PALETTE: Palette = {
  primary: '#15803d',   // Deep forest green shell
  secondary: '#86efac', // Light pastel lime green skin
  accent: '#fef08a',    // Warm buttercup yellow shell trim / belly
  outline: '#14532d'    // Dark hunter green outline
};

export function drawTurtle(ctx: CanvasRenderingContext2D, state: CharacterDrawState): void {
  const palette: Palette = {
    primary: state.palette?.primary || DEFAULT_PALETTE.primary,
    secondary: state.palette?.secondary || DEFAULT_PALETTE.secondary,
    accent: state.palette?.accent || DEFAULT_PALETTE.accent,
    outline: state.palette?.outline || DEFAULT_PALETTE.outline
  };

  const scale = state.scale || 1.0;
  const time = state.time || 0;
  const poseT = state.poseT || 0;
  const pose = state.pose || 'idle';
  const expression = state.expression || 'neutral';
  const mouthShape = state.mouth || 'closed';
  const accessories = state.accessories || [];

  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.scale(scale, scale);

  const strokeW = 4;
  setupOutline(ctx, strokeW, palette.outline);

  // 1. Pose dynamics
  let bodyYOffset = 0;
  let headExtend = 0;
  let bodyRotation = 0;
  let frontLegAngle = 0;
  let backLegAngle = 0;
  let armAngle = 0;

  switch (pose) {
    case 'walk': {
      // Deliberate, cute slow walk with secondary waddle tilt
      const walkCycle = time * 3.5;
      bodyYOffset = -Math.abs(Math.sin(walkCycle)) * 6;
      headExtend = Math.sin(walkCycle) * 8;
      bodyRotation = Math.sin(walkCycle) * 0.05;
      frontLegAngle = Math.sin(walkCycle) * 0.35;
      backLegAngle = -Math.sin(walkCycle) * 0.35;
      break;
    }
    case 'talk': {
      headExtend = 6 + Math.sin(time * 5.0) * 4;
      armAngle = -0.3 + Math.sin(time * 5.0) * 0.2;
      break;
    }
    case 'wave': {
      armAngle = -1.3 + Math.sin(time * 6.0) * 0.35;
      headExtend = 8;
      break;
    }
    case 'laugh': {
      bodyYOffset = -Math.abs(Math.sin(time * 8.0)) * 8;
      headExtend = 4 + Math.sin(time * 8.0) * 6;
      bodyRotation = Math.sin(time * 8.0) * 0.04;
      break;
    }
    case 'listen': {
      headExtend = 14;
      bodyRotation = 0.05;
      break;
    }
    case 'react': {
      const p = Math.sin(poseT * Math.PI);
      headExtend = -p * 18; // Pulls head into shell!
      bodyYOffset = p * 4;
      break;
    }
    case 'point': {
      armAngle = -0.8;
      headExtend = 8;
      break;
    }
    case 'idle':
    default: {
      bodyYOffset = Math.sin(time * 1.8) * 2;
      headExtend = Math.sin(time * 1.8) * 3;
      break;
    }
  }

  // Dynamic squash & stretch based on bounce
  const hopHeight = Math.max(0, -bodyYOffset);
  let stretchX = 1.0;
  let stretchY = 1.0;
  if (hopHeight > 1) {
    stretchY = 1.0 + Math.min(0.12, (hopHeight / 100) * 0.3);
    stretchX = 1.0 - Math.min(0.08, (hopHeight / 100) * 0.2);
  }

  // 2. Soft ground shadow (reactive to hop height)
  shadow(ctx, 0, 0, 160, 36, 0.3, hopHeight);

  // 3. Tail
  ctx.save();
  ctx.translate(-70, -45 + bodyYOffset);
  ctx.fillStyle = palette.secondary;
  ctx.strokeStyle = palette.outline;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-24, 0);
  ctx.lineTo(0, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. Back & Front Feet
  const drawFlipperFoot = (x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = palette.secondary;
    ctx.strokeStyle = palette.outline;
    ellipse(ctx, 4, 0, 24, 15);
    ctx.fill();
    ctx.stroke();
    // Claws / toes
    ctx.beginPath();
    ctx.arc(16, -4, 3, 0, Math.PI * 2);
    ctx.arc(22, 0, 3, 0, Math.PI * 2);
    ctx.arc(16, 4, 3, 0, Math.PI * 2);
    ctx.fillStyle = palette.accent;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  drawFlipperFoot(-45, -15, backLegAngle);
  drawFlipperFoot(35, -15, frontLegAngle);

  // 5. Body & Shell
  ctx.save();
  ctx.translate(0, bodyYOffset);
  ctx.rotate(bodyRotation);
  ctx.scale(stretchX, stretchY);

  // Underside belly plastron
  ctx.fillStyle = palette.accent;
  ctx.strokeStyle = palette.outline;
  roundedBody(ctx, -65, -60, 125, 45, [10, 10, 20, 20]);
  ctx.fill();
  ctx.stroke();

  // Big Domed Carapace (Shell)
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ctx.beginPath();
  ctx.arc(-5, -60, 68, Math.PI * 1.02, Math.PI * 1.98, false);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shell Pattern Plates (Hexagonal aesthetic scutes)
  ctx.strokeStyle = shade(palette.primary, -0.25);
  ctx.lineWidth = 3;
  ctx.beginPath();
  // Central scute
  ctx.moveTo(-5, -115);
  ctx.lineTo(-25, -95);
  ctx.lineTo(-15, -75);
  ctx.lineTo(5, -75);
  ctx.lineTo(15, -95);
  ctx.closePath();
  // Left scute
  ctx.moveTo(-25, -95); ctx.lineTo(-55, -90);
  ctx.moveTo(-15, -75); ctx.lineTo(-45, -62);
  // Right scute
  ctx.moveTo(15, -95); ctx.lineTo(45, -90);
  ctx.moveTo(5, -75); ctx.lineTo(35, -62);
  ctx.stroke();

  // Reset stroke
  setupOutline(ctx, strokeW, palette.outline);

  // Yellow Shell Trim Band
  ctx.fillStyle = palette.accent;
  ctx.strokeStyle = palette.outline;
  roundedBody(ctx, -72, -64, 138, 14, 7);
  ctx.fill();
  ctx.stroke();

  // 6. Turtle Neck & Head (Bobs horizontally and extends)
  ctx.save();
  ctx.translate(42 + headExtend, -85);

  // Neck
  ctx.fillStyle = palette.secondary;
  ctx.strokeStyle = palette.outline;
  roundedBody(ctx, -15, -12, 35, 24, 10);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = palette.secondary;
  ctx.strokeStyle = palette.outline;
  ellipse(ctx, 22, -8, 30, 26);
  ctx.fill();
  ctx.stroke();

  // Eyes & Brows
  const blink = computeBlink(time);
  eye(ctx, { x: 30, y: -16, size: 8, expression, blink, outlineColor: palette.outline });
  brows(ctx, { x: 30, y: -28, size: 8, expression, color: palette.outline });

  // Cute Nostril
  ctx.fillStyle = palette.outline;
  ellipse(ctx, 46, -10, 2, 2);
  ctx.fill();

  // Mouth
  ctx.save();
  ctx.translate(34, -4);
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (mouthShape === 'wide') {
    ctx.arc(0, 0, 7, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (mouthShape === 'half') {
    ctx.arc(0, 0, 4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    // Gentle wise smile
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(2, 4, 8, -1);
    ctx.stroke();
  }
  ctx.restore();

  // Cheerful Rosy Cheek
  ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
  ellipse(ctx, 22, -4, 8, 5);
  ctx.fill();

  ctx.restore(); // Head transform

  // 7. Front Arm / Hand
  ctx.save();
  ctx.translate(22, -60);
  ctx.rotate(armAngle);
  ctx.fillStyle = palette.secondary;
  ctx.strokeStyle = palette.outline;
  ellipse(ctx, 16, 4, 20, 12);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 8. Accessories
  if (accessories.includes('hat')) {
    ctx.save();
    ctx.translate(64 + headExtend, -116);
    ctx.fillStyle = palette.accent;
    ctx.strokeStyle = palette.outline;
    ellipse(ctx, 0, 0, 26, 7);
    ctx.fill();
    ctx.stroke();
    roundedBody(ctx, -14, -24, 28, 24, [8, 8, 2, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (accessories.includes('scarf')) {
    ctx.save();
    ctx.translate(36 + headExtend, -76);
    ctx.fillStyle = palette.accent;
    ctx.strokeStyle = palette.outline;
    roundedBody(ctx, -10, -8, 24, 16, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(4, 6, 10, 20);
    ctx.strokeRect(4, 6, 10, 20);
    ctx.restore();
  }

  if (accessories.includes('glasses')) {
    ctx.save();
    ctx.translate( headExtend, 0);
    ctx.strokeStyle = palette.outline;
    ctx.lineWidth = 3;
    ellipse(ctx, 72, -101, 11, 11);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(61, -101);
    ctx.lineTo(52, -101);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // Body transform
  ctx.restore(); // Main transform
}
