/**
 * VoxFable Prop Renderer & Dispatcher
 *
 * Contract:
 * - drawProp(ctx, id, x, y, scale, t): void
 * - Origin at bottom center (x, y)
 * - Reference size ~80 to 160 px at scale 1.0
 * - 100% deterministic (no Math.random or Date.now)
 * - Missing or unknown prop id draws a safe placeholder and warns once. Never throws.
 */

const warnedProps = new Set<string>();

export function drawProp(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  scale = 1.0,
  t = 0
): void {
  if (!ctx) return;

  const propId = (id || '').toLowerCase().trim();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  switch (propId) {
    case 'lantern':
      drawLantern(ctx, t);
      break;
    case 'key':
      drawKey(ctx);
      break;
    case 'treasure_chest':
      drawTreasureChest(ctx);
      break;
    case 'book':
      drawBook(ctx);
      break;
    case 'apple':
      drawApple(ctx);
      break;
    case 'basket':
      drawBasket(ctx);
      break;
    case 'umbrella':
      drawUmbrella(ctx);
      break;
    case 'balloon':
      drawBalloon(ctx, t);
      break;
    case 'flower':
      drawFlowerProp(ctx);
      break;
    case 'glowing_door':
      drawGlowingDoor(ctx, t);
      break;
    case 'firefly_jar':
      drawFireflyJar(ctx, t);
      break;
    case 'kite':
      drawKite(ctx, t);
      break;
    default:
      if (!warnedProps.has(propId)) {
        console.warn(`[VoxFable Prop] Unknown or unreleased prop id: "${propId}". Drawing placeholder.`);
        warnedProps.add(propId);
      }
      drawPlaceholderProp(ctx, propId || 'unknown');
      break;
  }

  ctx.restore();
}

// ----------------- Individual Prop Implementations -----------------

