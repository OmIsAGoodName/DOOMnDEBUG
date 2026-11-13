/**
 * VoxFable Background: Village Street (`village_street`)
 *
 * Layers:
 * 1. Warm Daylight Sky Gradient
 * 2. Distant Hill & Village Silhouettes
 * 3. Midground Fairytale Cottages (timber framing, tiled roofs, flowerboxes)
 * 4. Ground Band (y: 0.62 * h to 0.92 * h) with cobblestone street & sidewalk
 * 5. Foreground Picket Fence & Lampposts
 * 6. Ambient Floating Leaves driven by t
 */

export function drawVillageStreet(
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number
): void {
  ctx.save();

  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  skyGrad.addColorStop(0, '#64dfdf');
  skyGrad.addColorStop(0.6, '#caf0f8');
  skyGrad.addColorStop(1, '#fff1e6');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Far Distant Silhouettes
  ctx.fillStyle = '#90e0ef';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.52);
  ctx.lineTo(w * 0.2, h * 0.46);
  ctx.lineTo(w * 0.45, h * 0.52);
  ctx.lineTo(w * 0.7, h * 0.48);
  ctx.lineTo(w, h * 0.51);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 3. Midground Cottages
  // Left Cottage
  drawCottage(ctx, w * 0.04, h * 0.62, w * 0.32, h * 0.35, '#f4a261', '#e76f51');

  // Center-Right Townhouse
  drawCottage(ctx, w * 0.62, h * 0.62, w * 0.35, h * 0.38, '#e9c46a', '#264653');

  // 4. Ground Band (y: 0.62 * h to 0.92 * h) - Cobblestone Street
  const streetGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
  streetGrad.addColorStop(0, '#94a3b8');
  streetGrad.addColorStop(0.5, '#64748b');
  streetGrad.addColorStop(1, '#475569');
  ctx.fillStyle = streetGrad;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  // Cobblestone Paving Stones
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let row = 0; row < 8; row++) {
    const cy = h * 0.64 + row * 22;
    const xOffset = (row % 2) * 25;
    for (let cx = xOffset; cx < w; cx += 48) {
      ctx.beginPath();
      ctx.roundRect(cx, cy, 42, 16, [6, 6, 6, 6]);
      ctx.fill();
    }
  }

  // Sidewalk Curbs
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.63);
  ctx.lineTo(w, h * 0.63);
  ctx.stroke();

  // 5. Village Lamppost & Flowerpots
  drawLamppost(ctx, w * 0.42, h * 0.62);

  // 6. Ambient Falling Autumn Leaves
  for (let l = 0; l < 8; l++) {
    const lx = (w * 0.2 + l * 95 + Math.sin(t * 2 + l) * 35) % w;
    const ly = ((l * 40 + t * 25) % (h * 0.7));
    const rot = t * 3 + l;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle = l % 2 === 0 ? '#e76f51' : '#f4a261';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawCottage(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  w: number,
  h: number,
  wallColor: string,
  roofColor: string
): void {
  ctx.save();

  // Wall
  ctx.fillStyle = wallColor;
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3.5;
  ctx.fillRect(x, baseY - h * 0.65, w, h * 0.65);
  ctx.strokeRect(x, baseY - h * 0.65, w, h * 0.65);

  // Timber framing lines
  ctx.strokeStyle = '#6f4e37';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, baseY - h * 0.65);
  ctx.lineTo(x + w * 0.5, baseY);
  ctx.moveTo(x, baseY - h * 0.32);
  ctx.lineTo(x + w, baseY - h * 0.32);
  ctx.stroke();

  // Roof Gable
  ctx.fillStyle = roofColor;
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 15, baseY - h * 0.65);
  ctx.lineTo(x + w * 0.5, baseY - h);
  ctx.lineTo(x + w + 15, baseY - h * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Windows with warm yellow light
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x + w * 0.15, baseY - h * 0.52, w * 0.25, h * 0.22);
  ctx.strokeRect(x + w * 0.15, baseY - h * 0.52, w * 0.25, h * 0.22);

  // Door
  ctx.fillStyle = '#6f4e37';
  ctx.fillRect(x + w * 0.55, baseY - h * 0.42, w * 0.3, h * 0.42);
  ctx.strokeRect(x + w * 0.55, baseY - h * 0.42, w * 0.3, h * 0.42);

  // Door handle
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(x + w * 0.62, baseY - h * 0.2, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawLamppost(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;

  // Post pole
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -95);
  ctx.stroke();

  // Lantern head
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-10, -118, 20, 23);
  ctx.strokeRect(-10, -118, 20, 23);

  // Cap
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-14, -118);
  ctx.lineTo(0, -128);
  ctx.lineTo(14, -118);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
