/**
 * VoxFable Character: Barnaby the Rabbit (`barnaby_rabbit`, species: 'rabbit')
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
  primary: '#f3f4f6',   // Soft warm white fur
  secondary: '#fbcfe8', // Cute pastel pink (ears, nose, cheeks)
  accent: '#60a5fa',    // Bright sky blue (bow, accessories)
  outline: '#1f2937'    // Crisp charcoal outline
};

export function drawRabbit(ctx: CanvasRenderingContext2D, state: CharacterDrawState): void {
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

  // 1. Soft ground shadow
  shadow(ctx, 0, 0, 130, 32, 0.28);

  // 2. Pose dynamics
  let bodyYOffset = 0;
  let bodyRotation = 0;
  let earSway = Math.sin(time * 3.5) * 0.08;
  let leftArmAngle = 0;
  let rightArmAngle = 0;
  let leftLegAngle = 0;
  let rightLegAngle = 0;

  switch (pose) {
    case 'walk': {
      const walkCycle = time * 7.0;
      bodyYOffset = -Math.abs(Math.sin(walkCycle)) * 14;
      bodyRotation = Math.sin(walkCycle) * 0.05;
      earSway = Math.sin(walkCycle) * 0.18;
      leftLegAngle = Math.sin(walkCycle) * 0.45;
      rightLegAngle = -Math.sin(walkCycle) * 0.45;
      leftArmAngle = -Math.sin(walkCycle) * 0.35;
      rightArmAngle = Math.sin(walkCycle) * 0.35;
      break;
    }
    case 'talk': {
      bodyYOffset = Math.sin(time * 5.0) * 4;
      bodyRotation = Math.sin(time * 3.0) * 0.03;
      rightArmAngle = -0.4 + Math.sin(time * 6.0) * 0.2;
      break;
    }
    case 'wave': {
      rightArmAngle = -1.4 + Math.sin(time * 8.0) * 0.4;
      bodyRotation = 0.04;
      break;
    }
    case 'laugh': {
      bodyYOffset = -Math.abs(Math.sin(time * 12.0)) * 10;
      earSway = Math.sin(time * 12.0) * 0.22;
      bodyRotation = Math.sin(time * 12.0) * 0.06;
      leftArmAngle = -0.6;
      rightArmAngle = -0.6;
      break;
    }
    case 'listen': {
      earSway = 0.25; // perked up ear
      bodyRotation = 0.08;
      break;
    }
    case 'react': {
      const p = Math.sin(poseT * Math.PI);
      bodyYOffset = -p * 20;
      earSway = -p * 0.3;
      rightArmAngle = -p * 0.8;
      leftArmAngle = -p * 0.8;
      break;
    }
    case 'point': {
      rightArmAngle = -0.9;
      break;
    }
    case 'idle':
    default: {
      bodyYOffset = Math.sin(time * 2.2) * 3;
      earSway = Math.sin(time * 2.2) * 0.05;
      break;
    }
  }

  // 3. Fluffy Cotton Tail (back)
  ctx.save();
  ctx.translate(-55, -75 + bodyYOffset);
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ellipse(ctx, 0, 0, 22, 22);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. Feet / Hind Legs
  const drawFoot = (x: number, angle: number) => {
    ctx.save();
    ctx.translate(x, -16);
    ctx.rotate(angle);
    ctx.fillStyle = palette.primary;
    ctx.strokeStyle = palette.outline;
    ellipse(ctx, 10, 0, 28, 14);
    ctx.fill();
    ctx.stroke();
    // Toe lines
    ctx.beginPath();
    ctx.moveTo(24, -4);
    ctx.lineTo(34, -4);
    ctx.moveTo(24, 4);
    ctx.lineTo(34, 4);
    ctx.stroke();
    ctx.restore();
  };

  drawFoot(-30, leftLegAngle);
  drawFoot(20, rightLegAngle);

  // 5. Body
  ctx.save();
  ctx.translate(0, bodyYOffset);
  ctx.rotate(bodyRotation);

  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  // Plump pear-shaped rabbit body
  roundedBody(ctx, -50, -165, 100, 140, [45, 45, 40, 40]);
  ctx.fill();
  ctx.stroke();

  // Belly Patch
  ctx.fillStyle = palette.secondary;
  ellipse(ctx, 5, -95, 34, 45);
  ctx.fill();

  // 6. Long Rabbit Ears (layered behind head)
  const drawEar = (earX: number, angle: number) => {
    ctx.save();
    ctx.translate(earX, -225);
    ctx.rotate(angle);
    // Outer Ear
    ctx.fillStyle = palette.primary;
    ctx.strokeStyle = palette.outline;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-18, -60, -8, -115);
    ctx.quadraticCurveTo(0, -135, 10, -115);
    ctx.quadraticCurveTo(20, -60, 4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Pink
    ctx.fillStyle = palette.secondary;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.quadraticCurveTo(-10, -60, -3, -100);
    ctx.quadraticCurveTo(0, -115, 6, -100);
    ctx.quadraticCurveTo(12, -60, 2, -15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawEar(-20, -0.15 + earSway);
  drawEar(18, 0.12 - earSway * 0.8);

  // 7. Head
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ellipse(ctx, 4, -195, 52, 44);
  ctx.fill();
  ctx.stroke();

  // Rosy Cheeks
  ctx.fillStyle = 'rgba(251, 207, 232, 0.7)';
  ellipse(ctx, -28, -182, 12, 8);
  ellipse(ctx, 36, -182, 12, 8);

  // 8. Facial Features (Eyes, Brows, Nose, Mouth, Whiskers)
  const blink = computeBlink(time);
  eye(ctx, { x: -16, y: -202, size: 10, expression, blink, outlineColor: palette.outline });
  eye(ctx, { x: 24, y: -202, size: 10, expression, blink, outlineColor: palette.outline });
  brows(ctx, { x: -16, y: -218, size: 10, expression, color: palette.outline });
  brows(ctx, { x: 24, y: -218, size: 10, expression, color: palette.outline });

  // Pink Twitchy Nose
  ctx.fillStyle = palette.secondary;
  ctx.strokeStyle = palette.outline;
  ctx.beginPath();
  ctx.moveTo(1, -190);
  ctx.lineTo(9, -190);
  ctx.lineTo(5, -183);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mouth & Teeth
  ctx.save();
  ctx.translate(5, -182);
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (mouthShape === 'wide') {
    ctx.arc(0, 2, 8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    // Two cute front teeth
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, 2, 4, 6);
    ctx.fillRect(0, 2, 4, 6);
    ctx.strokeRect(-4, 2, 4, 6);
    ctx.strokeRect(0, 2, 4, 6);
  } else if (mouthShape === 'half') {
    ctx.arc(0, 1, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    // Cute closed rabbit split-lip
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 4);
    ctx.arc(-4, 4, 4, 0, Math.PI * 0.7);
    ctx.moveTo(0, 4);
    ctx.arc(4, 4, 4, Math.PI, Math.PI * 0.3, true);
    ctx.stroke();
  }
  ctx.restore();

  // Whiskers
  ctx.save();
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 2;
  // Left whiskers
  ctx.beginPath();
  ctx.moveTo(-12, -186); ctx.lineTo(-44, -192);
  ctx.moveTo(-12, -182); ctx.lineTo(-42, -181);
  // Right whiskers
  ctx.moveTo(22, -186); ctx.lineTo(54, -192);
  ctx.moveTo(22, -182); ctx.lineTo(52, -181);
  ctx.stroke();
  ctx.restore();

  // 9. Arms / Paws
  const drawPaw = (pawX: number, pawY: number, angle: number) => {
    ctx.save();
    ctx.translate(pawX, pawY);
    ctx.rotate(angle);
    ctx.fillStyle = palette.primary;
    ctx.strokeStyle = palette.outline;
    ellipse(ctx, 12, 0, 20, 11);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  drawPaw(-38, -130, leftArmAngle + 0.3);
  drawPaw(36, -130, rightArmAngle - 0.3);

  // 10. Accessories
  if (accessories.includes('bow')) {
    ctx.save();
    ctx.translate(5, -150);
    ctx.fillStyle = palette.accent;
    ctx.strokeStyle = palette.outline;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-18, -10);
    ctx.lineTo(-18, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18, -10);
    ctx.lineTo(18, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ellipse(ctx, 0, 0, 6, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (accessories.includes('scarf')) {
    ctx.save();
    ctx.translate(5, -152);
    ctx.fillStyle = palette.accent;
    ctx.strokeStyle = palette.outline;
    roundedBody(ctx, -38, -8, 76, 20, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(10, 8, 14, 30);
    ctx.strokeRect(10, 8, 14, 30);
    ctx.restore();
  }

  if (accessories.includes('hat')) {
    ctx.save();
    ctx.translate(4, -242);
    ctx.fillStyle = palette.accent;
    ctx.strokeStyle = palette.outline;
    ellipse(ctx, 0, 5, 45, 10);
    ctx.fill();
    ctx.stroke();
    roundedBody(ctx, -22, -35, 44, 40, [14, 14, 4, 4]);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (accessories.includes('glasses')) {
    ctx.save();
    ctx.strokeStyle = palette.outline;
    ctx.lineWidth = 3;
    ellipse(ctx, -16, -202, 14, 14);
    ctx.stroke();
    ellipse(ctx, 24, -202, 14, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, -202);
    ctx.lineTo(10, -202);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore(); // Body transform
  ctx.restore(); // Main transform
}