function drawLantern(ctx: CanvasRenderingContext2D, t: number): void {
  // Height ~90px, origin bottom center
  const pulse = 0.85 + 0.15 * Math.sin(t * 4);

  // Soft glow
  ctx.fillStyle = `rgba(255, 214, 10, ${0.35 * pulse})`;
  ctx.beginPath();
  ctx.arc(0, -45, 42 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Glass chamber
  ctx.fillStyle = '#ffd166';
  ctx.strokeStyle = '#3b2a1e';
  ctx.lineWidth = 3;
  ctx.fillRect(-18, -65, 36, 45);
  ctx.strokeRect(-18, -65, 36, 45);

  // Metal base & cap
  ctx.fillStyle = '#85532b';
  ctx.fillRect(-22, -20, 44, 18);
  ctx.strokeRect(-22, -20, 44, 18);

  ctx.fillRect(-22, -75, 44, 12);
  ctx.strokeRect(-22, -75, 44, 12);

  // Wire handle
  ctx.strokeStyle = '#3b2a1e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -78, 16, Math.PI, 0);
  ctx.stroke();
}

function drawKey(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#2b1e1a';
  ctx.fillStyle = '#ffd166';
  ctx.lineWidth = 3;

  // Bow ring at top
  ctx.beginPath();
  ctx.arc(0, -60, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hole inside ring
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(0, -60, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Stem blade
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-4, -44, 8, 42);
  ctx.strokeRect(-4, -44, 8, 42);

  // Bit teeth
  ctx.fillRect(4, -18, 12, 6);
  ctx.strokeRect(4, -18, 12, 6);
  ctx.fillRect(4, -8, 10, 6);
  ctx.strokeRect(4, -8, 10, 6);
}

function drawTreasureChest(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3.5;

  // Base chest
  ctx.fillStyle = '#85532b';
  ctx.fillRect(-35, -45, 70, 45);
  ctx.strokeRect(-35, -45, 70, 45);

  // Curved lid
  ctx.beginPath();
  ctx.arc(0, -45, 35, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gold iron bands
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-35, -48, 70, 6);
  ctx.strokeRect(-35, -48, 70, 6);

  ctx.fillRect(-22, -45, 8, 45);
  ctx.strokeRect(-22, -45, 8, 45);
  ctx.fillRect(14, -45, 8, 45);
  ctx.strokeRect(14, -45, 8, 45);

  // Keyhole latch
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, -32, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#2b1e1a';
  ctx.beginPath();
  ctx.arc(0, -32, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawBook(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3;

  // Book pages block
  ctx.fillStyle = '#f8edeb';
  ctx.fillRect(-26, -55, 52, 45);
  ctx.strokeRect(-26, -55, 52, 45);

  // Cover spine & leather
  ctx.fillStyle = '#3a86ff';
  ctx.fillRect(-30, -60, 10, 58);
  ctx.strokeRect(-30, -60, 10, 58);

  ctx.fillRect(-28, -60, 56, 8);
  ctx.strokeRect(-28, -60, 56, 8);

  ctx.fillRect(-28, -8, 56, 8);
  ctx.strokeRect(-28, -8, 56, 8);

  // Bookmark ribbon
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(8, -8);
  ctx.lineTo(8, 10);
  ctx.lineTo(14, 4);
  ctx.lineTo(20, 10);
  ctx.lineTo(20, -8);
  ctx.closePath();
  ctx.fill();

  // Gold star on cover
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, -32, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawApple(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3;

  // Apple body
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.arc(-12, -24, 20, 0, Math.PI * 2);
  ctx.arc(12, -24, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Stem
  ctx.strokeStyle = '#6f4e37';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.quadraticCurveTo(4, -55, 12, -58);
  ctx.stroke();

  // Green leaf
  ctx.fillStyle = '#52b788';
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(14, -52, 10, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawBasket(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3.5;

  // Handle
  ctx.beginPath();
  ctx.arc(0, -35, 26, Math.PI, 0);
  ctx.stroke();

  // Woven basket base
  ctx.fillStyle = '#d4a373';
  ctx.beginPath();
  ctx.moveTo(-32, -35);
  ctx.lineTo(32, -35);
  ctx.lineTo(24, 0);
  ctx.lineTo(-24, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crossweave lines
  ctx.strokeStyle = '#85532b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -35);
  ctx.lineTo(-12, 0);
  ctx.moveTo(16, -35);
  ctx.lineTo(12, 0);
  ctx.moveTo(-28, -18);
  ctx.lineTo(28, -18);
  ctx.stroke();
}

function drawUmbrella(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3.5;

  // Canopy dome
  ctx.fillStyle = '#ff006e';
  ctx.beginPath();
  ctx.arc(0, -50, 38, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Scalloped canopy rim
  ctx.fillStyle = '#ffd166';
  for (let s = -32; s <= 32; s += 16) {
    ctx.beginPath();
    ctx.arc(s, -50, 8, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  // Handle rod & hook
  ctx.strokeStyle = '#6f4e37';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.lineTo(0, -12);
  ctx.arc(8, -12, 8, Math.PI, 0, true);
  ctx.stroke();
}

function drawBalloon(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 3) * 10;
  const bob = Math.sin(t * 2) * 6;

  ctx.save();
  ctx.translate(sway, bob);

  // String
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.quadraticCurveTo(-sway * 0.5, -15, 0, 0);
  ctx.stroke();

  // Balloon body
  ctx.fillStyle = '#e63946';
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -85, 28, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Knot
  ctx.beginPath();
  ctx.moveTo(-5, -49);
  ctx.lineTo(5, -49);
  ctx.lineTo(0, -44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(10, -96, 6, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFlowerProp(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3;

  // Stem
  ctx.strokeStyle = '#52b788';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, -25, 0, -45);
  ctx.stroke();

  // Leaves
  ctx.fillStyle = '#52b788';
  ctx.beginPath();
  ctx.ellipse(-14, -22, 10, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Flower petals
  ctx.save();
  ctx.translate(0, -45);
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 16, Math.sin(angle) * 16, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Flower center
  ctx.fillStyle = '#85532b';
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGlowingDoor(ctx: CanvasRenderingContext2D, t: number): void {
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);

  // Outer stone arch
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-36, 0);
  ctx.lineTo(-36, -85);
  ctx.arc(0, -85, 36, Math.PI, 0);
  ctx.lineTo(36, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing magical interior portal
  ctx.fillStyle = `rgba(112, 214, 255, ${0.7 + 0.3 * pulse})`;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(-26, -85);
  ctx.arc(0, -85, 26, Math.PI, 0);
  ctx.lineTo(26, 0);
  ctx.closePath();
  ctx.fill();

  // Magical star runes inside door
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, -85, 8 * pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawFireflyJar(ctx: CanvasRenderingContext2D, t: number): void {
  // Jar body
  ctx.fillStyle = 'rgba(224, 242, 254, 0.6)';
  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-20, -55, 40, 52, [8, 8, 10, 10]);
  ctx.fill();
  ctx.stroke();

  // Cork stopper
  ctx.fillStyle = '#d4a373';
  ctx.fillRect(-15, -64, 30, 10);
  ctx.strokeRect(-15, -64, 30, 10);

  // Drifting blinking fireflies inside jar
  for (let f = 0; f < 4; f++) {
    const fx = Math.sin(t * 3 + f * 1.5) * 11;
    const fy = -30 + Math.cos(t * 2.5 + f * 2) * 15;
    const blink = 0.5 + 0.5 * Math.sin(t * 6 + f * 3);

    ctx.fillStyle = `rgba(167, 243, 208, ${blink})`;
    ctx.beginPath();
    ctx.arc(fx, fy, 4 * blink, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawKite(ctx: CanvasRenderingContext2D, t: number): void {
  const flutter = Math.sin(t * 6) * 12;

  ctx.save();
  ctx.translate(flutter, -60);
  ctx.rotate(Math.sin(t * 4) * 0.15);

  ctx.strokeStyle = '#2b1e1a';
  ctx.lineWidth = 3;

  // Diamond kite body
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(26, 0);
  ctx.lineTo(0, 40);
  ctx.lineTo(-26, 0);
  ctx.closePath();

  ctx.fillStyle = '#e63946';
  ctx.fill();
  ctx.stroke();

  // Cross struts
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(0, 40);
  ctx.moveTo(-26, 0);
  ctx.lineTo(26, 0);
  ctx.stroke();

  // Ribbon tail
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.quadraticCurveTo(15, 65, 0, 85);
  ctx.quadraticCurveTo(-15, 105, 5, 120);
  ctx.stroke();

  ctx.restore();
}

function drawPlaceholderProp(ctx: CanvasRenderingContext2D, id: string): void {
  ctx.fillStyle = '#ffbe0b';
  ctx.strokeStyle = '#fb5607';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(0, -25, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(id, 0, -20);
}

export default drawProp;
