/**
 * VoxFable Character: Mia the Kid (`mia_kid`, species: 'kid')
 *
 * Requirements:
 * - Faces RIGHT (engine mirrors left)
 * - Origin at feet center (0, 0)
 * - Reference height ~300 px at scale 1.0
 * - 8 poses, 6 expressions, 3 mouth shapes, 6 accessories
 * - 100% deterministic (no Math.random or Date.now)
 */

import type { CharacterDrawState, Palette } from '@contracts';
import {
  setupOutline,
  roundedBody,
  ellipse,
  shadow,
  eye,
  brows,
  mouth,
  computeBlink,
  shade,
  clamp
} from './kit';

const DEFAULT_PALETTE: Palette = {
  primary: '#3a86ff',   // Cheerful storybook blue shirt
  secondary: '#ffbe0b', // Bright golden hair
  accent: '#ff006e',    // Coral pink shorts & sneaker trim
  outline: '#1e293b'    // Clean dark slate outline
};

const SKIN_TONE = '#fbd1a2';
const SKIN_SHADOW = '#e2ab77';

export function drawKid(ctx: CanvasRenderingContext2D, state: CharacterDrawState): void {
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
  shadow(ctx, 0, 0, 135, 34, 0.26);

  // 2. Pose calculations
  let bodyBounceY = 0;
  let bodyRot = 0;
  let headTilt = 0;
  let leftArmAngle = 0;
  let rightArmAngle = 0;
  let isPointing = false;
  let isWaving = false;
  let leftLegAngle = 0;
  let rightLegAngle = 0;
  let leftFootY = 0;
  let rightFootY = 0;
  let blink = computeBlink(time);

  switch (pose) {
    case 'walk': {
      const cycle = time * 7;
      bodyBounceY = -Math.abs(Math.sin(cycle)) * 8;
      bodyRot = Math.sin(cycle) * 0.04;
      headTilt = Math.sin(cycle) * 0.05;
      leftLegAngle = Math.sin(cycle) * 0.45;
      rightLegAngle = -Math.sin(cycle) * 0.45;
      leftArmAngle = -Math.sin(cycle) * 0.45;
      rightArmAngle = Math.sin(cycle) * 0.45;
      leftFootY = Math.max(0, -Math.sin(cycle) * 14);
      rightFootY = Math.max(0, Math.sin(cycle) * 14);
      break;
    }
    case 'talk': {
      bodyBounceY = Math.sin(time * 4) * 2;
      headTilt = Math.sin(time * 6) * 0.08;
      rightArmAngle = -0.3 + Math.sin(time * 6) * 0.2;
      leftArmAngle = 0.1;
      break;
    }
    case 'wave': {
      bodyBounceY = Math.sin(time * 2.5) * 2;
      isWaving = true;
      rightArmAngle = -1.35 + Math.sin(time * 12) * 0.35;
      leftArmAngle = 0.08;
      break;
    }
    case 'laugh': {
      bodyBounceY = -Math.abs(Math.sin(time * 15)) * 6;
      headTilt = Math.sin(time * 12) * 0.06;
      rightArmAngle = -0.2 + Math.sin(time * 15) * 0.2;
      leftArmAngle = -0.2 - Math.sin(time * 15) * 0.2;
      blink = 0;
      break;
    }
    case 'listen': {
      bodyBounceY = Math.sin(time * 2) * 1.5;
      headTilt = 0.18 + Math.sin(time * 2.5) * 0.03;
      break;
    }
    case 'react': {
      const jump = Math.sin(clamp(poseT, 0, 1) * Math.PI);
      bodyBounceY = -jump * 28;
      headTilt = -jump * 0.1;
      rightArmAngle = -jump * 0.8;
      leftArmAngle = jump * 0.8;
      blink = 1.0;
      break;
    }
    case 'point': {
      bodyBounceY = Math.sin(time * 2) * 2;
      isPointing = true;
      rightArmAngle = -0.55;
      break;
    }
    case 'idle':
    default: {
      bodyBounceY = Math.sin(time * 2.5) * 3;
      headTilt = Math.sin(time * 1.5) * 0.03;
      leftArmAngle = Math.sin(time * 2.5) * 0.05;
      rightArmAngle = Math.sin(time * 2.5) * 0.05;
      break;
    }
  }

  if (expression === 'laugh') {
    blink = 0;
  } else if (expression === 'surprised' || expression === 'excited') {
    blink = Math.max(blink, 0.7);
  }

  // --- ACCESSORY: Cape (rear) ---
  if (accessories.includes('cape')) {
    drawKidCape(ctx, bodyBounceY, time, palette);
  }

  // --- ACCESSORY: Backpack (rear) ---
  if (accessories.includes('backpack')) {
    drawKidBackpack(ctx, bodyBounceY, palette);
  }

  // --- LAYER: Back Arm (Left Arm) ---
  drawKidLeftArm(ctx, -32, -125 + bodyBounceY, leftArmAngle, palette);

  // --- LAYER: Legs, Shorts & Sneakers ---
  drawKidLegs(ctx, leftFootY, rightFootY, leftLegAngle, rightLegAngle, palette);

  // --- LAYER: Main Torso (Shirt) ---
  ctx.save();
  ctx.translate(0, bodyBounceY);
  ctx.rotate(bodyRot);

  // Shirt torso
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = strokeW;
  roundedBody(ctx, -45, -155, 90, 85, [25, 25, 15, 15]);
  ctx.fill();
  ctx.stroke();

  // Shirt graphic/star accent
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.arc(8, -120, 12, 0, Math.PI * 2);
  ctx.fill();

  // Shorts waistband
  ctx.fillStyle = palette.accent;
  roundedBody(ctx, -46, -75, 92, 32, [8, 8, 4, 4]);
  ctx.fill();
  ctx.stroke();

  // --- LAYER: Head & Hair ---
  ctx.save();
  ctx.translate(5, -195);
  ctx.rotate(headTilt);

  // Round head
  ctx.fillStyle = SKIN_TONE;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = strokeW;
  ellipse(ctx, 0, 0, 58, 55);
  ctx.fill();
  ctx.stroke();

  // Ears
  drawKidEars(ctx, palette.outline);

  // Hair back layer & top bangs (secondary palette color)
  drawKidHair(ctx, palette);

  // Cheerful blush dots
  ctx.fillStyle = 'rgba(255, 112, 166, 0.4)';
  ellipse(ctx, -26, 12, 10, 6);
  ellipse(ctx, 28, 12, 12, 7);

  // Eyebrows
  brows(ctx, { x: -20, y: -22, size: 18, expression, color: palette.outline, width: 3.5 });
  brows(ctx, { x: 26, y: -22, size: 20, expression, color: palette.outline, width: 3.5 });

  // Big cute cartoon eyes
  eye(ctx, {
    x: -20,
    y: 0,
    size: 19,
    expression,
    blink,
    outlineColor: palette.outline,
    pupilColor: '#1e293b'
  });
  eye(ctx, {
    x: 26,
    y: 0,
    size: 22,
    expression,
    blink,
    outlineColor: palette.outline,
    pupilColor: '#1e293b'
  });

  // Mouth
  mouth(ctx, {
    x: 10,
    y: 26,
    size: 18,
    shape: mouthShape,
    expression,
    color: palette.outline
  });

  // --- ACCESSORIES: Glasses & Hat ---
  if (accessories.includes('glasses')) {
    drawKidGlasses(ctx, palette.outline);
  }
  if (accessories.includes('hat')) {
    drawKidHat(ctx, palette);
  }

  ctx.restore(); // restore head

  // --- ACCESSORIES: Scarf / Bow Tie ---
  if (accessories.includes('scarf')) {
    drawKidScarf(ctx, -145 + bodyBounceY, time, palette);
  }
  if (accessories.includes('bow')) {
    drawKidBow(ctx, 10, -148 + bodyBounceY, palette);
  }

  ctx.restore(); // restore body

  // --- LAYER: Foreground Arm (Right Arm) ---
  drawKidRightArm(
    ctx,
    28,
    -125 + bodyBounceY,
    rightArmAngle,
    isPointing,
    isWaving,
    palette
  );

  ctx.restore();
}

