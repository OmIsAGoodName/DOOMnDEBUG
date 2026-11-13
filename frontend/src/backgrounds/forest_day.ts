/**
 * VoxFable Background: Forest Day (`forest_day`)
 *
 * Layers:
 * 1. Sky Gradient (warm sunny day)
 * 2. Drifting Clouds (ambient motion driven by t)
 * 3. Far Hills (rolling silhouettes)
 * 4. Midground Trees & Canopy (swaying foliage)
 * 5. Ground Band (y: 0.62 * h to 0.92 * h) with winding path
 * 6. Foreground Grass, Flowers & Mushrooms
 * 7. Ambient Pollen / Dust Motes
 *
 * Note: NO mood tint applied here (the engine applies tinting).
 */

export function drawForestDay(
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number
): void {
  ctx.save();

  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  skyGrad.addColorStop(0, '#70d6ff');   // Crisp clear sky
  skyGrad.addColorStop(0.6, '#b8e0d2'); // Soft woodland horizon glow
  skyGrad.addColorStop(1, '#e8f5e9');   // Pale sun mist
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Drifting Soft Clouds
  drawCloud(ctx, (w * 0.15 + t * 12) % (w + 240) - 120, h * 0.14, 1.1);
  drawCloud(ctx, (w * 0.55 + t * 8) % (w + 260) - 130, h * 0.22, 0.85);
  drawCloud(ctx, (w * 0.82 + t * 15) % (w + 220) - 110, h * 0.12, 0.95);

  // 3. Far Distant Hills
  ctx.fillStyle = '#94d2bd';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.52);
  ctx.bezierCurveTo(w * 0.25, h * 0.44, w * 0.45, h * 0.56, w * 0.7, h * 0.48);
  ctx.bezierCurveTo(w * 0.85, h * 0.43, w * 0.95, h * 0.5, w, h * 0.49);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Second ridge of hills
  ctx.fillStyle = '#6b9080';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.58);
  ctx.bezierCurveTo(w * 0.2, h * 0.53, w * 0.4, h * 0.61, w * 0.6, h * 0.54);
  ctx.bezierCurveTo(w * 0.8, h * 0.48, w * 0.92, h * 0.56, w, h * 0.55);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 4. Distant Tree Silhouettes (Back Canopy)
  ctx.fillStyle = '#406343';
  for (let i = 0; i < 14; i++) {
    const treeX = (i / 13) * w + ((i % 3) - 1) * 20;
    const treeY = h * 0.56;
    const treeH = 65 + (i % 4) * 18;
    drawPineSilhouette(ctx, treeX, treeY, 34, treeH);
  }

  // 5. Midground Deciduous Trees (with gentle wind sway)
  const sway1 = Math.sin(t * 1.6) * 5;
  const sway2 = Math.sin(t * 1.4 + 1.2) * 6;

  // Left background oak
  drawOakTree(ctx, w * 0.08, h * 0.65, 80, 240, sway1);
  // Far right birch cluster
  drawOakTree(ctx, w * 0.92, h * 0.64, 75, 230, sway2);

  // 6. Ground Band (y: 0.62 * h to 0.92 * h)
  // Base ground fill
  const groundGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
  groundGrad.addColorStop(0, '#52b788');  // Lush surface grass
  groundGrad.addColorStop(0.5, '#40916c'); // Rich depth green
  groundGrad.addColorStop(1, '#2d6a4f');   // Deep forest loam
  ctx.fillStyle = groundGrad;

  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.bezierCurveTo(w * 0.28, h * 0.60, w * 0.65, h * 0.64, w, h * 0.62);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Winding Dirt / Pebble Path where characters stroll
  const pathGrad = ctx.createLinearGradient(0, h * 0.63, 0, h * 0.95);
  pathGrad.addColorStop(0, '#e9c46a');
  pathGrad.addColorStop(1, '#d4a373');
  ctx.fillStyle = pathGrad;

  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.62);
  ctx.bezierCurveTo(w * 0.42, h * 0.69, w * 0.25, h * 0.82, w * 0.15, h);
  ctx.lineTo(w * 0.65, h);
  ctx.bezierCurveTo(w * 0.68, h * 0.82, w * 0.58, h * 0.69, w * 0.46, h * 0.62);
  ctx.closePath();
  ctx.fill();

  // Soft path pebbles/textures
  ctx.fillStyle = 'rgba(244, 162, 97, 0.4)';
  for (let p = 0; p < 8; p++) {
    const px = w * 0.35 + (p * 37) % (w * 0.22);
    const py = h * 0.66 + (p * 41) % (h * 0.26);
    ctx.beginPath();
    ctx.ellipse(px, py, 7 + (p % 3) * 2, 4 + (p % 2), 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Foreground Details: Grass Tufts, Wildflowers, Mushrooms
  drawGrassCluster(ctx, w * 0.05, h * 0.66 + sway1 * 0.3, '#74c69d');
  drawGrassCluster(ctx, w * 0.22, h * 0.64 + sway2 * 0.3, '#95d5b2');
  drawGrassCluster(ctx, w * 0.75, h * 0.65 + sway1 * 0.3, '#74c69d');
  drawGrassCluster(ctx, w * 0.88, h * 0.68 + sway2 * 0.3, '#95d5b2');

  // Little woodland flowers along the verge
  drawFlower(ctx, w * 0.26, h * 0.68, '#ffb703', '#ffffff');
  drawFlower(ctx, w * 0.29, h * 0.71, '#fb8500', '#ffffff');
  drawFlower(ctx, w * 0.72, h * 0.69, '#ffb703', '#ffffff');
  drawFlower(ctx, w * 0.78, h * 0.73, '#ff70a6', '#ffffff');

  // Little cute red toadstool mushroom on the left verge
  drawMushroom(ctx, w * 0.12, h * 0.72, 18);
  drawMushroom(ctx, w * 0.145, h * 0.73, 13);

  // 8. Ambient Pollen / Floating Forest Sparkles
  ctx.fillStyle = 'rgba(255, 255, 220, 0.75)';
  for (let m = 0; m < 15; m++) {
    // Pure function of t and particle index m
    const cycle = (t * 0.25 + m * 0.18) % 1;
    const mx = (w * 0.1 + m * 79 + Math.sin(t * 1.5 + m) * 25) % w;
    const my = h * 0.35 + cycle * (h * 0.55);
    const mSize = 1.8 + Math.sin(t * 3 + m) * 0.8;
    ctx.beginPath();
    ctx.arc(mx, my, Math.max(0.5, mSize), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.arc(28, -10, 26, 0, Math.PI * 2);
  ctx.arc(55, 2, 24, 0, Math.PI * 2);
  ctx.arc(26, 12, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPineSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x - w / 2, y);
  ctx.closePath();
  ctx.fill();
}

function drawOakTree(
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
  ctx.fillStyle = '#6f4e37';
  ctx.beginPath();
  ctx.moveTo(-trunkW * 0.25, 0);
  ctx.quadraticCurveTo(-trunkW * 0.15, -h * 0.45, -trunkW * 0.12 + sway * 0.2, -h * 0.8);
  ctx.lineTo(trunkW * 0.12 + sway * 0.2, -h * 0.8);
  ctx.quadraticCurveTo(trunkW * 0.15, -h * 0.45, trunkW * 0.25, 0);
  ctx.closePath();
  ctx.fill();

  // Foliage puffs
  ctx.save();
  ctx.translate(sway, -h * 0.8);

  ctx.fillStyle = '#2d6a4f';
  ctx.beginPath();
  ctx.arc(-35, 10, 48, 0, Math.PI * 2);
  ctx.arc(35, 10, 52, 0, Math.PI * 2);
  ctx.arc(0, -35, 58, 0, Math.PI * 2);
  ctx.fill();

  // Highlights
  ctx.fillStyle = '#52b788';
  ctx.beginPath();
  ctx.arc(-20, -25, 34, 0, Math.PI * 2);
  ctx.arc(20, -20, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function drawGrassCluster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(-14, -16, -18, -24);
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(2, -18, 0, -28);
  ctx.moveTo(8, 0);
  ctx.quadraticCurveTo(14, -14, 18, -22);
  ctx.stroke();

  ctx.restore();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerColor: string,
  petalColor: string
): void {
  ctx.save();
  ctx.translate(x, y);

  // Stem
  ctx.strokeStyle = '#52b788';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 16);
  ctx.stroke();

  // Petals
  ctx.fillStyle = petalColor;
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 6, Math.sin(angle) * 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center
  ctx.fillStyle = centerColor;
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMushroom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.translate(x, y);

  // Stem
  ctx.fillStyle = '#f8edeb';
  ctx.fillRect(-size * 0.2, 0, size * 0.4, size * 0.7);

  // Cap
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.65, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  // White polka dots
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-size * 0.25, -size * 0.25, size * 0.12, 0, Math.PI * 2);
  ctx.arc(size * 0.25, -size * 0.25, size * 0.12, 0, Math.PI * 2);
  ctx.arc(0, -size * 0.45, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
