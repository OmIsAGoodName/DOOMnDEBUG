/**
 * VoxFable Character: Pip the Owl (`pip_owl`, species: 'owl')
 *
 * Requirements:
 * - Faces RIGHT (engine handles left mirroring via ctx.scale(-1, 1))
 * - Origin at feet center (0, 0)
 * - Reference height ~300 px at scale 1.0
 * - 8 poses, 6 expressions, 3 mouth shapes, 6 accessories
 * - Pure & deterministic from state inputs (no Math.random or Date.now)
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

// Default owl palette fallback if state.palette has missing fields
const DEFAULT_PALETTE: Palette = {
  primary: '#8b5e3c',   // Warm chestnut brown
  secondary: '#d9b38c', // Soft cream/biscuit
  accent: '#f2a65a',    // Golden beak and feather highlights
  outline: '#3b2a1e'    // Deep woodland umber
};

export function drawOwl(ctx: CanvasRenderingContext2D, state: CharacterDrawState): void {
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

  // Outline width relative to scale 1
  const strokeW = 4;
  setupOutline(ctx, strokeW, palette.outline);

  // 1. Soft ground shadow under feet
  shadow(ctx, 0, 0, 140, 36, 0.28);

  // 2. Pose calculations (all deterministic from time and poseT)
  let bodyBounceY = 0;
  let bodyRot = 0;
  let headTilt = 0;
  let leftWingAngle = 0;
  let rightWingAngle = 0;
  let rightWingX = 35;
  let rightWingY = -115;
  let isPointing = false;
  let isWaving = false;
  let leftFootY = 0;
  let rightFootY = 0;
  let leftFootAngle = 0;
  let rightFootAngle = 0;
  let blink = computeBlink(time);

  switch (pose) {
    case 'walk': {
      const walkCycle = time * 7;
      bodyBounceY = -Math.abs(Math.sin(walkCycle)) * 7;
      bodyRot = Math.sin(walkCycle) * 0.03;
      headTilt = Math.sin(walkCycle) * 0.04;
      leftWingAngle = Math.cos(walkCycle) * 0.25;
      rightWingAngle = -Math.cos(walkCycle) * 0.25;
      leftFootAngle = Math.sin(walkCycle) * 0.35;
      rightFootAngle = -Math.sin(walkCycle) * 0.35;
      leftFootY = Math.max(0, -Math.sin(walkCycle) * 12);
      rightFootY = Math.max(0, Math.sin(walkCycle) * 12);
      break;
    }
    case 'talk': {
      bodyBounceY = Math.sin(time * 4) * 2;
      headTilt = Math.sin(time * 6) * 0.08;
      leftWingAngle = Math.sin(time * 5) * 0.12;
      rightWingAngle = Math.sin(time * 6) * 0.2;
      break;
    }
    case 'wave': {
      bodyBounceY = Math.sin(time * 2.5) * 2;
      isWaving = true;
      rightWingAngle = -1.2 + Math.sin(time * 12) * 0.3;
      leftWingAngle = 0.05;
      break;
    }
    case 'laugh': {
      bodyBounceY = -Math.abs(Math.sin(time * 15)) * 6;
      headTilt = Math.sin(time * 12) * 0.06;
      leftWingAngle = Math.sin(time * 15) * 0.25;
      rightWingAngle = -Math.sin(time * 15) * 0.25;
      blink = 0; // squinch eyes in laughter
      break;
    }
    case 'listen': {
      bodyBounceY = Math.sin(time * 2) * 1.5;
      headTilt = 0.18 + Math.sin(time * 2.5) * 0.03;
      leftWingAngle = -0.05;
      rightWingAngle = 0.05;
      break;
    }
    case 'react': {
      const jump = Math.sin(clamp(poseT, 0, 1) * Math.PI);
      bodyBounceY = -jump * 28;
      headTilt = -jump * 0.08;
      leftWingAngle = -jump * 0.6;
      rightWingAngle = -jump * 0.6;
      blink = 1.0; // wide eyes
      break;
    }
    case 'point': {
      bodyBounceY = Math.sin(time * 2) * 2;
      isPointing = true;
      rightWingAngle = -0.4;
      leftWingAngle = 0.05;
      break;
    }
    case 'idle':
    default: {
      bodyBounceY = Math.sin(time * 2.5) * 3;
      headTilt = Math.sin(time * 1.5) * 0.03;
      leftWingAngle = Math.sin(time * 2.5) * 0.05;
      rightWingAngle = Math.sin(time * 2.5) * 0.05;
      break;
    }
  }

  // Expression-based blink override
  if (expression === 'laugh') {
    blink = 0;
  } else if (expression === 'surprised' || expression === 'excited') {
    blink = Math.max(blink, 0.7);
  }

  // --- ACCESSORY LAYER 0: Cape (behind back) ---
  if (accessories.includes('cape')) {
    drawCape(ctx, bodyBounceY, time, palette);
  }

  // --- ACCESSORY LAYER 1: Backpack (behind body) ---
  if (accessories.includes('backpack')) {
    drawBackpack(ctx, bodyBounceY, palette);
  }

  // --- LAYER 2: Back Wing (Left Wing, facing right means left wing is behind) ---
  drawLeftWing(ctx, -50, -115 + bodyBounceY, leftWingAngle, palette);

  // --- LAYER 3: Feet & Talons ---
  drawFeet(ctx, leftFootY, rightFootY, leftFootAngle, rightFootAngle, palette);

  // --- LAYER 4: Main Body ---
  ctx.save();
  ctx.translate(0, bodyBounceY);
  ctx.rotate(bodyRot);

  // Body egg/oval
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = strokeW;
  roundedBody(ctx, -70, -165, 140, 155, [65, 65, 45, 45]);
  ctx.fill();
  ctx.stroke();

  // Belly patch (secondary cream color)
  ctx.fillStyle = palette.secondary;
  roundedBody(ctx, -45, -145, 95, 130, [45, 45, 35, 35]);
  ctx.fill();
  ctx.stroke();

  // Feather chest chevron specks (accent color)
  ctx.fillStyle = palette.accent;
  for (let row = 0; row < 3; row++) {
    const yOff = -120 + row * 22;
    const xBase = -15 + (row % 2) * 12;
    drawChevron(ctx, xBase, yOff, 12, 8, palette.outline);
    drawChevron(ctx, xBase + 24, yOff, 12, 8, palette.outline);
  }

  // --- LAYER 5: Head & Facial Features ---
  ctx.save();
  ctx.translate(5, -185);
  ctx.rotate(headTilt);

  // Ear tufts / horns atop head
  drawEarTufts(ctx, palette);

  // Head circle / rounded shape
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = strokeW;
  ellipse(ctx, 0, -15, 68, 64);
  ctx.fill();
  ctx.stroke();

  // Face disc / mask (owl heart/double-circle mask in secondary color)
  drawFaceDisc(ctx, palette);

  // Eyebrows
  brows(ctx, { x: -22, y: -45, size: 20, expression, color: palette.outline, width: 3.5 });
  brows(ctx, { x: 30, y: -45, size: 22, expression, color: palette.outline, width: 3.5 });

  // Eyes (Pip is looking slightly forward/right)
  eye(ctx, {
    x: -22,
    y: -20,
    size: 20,
    expression,
    blink,
    outlineColor: palette.outline,
    pupilColor: '#1e293b'
  });
  eye(ctx, {
    x: 30,
    y: -20,
    size: 24, // foreground eye slightly larger
    expression,
    blink,
    outlineColor: palette.outline,
    pupilColor: '#1e293b'
  });

  // Beak & Mouth
  drawOwlBeakAndMouth(ctx, mouthShape, expression, palette);

  // --- ACCESSORY LAYER: Glasses (over eyes) ---
  if (accessories.includes('glasses')) {
    drawGlasses(ctx, palette.outline);
  }

  // --- ACCESSORY LAYER: Hat (atop head) ---
  if (accessories.includes('hat')) {
    drawHat(ctx, palette);
  }

  ctx.restore(); // restore head

  // --- ACCESSORY LAYER: Scarf / Bow Tie ---
  if (accessories.includes('scarf')) {
    drawScarf(ctx, -145 + bodyBounceY, time, palette);
  }
  if (accessories.includes('bow')) {
    drawBowTie(ctx, 15, -145 + bodyBounceY, palette);
  }

  ctx.restore(); // restore body transform

  // --- LAYER 6: Foreground Wing (Right Wing) ---
  drawRightWing(
    ctx,
    rightWingX,
    rightWingY + bodyBounceY,
    rightWingAngle,
    isPointing,
    isWaving,
    palette
  );

  ctx.restore(); // restore character base transform
}

// ----------------- Helper Draw Functions for Owl -----------------

function drawChevron(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  outlineColor: string
): void {
  ctx.save();
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w / 2, y);
  ctx.stroke();
  ctx.restore();
}

function drawEarTufts(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  // Left tuft
  ctx.beginPath();
  ctx.moveTo(-45, -60);
  ctx.quadraticCurveTo(-65, -95, -55, -105);
  ctx.quadraticCurveTo(-45, -90, -32, -72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left tuft accent feather
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(-48, -65);
  ctx.quadraticCurveTo(-60, -92, -54, -98);
  ctx.quadraticCurveTo(-47, -86, -38, -72);
  ctx.closePath();
  ctx.fill();

  // Right tuft
  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  ctx.moveTo(35, -60);
  ctx.quadraticCurveTo(55, -95, 62, -102);
  ctx.quadraticCurveTo(46, -88, 25, -72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right tuft accent feather
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(37, -65);
  ctx.quadraticCurveTo(52, -92, 57, -96);
  ctx.quadraticCurveTo(44, -85, 30, -72);
  ctx.closePath();
  ctx.fill();
}

function drawFaceDisc(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.fillStyle = palette.secondary;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';

  // Double circle mask behind eyes
  ctx.beginPath();
  ctx.arc(-22, -20, 32, 0, Math.PI * 2);
  ctx.arc(30, -20, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawOwlBeakAndMouth(
  ctx: CanvasRenderingContext2D,
  mouthShape: 'closed' | 'half' | 'wide',
  expression: string,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(6, -5);

  const beakColor = palette.accent;
  const outlineColor = palette.outline;

  if (mouthShape === 'closed') {
    // Sharp, cute golden beak
    ctx.fillStyle = beakColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.quadraticCurveTo(5, -10, 18, -4);
    ctx.quadraticCurveTo(10, 14, 0, 16);
    ctx.quadraticCurveTo(-6, 8, -10, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle highlight on beak ridge
    ctx.strokeStyle = shade(beakColor, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(8, -3);
    ctx.stroke();
  } else if (mouthShape === 'half') {
    // Upper beak open, showing interior & pink tongue
    ctx.fillStyle = '#6b1717';
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(8, 0, 18, 5);
    ctx.quadraticCurveTo(8, 22, -4, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tongue
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(4, 14, 6, 0, Math.PI * 2);
    ctx.fill();

    // Upper beak overhanging
    ctx.fillStyle = beakColor;
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.quadraticCurveTo(6, -10, 18, -2);
    ctx.quadraticCurveTo(4, 4, -10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Wide open squawking / joyful beak
    ctx.fillStyle = '#6b1717';
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(4, 10, 16, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tongue
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.ellipse(4, 18, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Upper beak
    ctx.fillStyle = beakColor;
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.quadraticCurveTo(6, -14, 22, -4);
    ctx.quadraticCurveTo(8, 2, -12, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lower beak rim
    ctx.fillStyle = shade(beakColor, -0.15);
    ctx.beginPath();
    ctx.moveTo(-8, 20);
    ctx.quadraticCurveTo(6, 32, 16, 22);
    ctx.quadraticCurveTo(4, 20, -8, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawLeftWing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = shade(palette.primary, -0.2); // slightly darker for depth
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-35, 30, -30, 75);
  ctx.quadraticCurveTo(-15, 80, -5, 60);
  ctx.quadraticCurveTo(15, 30, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawRightWing(
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
    // Pointing wing stretched towards right
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(40, -10, 95, -5);
    ctx.quadraticCurveTo(80, 15, 45, 25);
    ctx.quadraticCurveTo(10, 20, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Accent feather tip
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.moveTo(70, -7);
    ctx.quadraticCurveTo(85, -6, 95, -5);
    ctx.quadraticCurveTo(82, 12, 65, 14);
    ctx.closePath();
    ctx.fill();
  } else if (isWaving) {
    // Raised waving wing
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(25, -45, 45, -85);
    ctx.quadraticCurveTo(25, -75, 10, -55);
    ctx.quadraticCurveTo(-5, -25, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Accent tip
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.moveTo(25, -55);
    ctx.quadraticCurveTo(38, -72, 45, -85);
    ctx.quadraticCurveTo(30, -75, 20, -65);
    ctx.closePath();
    ctx.fill();
  } else {
    // Resting wing along the flank
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(35, 30, 32, 85);
    ctx.quadraticCurveTo(15, 90, 5, 75);
    ctx.quadraticCurveTo(-15, 45, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Accent feather layer
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.moveTo(15, 30);
    ctx.quadraticCurveTo(32, 55, 30, 85);
    ctx.quadraticCurveTo(20, 88, 12, 75);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawFeet(
  ctx: CanvasRenderingContext2D,
  leftY: number,
  rightY: number,
  leftAngle: number,
  rightAngle: number,
  palette: Palette
): void {
  // Left foot (back)
  ctx.save();
  ctx.translate(-25, -8 - leftY);
  ctx.rotate(leftAngle);
  drawTalon(ctx, shade(palette.accent, -0.15), palette.outline);
  ctx.restore();

  // Right foot (front)
  ctx.save();
  ctx.translate(22, -8 - rightY);
  ctx.rotate(rightAngle);
  drawTalon(ctx, palette.accent, palette.outline);
  ctx.restore();
}

function drawTalon(
  ctx: CanvasRenderingContext2D,
  fillColor: string,
  outlineColor: string
): void {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // 3 round forward cartoon talons
  ctx.arc(-10, 0, 8, 0, Math.PI * 2);
  ctx.arc(0, 3, 9, 0, Math.PI * 2);
  ctx.arc(12, 1, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// ----------------- Accessories -----------------

function drawCape(
  ctx: CanvasRenderingContext2D,
  bodyY: number,
  time: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(-35, -140 + bodyY);

  const wave = Math.sin(time * 5) * 8;
  const capeColor = '#e63946'; // Vibrant heroic red
  ctx.fillStyle = capeColor;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-60 + wave * 0.5, 60, -75 + wave, 135);
  ctx.quadraticCurveTo(-35, 145, 5, 130);
  ctx.quadraticCurveTo(10, 60, 20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gold trim on cape edge
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-75 + wave, 135);
  ctx.quadraticCurveTo(-35, 145, 5, 130);
  ctx.stroke();

  ctx.restore();
}

function drawBackpack(
  ctx: CanvasRenderingContext2D,
  bodyY: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(-72, -120 + bodyY);

  // Backpack body
  ctx.fillStyle = '#457b9d'; // Sturdy adventurer blue
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  roundedBody(ctx, -22, -30, 35, 60, [10, 10, 8, 8]);
  ctx.fill();
  ctx.stroke();

  // Flap & pocket
  ctx.fillStyle = '#1d3557';
  roundedBody(ctx, -24, -30, 38, 25, [10, 10, 4, 4]);
  ctx.fill();
  ctx.stroke();

  // Buckle
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-12, -10, 12, 8);
  ctx.strokeRect(-12, -10, 12, 8);

  ctx.restore();
}

function drawScarf(
  ctx: CanvasRenderingContext2D,
  neckY: number,
  time: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(5, neckY);

  const scarfColor = '#e76f51'; // Cozy terracotta
  ctx.fillStyle = scarfColor;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;

  // Neck ring
  roundedBody(ctx, -55, -12, 110, 26, 12);
  ctx.fill();
  ctx.stroke();

  // Trailing tails waving gently
  const flutter = Math.sin(time * 4) * 6;
  ctx.beginPath();
  ctx.moveTo(25, 10);
  ctx.quadraticCurveTo(35 + flutter, 45, 30 + flutter * 1.5, 75);
  ctx.lineTo(50 + flutter * 1.5, 75);
  ctx.quadraticCurveTo(55 + flutter, 40, 45, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stripes on trailing tail
  ctx.strokeStyle = '#f4a261';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(28 + flutter * 0.8, 35);
  ctx.lineTo(48 + flutter * 0.8, 35);
  ctx.moveTo(30 + flutter * 1.2, 55);
  ctx.lineTo(50 + flutter * 1.2, 55);
  ctx.stroke();

  ctx.restore();
}

function drawBowTie(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette: Palette
): void {
  ctx.save();
  ctx.translate(x, y);

  const bowColor = '#d62828';
  ctx.fillStyle = bowColor;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3;

  // Wings of bow
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-20, -12);
  ctx.lineTo(-20, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(20, -12);
  ctx.lineTo(20, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center knot
  ctx.fillStyle = '#9e1b1b';
  ellipse(ctx, 0, 0, 7, 7);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawGlasses(ctx: CanvasRenderingContext2D, outlineColor: string): void {
  ctx.save();
  ctx.strokeStyle = '#d4a373'; // Warm brass frame
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';

  // Left frame
  ctx.beginPath();
  ctx.arc(-22, -20, 24, 0, Math.PI * 2);
  ctx.stroke();

  // Right frame
  ctx.beginPath();
  ctx.arc(30, -20, 28, 0, Math.PI * 2);
  ctx.stroke();

  // Bridge between rims
  ctx.beginPath();
  ctx.moveTo(2, -24);
  ctx.quadraticCurveTo(5, -30, 8, -24);
  ctx.stroke();

  // Subtle glass sheen
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(30, -20, 22, -Math.PI * 0.75, -Math.PI * 0.35);
  ctx.stroke();

  ctx.restore();
}

function drawHat(ctx: CanvasRenderingContext2D, palette: Palette): void {
  ctx.save();
  ctx.translate(8, -75);

  const hatColor = '#2a9d8f'; // Emerald green acorn/adventurer cap
  ctx.fillStyle = hatColor;
  ctx.strokeStyle = palette.outline;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';

  // Brim
  ellipse(ctx, 0, 0, 48, 14);
  ctx.fill();
  ctx.stroke();

  // Dome
  ctx.beginPath();
  ctx.moveTo(-35, -4);
  ctx.quadraticCurveTo(-38, -48, 0, -52);
  ctx.quadraticCurveTo(38, -48, 35, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hat ribbon band
  ctx.fillStyle = '#e76f51';
  ctx.fillRect(-35, -16, 70, 12);
  ctx.strokeRect(-35, -16, 70, 12);

  // Feather tucked in ribbon
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(25, -16);
  ctx.quadraticCurveTo(45, -35, 52, -55);
  ctx.quadraticCurveTo(35, -40, 22, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