// ---------------- Helper Functions for Kid ----------------

function drawKidEars(ctx: CanvasRenderingContext2D, outlineColor: string): void {
  ctx.fillStyle = SKIN_TONE;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 3;

  // Left ear
  ellipse(ctx, -56, 4, 10, 14);
  ctx.fill();
  ctx.stroke();

  // Right ear
  ellipse(ctx, 56, 4, 10, 14);
  ctx.fill();
  ctx.stroke();
}

function drawKidHair(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.fillStyle = palette.secondary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  // Fluffy hair dome & tufts
  ctx.beginPath();
  ctx.moveTo(-55, -15);
  ctx.quadraticCurveTo(-65, -55, -35, -68);
  ctx.quadraticCurveTo(-10, -78, 20, -72);
  ctx.quadraticCurveTo(55, -65, 58, -20);
  ctx.quadraticCurveTo(40, -42, 15, -45);
  ctx.quadraticCurveTo(-15, -45, -42, -25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Perky hair tuft on top
  ctx.beginPath();
  ctx.moveTo(0, -68);
  ctx.quadraticCurveTo(15, -92, 35, -88);
  ctx.quadraticCurveTo(20, -75, 12, -70);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawKidLeftArm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  // Sleeve
  ctx.fillStyle = shade(palette.primary, -0.15);
  roundedBody(ctx, -12, -5, 24, 30, [10, 10, 4, 4]);
  ctx.fill();
  ctx.stroke();

  // Forearm & hand
  ctx.fillStyle = SKIN_TONE;
  roundedBody(ctx, -10, 22, 20, 42, [6, 6, 10, 10]);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawKidRightArm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  isPointing: boolean,
  isWaving: boolean,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  if (isPointing) {
    // Sleeve
    ctx.fillStyle = palette.primary;
    roundedBody(ctx, -12, -5, 24, 28, [10, 10, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Pointing arm & finger
    ctx.fillStyle = SKIN_TONE;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(65, 12);
    ctx.lineTo(62, 30);
    ctx.lineTo(0, 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pointing finger tip
    ellipse(ctx, 65, 20, 6, 7);
    ctx.fill();
    ctx.stroke();
  } else if (isWaving) {
    // Sleeve
    ctx.fillStyle = palette.primary;
    roundedBody(ctx, -12, -5, 24, 28, [10, 10, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Raised arm
    ctx.fillStyle = SKIN_TONE;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.quadraticCurveTo(15, -30, 28, -65);
    ctx.quadraticCurveTo(15, -60, -5, -40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Waving hand
    ellipse(ctx, 24, -62, 10, 10);
    ctx.fill();
    ctx.stroke();
  } else {
    // Sleeve
    ctx.fillStyle = palette.primary;
    roundedBody(ctx, -12, -5, 24, 30, [10, 10, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Forearm & hand
    ctx.fillStyle = SKIN_TONE;
    roundedBody(ctx, -10, 22, 20, 45, [6, 6, 10, 10]);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawKidLegs(
  ctx: CanvasRenderingContext2D,
  leftY: number,
  rightY: number,
  leftAngle: number,
  rightAngle: number,
  palette: Palette
): void {
  // Left leg
  ctx.save();
  ctx.translate(-20, -55 - leftY);
  ctx.rotate(leftAngle);
  drawKidLeg(ctx, shade(palette.accent, -0.15), palette.outline);
  ctx.restore();

  // Right leg
  ctx.save();
  ctx.translate(18, -55 - rightY);
  ctx.rotate(rightAngle);
  drawKidLeg(ctx, palette.accent, palette.outline);
  ctx.restore();
}

function drawKidLeg(
  ctx: CanvasRenderingContext2D,
  shortsColor: string,
  outlineColor: string
): void {
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  // Shorts leg
  ctx.fillStyle = shortsColor;
  roundedBody(ctx, -12, 0, 24, 22, [4, 4, 4, 4]);
  ctx.fill();
  ctx.stroke();

  // Leg skin
  ctx.fillStyle = SKIN_TONE;
  roundedBody(ctx, -9, 20, 18, 25, [2, 2, 2, 2]);
  ctx.fill();
  ctx.stroke();

  // White sock
  ctx.fillStyle = '#ffffff';
  roundedBody(ctx, -9, 38, 18, 8, [2, 2, 2, 2]);
  ctx.fill();
  ctx.stroke();

  // Sneaker shoe
  ctx.fillStyle = '#e63946'; // Red sneaker
  ctx.beginPath();
  ctx.moveTo(-10, 44);
  ctx.lineTo(16, 44);
  ctx.quadraticCurveTo(22, 48, 20, 56);
  ctx.lineTo(-12, 56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White sneaker rubber toe cap
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(14, 52, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawKidGlasses(ctx: CanvasRenderingContext2D, outlineColor: string): void {
  ctx.save();
  ctx.strokeStyle = '#e63946'; // Fun red round frames
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  // Left frame
  ctx.beginPath();
  ctx.arc(-20, 0, 22, 0, Math.PI * 2);
  ctx.stroke();

  // Right frame
  ctx.beginPath();
  ctx.arc(26, 0, 24, 0, Math.PI * 2);
  ctx.stroke();

  // Bridge
  ctx.beginPath();
  ctx.moveTo(2, -2);
  ctx.lineTo(6, -2);
  ctx.stroke();

  ctx.restore();
}

function drawKidHat(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.save();
  ctx.translate(5, -60);

  ctx.fillStyle = '#ffbe0b'; // Sunny yellow cap
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;

  ellipse(ctx, 0, 0, 52, 15);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-35, -4);
  ctx.quadraticCurveTo(-38, -48, 0, -50);
  ctx.quadraticCurveTo(38, -48, 35, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawKidScarf(
  ctx: CanvasRenderingContext2D,
  neckY: number,
  time: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(5, neckY);

  const scarfColor = '#3a86ff';
  ctx.fillStyle = scarfColor;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;

  roundedBody(ctx, -45, -12, 90, 24, 12);
  ctx.fill();
  ctx.stroke();

  const flutter = Math.sin(time * 4) * 6;
  ctx.beginPath();
  ctx.moveTo(18, 10);
  ctx.quadraticCurveTo(28 + flutter, 45, 22 + flutter * 1.5, 75);
  ctx.lineTo(40 + flutter * 1.5, 75);
  ctx.quadraticCurveTo(45 + flutter, 40, 36, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawKidBow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#ff006e';
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-16, -10);
  ctx.lineTo(-16, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(16, -10);
  ctx.lineTo(16, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ellipse(ctx, 0, 0, 5, 5);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawKidCape(
  ctx: CanvasRenderingContext2D,
  bodyY: number,
  time: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(-25, -135 + bodyY);

  const wave = Math.sin(time * 5) * 8;
  ctx.fillStyle = '#ffbe0b'; // Cheerful yellow superhero cape
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-55 + wave * 0.5, 60, -70 + wave, 130);
  ctx.quadraticCurveTo(-30, 140, 5, 125);
  ctx.quadraticCurveTo(10, 60, 15, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawKidBackpack(
  ctx: CanvasRenderingContext2D,
  bodyY: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(-55, -120 + bodyY);

  ctx.fillStyle = '#3a86ff';
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  roundedBody(ctx, -18, -30, 30, 55, [8, 8, 6, 6]);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
