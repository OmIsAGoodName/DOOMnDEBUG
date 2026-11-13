/**
 * VoxFable Background: Forest Night (`forest_night`)
 *
 * Layers:
 * 1. Deep Midnight Sky Gradient
 * 2. Twinkling Stars (pure function of t) & Crescent Moon
 * 3. Far Distant Dark Ridge Silhouettes
 * 4. Midground Night Trees (deep charcoal teal)
 * 5. Ground Band (y: 0.62 * h to 0.92 * h)
 * 6. Drifting Bioluminescent Fireflies (glowing motes driven by t)
 *
 * NO mood tint (engine tints).
 */

export function drawForestNight(
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number
): void {
  ctx.save();

  // 1. Midnight Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  skyGrad.addColorStop(0, '#0b132b');
  skyGrad.addColorStop(0.5, '#1c2541');
  skyGrad.addColorStop(1, '#3a506b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Glowing Moon
  ctx.save();
  ctx.fillStyle = '#fefae0';
  ctx.shadowColor = 'rgba(254, 250, 224, 0.6)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.18, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Twinkling Stars (deterministic sine of t)
  ctx.fillStyle = '#ffffff';
  for (let s = 0; s < 35; s++) {
    const sx = ((s * 97) % w);
    const sy = ((s * 43) % (h * 0.48));
    const sparkle = 0.5 + 0.5 * Math.sin(t * 3 + s * 1.7);
    const size = (1.2 + (s % 3) * 0.8) * sparkle;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0.3, size), 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Far Distant Ridge
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.52);
  ctx.bezierCurveTo(w * 0.3, h * 0.45, w * 0.6, h * 0.58, w, h * 0.5);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 4. Distant Pine Silhouettes
  ctx.fillStyle = '#0f172a';
  for (let p = 0; p < 16; p++) {
    const px = (p / 15) * w;
    const py = h * 0.57;
    const ph = 60 + (p % 4) * 16;
    ctx.beginPath();
    ctx.moveTo(px, py - ph);
    ctx.lineTo(px + 22, py);
    ctx.lineTo(px - 22, py);
    ctx.closePath();
    ctx.fill();
  }

  // 5. Midground Trees with wind sway
  const sway = Math.sin(t * 1.5) * 5;
  drawNightTree(ctx, w * 0.08, h * 0.65, 80, 230, sway);
  drawNightTree(ctx, w * 0.92, h * 0.64, 75, 220, -sway);

  // 6. Ground Band (y: 0.62 * h to 0.92 * h)
  const groundGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
  groundGrad.addColorStop(0, '#132a26');
  groundGrad.addColorStop(0.5, '#0e1f1c');
  groundGrad.addColorStop(1, '#081210');
  ctx.fillStyle = groundGrad;

  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.bezierCurveTo(w * 0.3, h * 0.60, w * 0.7, h * 0.64, w, h * 0.62);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Moonlit Path
  const pathGrad = ctx.createLinearGradient(0, h * 0.63, 0, h);
  pathGrad.addColorStop(0, '#2b3a4a');
  pathGrad.addColorStop(1, '#1b263b');
  ctx.fillStyle = pathGrad;

  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.62);
  ctx.bezierCurveTo(w * 0.44, h * 0.69, w * 0.28, h * 0.82, w * 0.18, h);
  ctx.lineTo(w * 0.65, h);
  ctx.bezierCurveTo(w * 0.68, h * 0.82, w * 0.58, h * 0.69, w * 0.48, h * 0.62);
  ctx.closePath();
  ctx.fill();

  // 7. Drifting Bioluminescent Fireflies
  for (let f = 0; f < 18; f++) {
    const fx = (w * 0.15 + f * 67 + Math.sin(t * 2 + f) * 45) % w;
    const fy = h * 0.52 + ((f * 31 + t * 15) % (h * 0.4));
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + f * 2);

    ctx.save();
    ctx.fillStyle = `rgba(167, 243, 208, ${0.4 * pulse})`;
    ctx.beginPath();
    ctx.arc(fx, fy, 8 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawNightTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  trunkW: number,
  h: number,
  sway: number
): void {
  ctx.save();
  ctx.translate(x, y);

  // Trunk
  ctx.fillStyle = '#141e28';
  ctx.beginPath();
  ctx.moveTo(-trunkW * 0.25, 0);
  ctx.quadraticCurveTo(-trunkW * 0.15, -h * 0.45, -trunkW * 0.12 + sway * 0.2, -h * 0.8);
  ctx.lineTo(trunkW * 0.12 + sway * 0.2, -h * 0.8);
  ctx.quadraticCurveTo(trunkW * 0.15, -h * 0.45, trunkW * 0.25, 0);
  ctx.closePath();
  ctx.fill();

  // Foliage
  ctx.save();
  ctx.translate(sway, -h * 0.8);
  ctx.fillStyle = '#0d1f2d';
  ctx.beginPath();
  ctx.arc(-35, 10, 48, 0, Math.PI * 2);
  ctx.arc(35, 10, 52, 0, Math.PI * 2);
  ctx.arc(0, -35, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
