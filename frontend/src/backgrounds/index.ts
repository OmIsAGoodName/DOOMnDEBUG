export function drawBackground(
  ctx: CanvasRenderingContext2D,
  id: string,
  t: number,
  w: number,
  h: number
): void {
  ctx.save();
  // Simple sky and ground gradient stub
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#70d6ff');
  gradient.addColorStop(0.65, '#e9ff70');
  gradient.addColorStop(1, '#a7c957');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Background ID tag
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Background stub: ${id}`, 40, 50);

  ctx.restore();
}

export default drawBackground;

