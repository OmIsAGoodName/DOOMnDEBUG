/**
 * VoxFable Background: Cozy Treehouse Interior (`treehouse_interior`)
 *
 * Layers:
 * 1. Warm Wooden Plank Wall Background
 * 2. Large Round Window overlooking swaying green canopy
 * 3. Ceiling Beam with hanging glowing lantern
 * 4. Bookshelf with colorful storybooks
 * 5. Ground Band (y: 0.62 * h to 0.92 * h) with cozy braided rug
 * 6. Ambient Dust motes drifting in the window sunbeams
 */

export function drawTreehouseInterior(
  ctx: CanvasRenderingContext2D,
  t: number,
  w: number,
  h: number
): void {
  ctx.save();

  // 1. Wooden Plank Wall
  ctx.fillStyle = '#b07d58';
  ctx.fillRect(0, 0, w, h);

  // Horizontal plank seams
  ctx.strokeStyle = '#85532b';
  ctx.lineWidth = 3;
  for (let y = 0; y < h * 0.62; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 2. Large Round Window (center-left)
  const winX = w * 0.28;
  const winY = h * 0.32;
  const winR = h * 0.22;

  // Outer frame
  ctx.fillStyle = '#6f4e37';
  ctx.beginPath();
  ctx.arc(winX, winY, winR + 14, 0, Math.PI * 2);
  ctx.fill();

  // Window view clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(winX, winY, winR, 0, Math.PI * 2);
  ctx.clip();

  // Sky through window
  const winSky = ctx.createLinearGradient(winX, winY - winR, winX, winY + winR);
  winSky.addColorStop(0, '#70d6ff');
  winSky.addColorStop(1, '#b8e0d2');
  ctx.fillStyle = winSky;
  ctx.fillRect(winX - winR, winY - winR, winR * 2, winR * 2);

  // Swaying tree foliage through window
  const leafSway = Math.sin(t * 1.6) * 12;
  ctx.fillStyle = '#40916c';
  ctx.beginPath();
  ctx.arc(winX - 35 + leafSway, winY + 20, 75, 0, Math.PI * 2);
  ctx.arc(winX + 45 - leafSway * 0.5, winY - 15, 65, 0, Math.PI * 2);
  ctx.fill();

  // Window crossbar panes
  ctx.strokeStyle = '#6f4e37';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(winX - winR, winY);
  ctx.lineTo(winX + winR, winY);
  ctx.moveTo(winX, winY - winR);
  ctx.lineTo(winX, winY + winR);
  ctx.stroke();

  ctx.restore(); // restore window clip

  // 3. Bookshelf on the right wall
  const shelfX = w * 0.76;
  const shelfY = h * 0.18;
  const shelfW = w * 0.18;
  const shelfH = h * 0.38;

  ctx.fillStyle = '#6f4e37';
  ctx.fillRect(shelfX, shelfY, shelfW, shelfH);

  // Shelves & books
  const bookColors = ['#e63946', '#3a86ff', '#ffd166', '#2a9d8f', '#9d4edd', '#f4a261'];
  for (let row = 0; row < 3; row++) {
    const ry = shelfY + row * (shelfH / 3) + 12;
    ctx.fillStyle = '#85532b';
    ctx.fillRect(shelfX + 6, ry + 36, shelfW - 12, 8); // shelf board

    // Draw row of books
    let bx = shelfX + 12;
    for (let b = 0; b < 6; b++) {
      const bw = 12 + (b % 3) * 4;
      const bh = 24 + ((b * 5) % 12);
      ctx.fillStyle = bookColors[(row * 3 + b) % bookColors.length];
      ctx.fillRect(bx, ry + 36 - bh, bw, bh);
      bx += bw + 3;
    }
  }

  // 4. Ceiling Beam & Hanging Lantern
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(0, 0, w, 28);

  const lanternX = w * 0.55;
  // Cord
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(lanternX, 28);
  ctx.lineTo(lanternX, h * 0.22);
  ctx.stroke();

  // Lantern lamp
  ctx.fillStyle = '#ffd166';
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(lanternX, h * 0.25, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Lantern cap
  ctx.fillStyle = '#85532b';
  ctx.fillRect(lanternX - 14, h * 0.25 - 22, 28, 8);

  // 5. Ground Band (y: 0.62 * h to 0.92 * h) - Wooden Floorboards
  const floorGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
  floorGrad.addColorStop(0, '#9c6644');
  floorGrad.addColorStop(1, '#7f4f24');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  // Floor plank lines
  ctx.strokeStyle = '#583113';
  ctx.lineWidth = 2;
  for (let fx = 0; fx < w; fx += 110) {
    ctx.beginPath();
    ctx.moveTo(fx, h * 0.62);
    ctx.lineTo(fx - 40, h);
    ctx.stroke();
  }

  // Cozy Braided Rug in Center Ground Band
  const rugX = w * 0.5;
  const rugY = h * 0.77;
  const rugRx = w * 0.32;
  const rugRy = h * 0.12;

  // Outer ring
  ctx.fillStyle = '#e76f51';
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(rugX, rugY, rugRx, rugRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Middle ring
  ctx.fillStyle = '#f4a261';
  ctx.beginPath();
  ctx.ellipse(rugX, rugY, rugRx * 0.75, rugRy * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring
  ctx.fillStyle = '#e9c46a';
  ctx.beginPath();
  ctx.ellipse(rugX, rugY, rugRx * 0.45, rugRy * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // 6. Ambient Warm Sunbeam & Dust motes
  ctx.fillStyle = 'rgba(255, 255, 220, 0.6)';
  for (let m = 0; m < 15; m++) {
    const mx = winX + ((m * 41 + t * 8) % (w * 0.35));
    const my = h * 0.25 + ((m * 29 + t * 12) % (h * 0.45));
    const mSize = 1.2 + Math.sin(t * 3 + m) * 0.6;
    ctx.beginPath();
    ctx.arc(mx, my, Math.max(0.4, mSize), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
