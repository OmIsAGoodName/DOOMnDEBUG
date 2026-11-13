export function drawProp(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  scale: number,
  t: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffbe0b';
  ctx.strokeStyle = '#fb5607';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(id, 0, 4);

  ctx.restore();
}

export default drawProp;

