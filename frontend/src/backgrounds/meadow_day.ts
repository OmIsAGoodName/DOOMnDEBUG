/**
 * VoxFable Background: Green Meadow (`meadow_day`)
 *
 * Layers:
 * 1. Warm Sunny Blue Sky Gradient
 * 2. Fluffy Drifting Clouds (t-driven)
 * 3. Distant Mountain Peaks with Snow Caps
 * 4. Rolling Emerald Meadow Hills
 * 5. Ground Band (y: 0.62 * h to 0.92 * h) with wild clover and daisies
 * 6. Ambient Flying Butterfly / Petal motes
 */

export function drawMeadowDay(
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number
): void {
  ctx.save();

  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.58);
  skyGrad.addColorStop(0, '#48cae4');
  skyGrad.addColorStop(0.65, '#ade8f4');
  skyGrad.addColorStop(1, '#e0fbfc');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Clouds
  drawMeadowCloud(ctx, (w * 0.2 + t * 14) % (w + 240) - 120, h * 0.12, 1.0);
  drawMeadowCloud(ctx, (w * 0.7 + t * 9) % (w + 240) - 120, h * 0.18, 0.85);

  // 3. Distant Mountain Peaks
  ctx.fillStyle = '#6c757d';
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.52);
  ctx.lineTo(w * 0.35, h * 0.26);
  ctx.lineTo(w * 0.55, h * 0.52);
  ctx.closePath();
  ctx.fill();

  // Mountain snow cap
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(w * 0.31, h * 0.32);
  ctx.lineTo(w * 0.35, h * 0.26);
  ctx.lineTo(w * 0.39, h * 0.32);
  ctx.closePath();
  ctx.fill();

  // Second mountain peak
  ctx.fillStyle = '#8d99ae';
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.52);
  ctx.lineTo(w * 0.68, h * 0.29);
  ctx.lineTo(w * 0.88, h * 0.52);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(w * 0.64, h * 0.34);
  ctx.lineTo(w * 0.68, h * 0.29);
  ctx.lineTo(w * 0.72, h * 0.34);
  ctx.closePath();
  ctx.fill();

  // 4. Rolling Far Hills
  ctx.fillStyle = '#80b918';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.52);
  ctx.bezierCurveTo(w * 0.3, h * 0.45, w * 0.7, h * 0.56, w, h * 0.5);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#55a630';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.58);
  ctx.bezierCurveTo(w * 0.25, h * 0.54, w * 0.65, h * 0.62, w, h * 0.57);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 5. Ground Band (y: 0.62 * h to 0.92 * h)
  const groundGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
  groundGrad.addColorStop(0, '#38b000');
  groundGrad.addColorStop(0.5, '#2b9348');
  groundGrad.addColorStop(1, '#007200');
  ctx.fillStyle = groundGrad;

  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.bezierCurveTo(w * 0.3, h * 0.60, w * 0.7, h * 0.64, w, h * 0.62);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Wildflower Clusters & Daisies in Meadow
  for (let fl = 0; fl < 16; fl++) {
    const fx = (fl * 83) % w;
    const fy = h * 0.66 + ((fl * 37) % (h * 0.26));
    drawDaisy(ctx, fx, fy);
  }

  // 6. Flying Butterfly motes (gentle flutter)
  const bX = (w * 0.4 + t * 25) % w;
  const bY = h * 0.58 + Math.sin(t * 5) * 20;
  drawButterfly(ctx, bX, bY, t);

  ctx.restore();
}

function drawMeadowCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.arc(25, -8, 25, 0, Math.PI * 2);
  ctx.arc(50, 0, 22, 0, Math.PI * 2);
  ctx.arc(25, 10, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDaisy(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  // Petals
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 5, Math.sin(angle) * 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Yellow center
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawButterfly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();
  ctx.translate(x, y);
  const flap = Math.abs(Math.sin(t * 8));

  ctx.fillStyle = '#ff70a6';
  // Left wing
  ctx.beginPath();
  ctx.ellipse(-6 * flap, -4, 7 * flap, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Right wing
  ctx.beginPath();
  ctx.ellipse(6 * flap, -4, 7 * flap, 10, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#2b2d42';
  ctx.fillRect(-1.5, -7, 3, 14);

  ctx.restore();
}
