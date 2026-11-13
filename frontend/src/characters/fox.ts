/**
 * VoxFable Character: Rusty the Fox (`rusty_fox`, species: 'fox')
 *
 * Requirements:
 * - Faces RIGHT (engine mirrors left)
 * - Origin at feet center (0, 0)
 * - Reference height ~300 px at scale 1.0
 * - 8 poses, 6 expressions, 3 mouth shapes, 6 accessories
 * - Fluffy animated tail, pointed ears, cute muzzle
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
  computeBlink,
  shade,
  clamp
} from './kit';

const DEFAULT_PALETTE: Palette = {
  primary: '#d95f32',   // Vibrant rusty fox orange
  secondary: '#f4c28d', // Warm peach/cream for chest & muzzle
  accent: '#2f3e46',    // Dark charcoal for paws, ear tips & nose
  outline: '#2b1e1a'    // Deep rich dark outline
};

export function drawFox(ctx: CanvasRenderingContext2D, state: CharacterDrawState): void {
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
  shadow(ctx, 0, 0, 140, 36, 0.28);

  // 2. Pose calculations
  let bodyBounceY = 0;
  let bodyRot = 0;
  let headTilt = 0;
  let tailAngle = 0;
  let tailWag = Math.sin(time * 3.5) * 0.15;
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
      tailAngle = Math.sin(cycle) * 0.25;
      leftLegAngle = Math.sin(cycle) * 0.45;
      rightLegAngle = -Math.sin(cycle) * 0.45;
      leftArmAngle = -Math.sin(cycle) * 0.4;
      rightArmAngle = Math.sin(cycle) * 0.4;
      leftFootY = Math.max(0, -Math.sin(cycle) * 14);
      rightFootY = Math.max(0, Math.sin(cycle) * 14);
      break;
    }
    case 'talk': {
      bodyBounceY = Math.sin(time * 4) * 2.5;
      headTilt = Math.sin(time * 6) * 0.08;
      tailAngle = Math.sin(time * 4) * 0.2;
      rightArmAngle = -0.3 + Math.sin(time * 6) * 0.2;
      leftArmAngle = 0.1;
      break;
    }
    case 'wave': {
      bodyBounceY = Math.sin(time * 2.5) * 2;
      isWaving = true;
      rightArmAngle = -1.3 + Math.sin(time * 12) * 0.35;
      leftArmAngle = 0.1;
      tailAngle = 0.2 + Math.sin(time * 5) * 0.2;
      break;
    }
    case 'laugh': {
      bodyBounceY = -Math.abs(Math.sin(time * 15)) * 7;
      headTilt = Math.sin(time * 12) * 0.07;
      tailAngle = Math.sin(time * 15) * 0.35;
      rightArmAngle = -0.2 + Math.sin(time * 15) * 0.2;
      leftArmAngle = -0.2 - Math.sin(time * 15) * 0.2;
      blink = 0;
      break;
    }
    case 'listen': {
      bodyBounceY = Math.sin(time * 2) * 1.5;
      headTilt = 0.2 + Math.sin(time * 2.5) * 0.03;
      tailAngle = -0.15 + Math.sin(time * 2) * 0.08;
      break;
    }
    case 'react': {
      const jump = Math.sin(clamp(poseT, 0, 1) * Math.PI);
      bodyBounceY = -jump * 30;
      headTilt = -jump * 0.1;
      tailAngle = -jump * 0.6;
      rightArmAngle = -jump * 0.7;
      leftArmAngle = jump * 0.7;
      blink = 1.0;
      break;
    }
    case 'point': {
      bodyBounceY = Math.sin(time * 2) * 2;
      isPointing = true;
      rightArmAngle = -0.5;
      tailAngle = 0.1;
      break;
    }
    case 'idle':
    default: {
      bodyBounceY = Math.sin(time * 2.5) * 3;
      headTilt = Math.sin(time * 1.5) * 0.03;
      tailAngle = tailWag;
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

  // --- ACCESSORY LAYER: Cape (rear) ---
  if (accessories.includes('cape')) {
    drawFoxCape(ctx, bodyBounceY, time, palette);
  }

  // --- ACCESSORY LAYER: Backpack (rear) ---
  if (accessories.includes('backpack')) {
    drawFoxBackpack(ctx, bodyBounceY, palette);
  }

  // --- LAYER: Fluffy Animated Tail (behind body) ---
  drawFoxTail(ctx, -55, -80 + bodyBounceY, tailAngle, palette);

  // --- LAYER: Back Arm (Left Arm) ---
  drawFoxLeftArm(ctx, -38, -125 + bodyBounceY, leftArmAngle, palette);

  // --- LAYER: Legs & Paws ---
  drawFoxLegs(ctx, leftFootY, rightFootY, leftLegAngle, rightLegAngle, palette);

  // --- LAYER: Main Body ---
  ctx.save();
  ctx.translate(0, bodyBounceY);
  ctx.rotate(bodyRot);

  // Body torso
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = strokeW;
  roundedBody(ctx, -55, -160, 110, 145, [50, 50, 35, 35]);
  ctx.fill();
  ctx.stroke();

  // White/cream fluffy chest bib (secondary)
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.moveTo(-25, -155);
  ctx.quadraticCurveTo(5, -155, 35, -145);
  ctx.quadraticCurveTo(45, -110, 20, -75);
  ctx.quadraticCurveTo(0, -90, -10, -78);
  ctx.quadraticCurveTo(-35, -105, -25, -155);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // --- LAYER: Head & Facial Features ---
  ctx.save();
  ctx.translate(10, -185);
  ctx.rotate(headTilt);

  // Pointed Fox Ears
  drawFoxEars(ctx, palette);

  // Head oval
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = strokeW;
  ellipse(ctx, 0, -10, 65, 58);
  ctx.fill();
  ctx.stroke();

  // White/cream cheek tufts
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.moveTo(35, -5);
  ctx.quadraticCurveTo(62, 5, 50, 25);
  ctx.quadraticCurveTo(20, 22, -10, 20);
  ctx.quadraticCurveTo(-15, 0, 10, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Muzzle & Snout
  drawFoxMuzzle(ctx, mouthShape, expression, palette);

  // Eyebrows
  brows(ctx, { x: -18, y: -42, size: 20, expression, color: palette.outline, width: 3.5 });
  brows(ctx, { x: 32, y: -42, size: 22, expression, color: palette.outline, width: 3.5 });

  // Eyes
  eye(ctx, {
    x: -18,
    y: -18,
    size: 19,
    expression,
    blink,
    outlineColor: palette.outline,
    pupilColor: '#1e293b'
  });
  eye(ctx, {
    x: 32,
    y: -18,
    size: 22,
    expression,
    blink,
    outlineColor: palette.outline,
    pupilColor: '#1e293b'
  });

  // --- ACCESSORIES: Glasses & Hat ---
  if (accessories.includes('glasses')) {
    drawFoxGlasses(ctx, palette.outline);
  }
  if (accessories.includes('hat')) {
    drawFoxHat(ctx, palette);
  }

  ctx.restore(); // restore head

  // --- ACCESSORIES: Scarf / Bow Tie ---
  if (accessories.includes('scarf')) {
    drawFoxScarf(ctx, -145 + bodyBounceY, time, palette);
  }
  if (accessories.includes('bow')) {
    drawFoxBow(ctx, 22, -145 + bodyBounceY, palette);
  }

  ctx.restore(); // restore body

  // --- LAYER: Foreground Arm (Right Arm) ---
  drawFoxRightArm(
    ctx,
    30,
    -125 + bodyBounceY,
    rightArmAngle,
    isPointing,
    isWaving,
    palette
  );

  ctx.restore();
}

// ---------------- Helper Functions for Fox ----------------

function drawFoxTail(
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
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Big bushy fox tail
  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-65, -30, -95, -75);
  ctx.quadraticCurveTo(-75, -120, -50, -115);
  ctx.quadraticCurveTo(-15, -70, 0, -25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fluffy white tail tip
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.moveTo(-75, -75);
  ctx.quadraticCurveTo(-95, -75, -88, -100);
  ctx.quadraticCurveTo(-75, -120, -50, -115);
  ctx.quadraticCurveTo(-45, -95, -55, -80);
  ctx.lineTo(-65, -88);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawFoxEars(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  // Left ear
  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.moveTo(-40, -45);
  ctx.lineTo(-58, -100);
  ctx.lineTo(-18, -65);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left inner ear
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.moveTo(-38, -50);
  ctx.lineTo(-50, -90);
  ctx.lineTo(-24, -65);
  ctx.closePath();
  ctx.fill();

  // Dark ear tip (accent)
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(-52, -88);
  ctx.lineTo(-58, -100);
  ctx.lineTo(-44, -86);
  ctx.closePath();
  ctx.fill();

  // Right ear (foreground)
  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.moveTo(25, -52);
  ctx.lineTo(48, -105);
  ctx.lineTo(55, -45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right inner ear
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.moveTo(28, -52);
  ctx.lineTo(44, -94);
  ctx.lineTo(48, -48);
  ctx.closePath();
  ctx.fill();

  // Right ear tip (accent)
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(40, -88);
  ctx.lineTo(48, -105);
  ctx.lineTo(49, -82);
  ctx.closePath();
  ctx.fill();
}

function drawFoxMuzzle(
  ctx: CanvasRenderingContext2D,
  mouthShape: 'closed' | 'half' | 'wide',
  expression: string,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(35, 2);

  // Muzzle snout shape
  ctx.fillStyle = palette.secondary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(-25, -12);
  ctx.quadraticCurveTo(5, -14, 25, -2);
  ctx.quadraticCurveTo(22, 16, 5, 18);
  ctx.quadraticCurveTo(-15, 14, -25, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Button nose (accent)
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.ellipse(23, -2, 7, 5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Cute highlight on nose
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(21, -4, 2, 0, Math.PI * 2);
  ctx.fill();

  // Mouth rendering
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 2.5;

  if (mouthShape === 'closed') {
    ctx.beginPath();
    if (expression === 'sad' || expression === 'worried') {
      ctx.arc(10, 16, 8, Math.PI * 1.3, Math.PI * 1.7, true);
    } else {
      ctx.arc(10, 2, 8, Math.PI * 0.2, Math.PI * 0.8, false);
    }
    ctx.stroke();
  } else if (mouthShape === 'half') {
    ctx.fillStyle = '#6b1717';
    ctx.beginPath();
    ctx.moveTo(2, 6);
    ctx.quadraticCurveTo(12, 6, 20, 8);
    ctx.quadraticCurveTo(12, 22, 2, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tongue
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(11, 16, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Wide open
    ctx.fillStyle = '#6b1717';
    ctx.beginPath();
    ctx.ellipse(11, 12, 12, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tongue
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.ellipse(11, 17, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cute whiskers
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(26, -6);
  ctx.moveTo(8, 5);
  ctx.lineTo(28, 4);
  ctx.stroke();

  ctx.restore();
}

function drawFoxLeftArm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = shade(palette.primary, -0.15);
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  // Arm & dark paw
  roundedBody(ctx, -14, -5, 28, 65, [14, 14, 12, 12]);
  ctx.fill();
  ctx.stroke();

  // Dark paw tip
  ctx.fillStyle = palette.accent;
  roundedBody(ctx, -14, 40, 28, 20, [4, 4, 12, 12]);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawFoxRightArm(
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

  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  if (isPointing) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(75, 5);
    ctx.lineTo(72, 28);
    ctx.lineTo(0, 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark paw tip
    ctx.fillStyle = palette.accent;
    ctx.fillRect(52, 5, 23, 23);
    ctx.strokeRect(52, 5, 23, 23);
  } else if (isWaving) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(20, -40, 35, -75);
    ctx.quadraticCurveTo(20, -70, 0, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    ellipse(ctx, 30, -70, 10, 10);
    ctx.fill();
    ctx.stroke();
  } else {
    roundedBody(ctx, -14, -5, 28, 70, [14, 14, 12, 12]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    roundedBody(ctx, -14, 45, 28, 20, [4, 4, 12, 12]);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawFoxLegs(
  ctx: CanvasRenderingContext2D,
  leftY: number,
  rightY: number,
  leftAngle: number,
  rightAngle: number,
  palette: Palette
): void {
  // Left leg
  ctx.save();
  ctx.translate(-25, -25 - leftY);
  ctx.rotate(leftAngle);
  drawFoxPaw(ctx, shade(palette.primary, -0.15), palette.accent, palette.outline);
  ctx.restore();

  // Right leg
  ctx.save();
  ctx.translate(20, -25 - rightY);
  ctx.rotate(rightAngle);
  drawFoxPaw(ctx, palette.primary, palette.accent, palette.outline);
  ctx.restore();
}

function drawFoxPaw(
  ctx: CanvasRenderingContext2D,
  bodyColor: string,
  pawColor: string,
  outlineColor: string
): void {
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  roundedBody(ctx, -14, 0, 28, 30, [8, 8, 4, 4]);
  ctx.fill();
  ctx.stroke();

  // Dark paw
  ctx.fillStyle = pawColor;
  ellipse(ctx, 3, 22, 16, 10);
  ctx.fill();
  ctx.stroke();
}

function drawFoxGlasses(ctx: CanvasRenderingContext2D, outlineColor: string): void {
  ctx.save();
  ctx.strokeStyle = '#2b2d42';
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  // Left frame
  ctx.beginPath();
  ctx.arc(-18, -18, 20, 0, Math.PI * 2);
  ctx.stroke();

  // Right frame
  ctx.beginPath();
  ctx.arc(32, -18, 24, 0, Math.PI * 2);
  ctx.stroke();

  // Bridge
  ctx.beginPath();
  ctx.moveTo(2, -20);
  ctx.lineTo(8, -20);
  ctx.stroke();

  ctx.restore();
}

function drawFoxHat(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.save();
  ctx.translate(6, -65);

  ctx.fillStyle = '#264653'; // Sleek dark teal beret
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  ellipse(ctx, 0, 0, 48, 14);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-32, -4);
  ctx.quadraticCurveTo(-35, -45, 0, -48);
  ctx.quadraticCurveTo(35, -45, 32, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawFoxScarf(
  ctx: CanvasRenderingContext2D,
  neckY: number,
  time: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(5, neckY);

  const scarfColor = '#2a9d8f';
  ctx.fillStyle = scarfColor;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;

  roundedBody(ctx, -48, -12, 96, 26, 12);
  ctx.fill();
  ctx.stroke();

  const flutter = Math.sin(time * 4) * 6;
  ctx.beginPath();
  ctx.moveTo(20, 10);
  ctx.quadraticCurveTo(30 + flutter, 45, 25 + flutter * 1.5, 75);
  ctx.lineTo(44 + flutter * 1.5, 75);
  ctx.quadraticCurveTo(48 + flutter, 40, 40, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawFoxBow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(x, y);

  const bowColor = '#e76f51';
  ctx.fillStyle = bowColor;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3;

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

function drawFoxCape(
  ctx: CanvasRenderingContext2D,
  bodyY: number,
  time: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(-25, -135 + bodyY);

  const wave = Math.sin(time * 5) * 8;
  ctx.fillStyle = '#9d4edd'; // Royal violet cape
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

function drawFoxBackpack(
  ctx: CanvasRenderingContext2D,
  bodyY: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(-58, -120 + bodyY);

  ctx.fillStyle = '#e76f51';
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  roundedBody(ctx, -20, -30, 32, 55, [8, 8, 6, 6]);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
