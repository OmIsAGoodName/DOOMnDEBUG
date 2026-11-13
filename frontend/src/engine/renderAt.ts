import type { CastMember, CharacterDrawState } from '@contracts';
import { drawCharacter } from '@/characters';
import { drawBackground } from '@/backgrounds';
import { drawProp } from '@/props';
import type { MoodName, RenderOptions, ResolvedBeat, ResolvedScene, ResolvedTimeline } from './types';
import { evaluateCharacterState } from './resolveTimeline';
import { fallbackMouthCycle, mouthAt } from './audio/lipsync';

const warnedIds = new Set<string>();

function warnOnce(id: string, type: string) {
  if (!warnedIds.has(id)) {
    warnedIds.add(id);
    console.warn(`[renderAt] Unknown or missing ${type} id: "${id}", rendering placeholder.`);
  }
}

const MOOD_CONFIG: Record<MoodName, { color: string; opacity: number }> = {
  day: { color: '#000000', opacity: 0.0 },
  sunset: { color: '#ff9a4d', opacity: 0.18 },
  night: { color: '#1c2a5a', opacity: 0.35 },
  cozy: { color: '#ffb36b', opacity: 0.12 },
  magical: { color: '#9b6bff', opacity: 0.15 },
};

const SHOT_ZOOMS: Record<string, number> = {
  wide: 1.0,
  medium: 1.35,
  close: 1.8,
};

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  id: string,
  type: string,
  x: number,
  y: number,
  w = 80,
  h = 80
) {
  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - w / 2, y - h, w, h);

  ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.fillRect(x - w / 2, y - h, w, h);

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`[${type}]`, x, y - h / 2 - 4);
  ctx.fillText(id, x, y - h / 2 + 12);
  ctx.restore();
}

/**
 * Pure function of time: renders the exact scene state at time t onto a 1280x720 canvas.
 */
export function renderAt(
  ctx: CanvasRenderingContext2D,
  timeline: ResolvedTimeline,
  t: number,
  opts?: RenderOptions
): void {
  const width = 1280;
  const height = 720;

  // Clear canvas
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Find active scene at time t
  let activeScene: ResolvedScene | null = null;
  for (const sc of timeline.scenes) {
    if (t >= sc.startTime && t < sc.endTime) {
      activeScene = sc;
      break;
    }
  }

  // If t is at or beyond the last scene end, use the last scene
  if (!activeScene && timeline.scenes.length > 0) {
    if (t >= timeline.totalDuration) {
      activeScene = timeline.scenes[timeline.scenes.length - 1];
    } else {
      activeScene = timeline.scenes[0];
    }
  }

  if (!activeScene) {
    ctx.restore();
    return;
  }

  // Find current beat in scene
  let currentBeat: ResolvedBeat | null = null;
  for (const b of activeScene.beats) {
    if (t >= b.startTime && t < b.endTime) {
      currentBeat = b;
      break;
    }
  }
  if (!currentBeat && activeScene.beats.length > 0) {
    currentBeat = activeScene.beats[activeScene.beats.length - 1];
  }

  // 1. Camera calculation
  let targetZoom = 1.0;
  let cameraMovement = 'static';
  let focusCharId: string | undefined;

  if (currentBeat) {
    for (const act of currentBeat.actions) {
      if (act.action.type === 'SET_CAMERA' && t >= act.startTime) {
        targetZoom = SHOT_ZOOMS[act.action.shot] || 1.0;
        cameraMovement = act.action.movement || 'static';
        focusCharId = act.action.focus_character_id;
      }
    }
  }

  // Cast map
  const castMap = new Map<string, CastMember>();
  for (const c of timeline.plan.cast) {
    castMap.set(c.character_id, c);
  }

  // Evaluate characters
  const charactersToDraw: Array<{
    charId: string;
    state: ReturnType<typeof evaluateCharacterState>;
    cast: CastMember;
  }> = [];

  for (const initChar of activeScene.initialCharacters) {
    const charId = initChar.character_id;
    const castMember = castMap.get(charId);
    if (!castMember) {
      warnOnce(charId, 'cast_member');
      continue;
    }

    const state = evaluateCharacterState(activeScene, charId, initChar, t);
    if (state.visible) {
      charactersToDraw.push({ charId, state, cast: castMember });
    }
  }

  // Determine Camera Center
  let centerX = width / 2;
  let centerY = height / 2;

  if (focusCharId) {
    const focusChar = charactersToDraw.find((c) => c.charId === focusCharId);
    if (focusChar) {
      centerX = focusChar.state.x * width;
      centerY = focusChar.state.y * height - 80; // center near upper torso
    }
  }

  let zoom = targetZoom;
  let panX = 0;
  let panY = 0;

  if (cameraMovement === 'slow_push_in' && currentBeat) {
    const elapsed = t - currentBeat.startTime;
    const progress = Math.min(1, Math.max(0, elapsed / Math.max(currentBeat.duration, 1)));
    zoom = 1.0 + (targetZoom - 1.0) * progress + progress * 0.08;
  } else if (cameraMovement === 'slow_pull_out' && currentBeat) {
    const elapsed = t - currentBeat.startTime;
    const progress = Math.min(1, Math.max(0, elapsed / Math.max(currentBeat.duration, 1)));
    zoom = targetZoom - progress * 0.08;
  } else if (cameraMovement === 'pan_left' && currentBeat) {
    const elapsed = t - currentBeat.startTime;
    panX = (elapsed / currentBeat.duration) * 60;
  } else if (cameraMovement === 'pan_right' && currentBeat) {
    const elapsed = t - currentBeat.startTime;
    panX = -(elapsed / currentBeat.duration) * 60;
  }

  // Apply Camera Transform
  ctx.save();
  ctx.translate(width / 2 + panX, height / 2 + panY);
  ctx.scale(zoom, zoom);
  ctx.translate(-centerX, -centerY);

  // 2. Draw Background
  try {
    drawBackground(ctx, activeScene.backgroundId, t, width, height);
  } catch {
    warnOnce(activeScene.backgroundId, 'background');
    drawPlaceholder(ctx, activeScene.backgroundId, 'bg', width / 2, height / 2, width, height);
  }

  // 3. Draw Scene Ground Props
  const allProps = [...activeScene.initialProps];
  for (const prop of allProps) {
    const px = prop.position[0] * width;
    const py = prop.position[1] * height;
    try {
      drawProp(ctx, prop.prop_id, px, py, 1.0, t);
    } catch {
      warnOnce(prop.prop_id, 'prop');
      drawPlaceholder(ctx, prop.prop_id, 'prop', px, py);
    }
  }

  // 4. Draw Characters (sorted by Y feet position)
  charactersToDraw.sort((a, b) => a.state.y - b.state.y);

  for (const item of charactersToDraw) {
    const { charId, state, cast } = item;
    const px = state.x * width;
    const py = state.y * height;

    // Determine mouth shape
    let mouth: 'closed' | 'half' | 'wide' = 'closed';
    if (opts?.mouthOverride) {
      mouth = opts.mouthOverride;
    } else if (currentBeat?.speech && currentBeat.speech.character_id === charId) {
      const isSpeakingWindow = t >= currentBeat.startTime && t <= currentBeat.startTime + currentBeat.speechDuration;
      if (isSpeakingWindow) {
        const lineId = currentBeat.lineId;
        if (lineId && !currentBeat.estimatedSpeech) {
          mouth = mouthAt(lineId, t - currentBeat.startTime);
        } else {
          mouth = fallbackMouthCycle(t, currentBeat.speech.text?.length || 10, true);
        }
      }
    }

    const drawState: CharacterDrawState = {
      characterId: charId,
      species: cast.species || 'kid',
      x: px,
      y: py,
      scale: state.scale,
      facing: state.facing,
      palette: cast.palette,
      accessories: cast.accessories || [],
      expression: state.expression,
      mouth,
      pose: state.animation,
      poseT: Math.max(0, t - state.animStartTime),
      time: t,
    };

    ctx.save();
    if (state.alpha < 1.0) {
      ctx.globalAlpha = state.alpha;
    }

    // Mirror horizontally around character X when facing left
    if (state.facing === 'left') {
      ctx.translate(px, 0);
      ctx.scale(-1, 1);
      ctx.translate(-px, 0);
    }

    try {
      drawCharacter(ctx, drawState);
    } catch {
      warnOnce(charId, 'character');
      drawPlaceholder(ctx, charId, 'char', px, py);
    }

    // 4.1 Draw Attached Props for this character
    if (state.attachedProps && state.attachedProps.length > 0) {
      for (const ap of state.attachedProps) {
        let propX = px;
        let propY = py;
        const propScale = state.scale * 0.8;

        if (ap.slot === 'head') {
          propY = py - 145 * state.scale;
        } else if (ap.slot === 'hand') {
          const handOffsetX = state.facing === 'left' ? -35 : 35;
          propX = px + handOffsetX * state.scale;
          propY = py - 70 * state.scale;
        } else if (ap.slot === 'ground') {
          propX = px + 25 * state.scale;
          propY = py;
        }

        try {
          drawProp(ctx, ap.propId, propX, propY, propScale, t);
        } catch {
          warnOnce(ap.propId, 'attached_prop');
          drawPlaceholder(ctx, ap.propId, 'prop', propX, propY, 40, 40);
        }
      }
    }

    ctx.restore();
  }

  // End world layer (restore camera)
  ctx.restore();

  // 5. Mood Tint Overlay
  const currentMood = (activeScene.mood as MoodName) || 'day';
  const moodConf = MOOD_CONFIG[currentMood] || MOOD_CONFIG.day;

  if (moodConf.opacity > 0) {
    ctx.save();
    ctx.fillStyle = moodConf.color;
    ctx.globalAlpha = moodConf.opacity;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 6. Scene Cross-fade
  const timeIntoScene = t - activeScene.startTime;
  const timeUntilSceneEnd = activeScene.endTime - t;
  const fadeDuration = 0.25;

  let fadeAlpha = 0;
  if (timeIntoScene < fadeDuration && activeScene !== timeline.scenes[0]) {
    fadeAlpha = 1 - timeIntoScene / fadeDuration;
  } else if (timeUntilSceneEnd < fadeDuration && activeScene !== timeline.scenes[timeline.scenes.length - 1]) {
    fadeAlpha = 1 - timeUntilSceneEnd / fadeDuration;
  }

  if (fadeAlpha > 0) {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = Math.min(1, Math.max(0, fadeAlpha));
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 7. Captions with Karaoke word highlighting and multi-line wrapping
  const showCaptions = opts?.showCaptions !== false;
  if (showCaptions && currentBeat?.speech?.text) {
    drawCaptions(ctx, currentBeat, t, width, height, castMap);
  }

  ctx.restore();
}

/**
 * Draws wrapped captions with rounded translucent pill and karaoke word highlighting.
 */
function drawCaptions(
  ctx: CanvasRenderingContext2D,
  beat: ResolvedBeat,
  t: number,
  width: number,
  height: number,
  castMap: Map<string, CastMember>
) {
  const speech = beat.speech;
  if (!speech || !speech.text) return;

  const isNarrate = speech.type === 'NARRATE';
  const speakerName = !isNarrate && speech.character_id ? castMap.get(speech.character_id)?.name || speech.character_id : null;

  ctx.save();
  const fontSize = 22;
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

  const timeInBeatMs = Math.max(0, (t - beat.startTime) * 1000);
  const words = speech.text.trim().split(/\s+/).filter(Boolean);

  // Check word timings for karaoke
  const timings = beat.words || [];

  // Break words into lines (max 2 lines, max width 1000px)
  const maxLineWidth = 950;
  const lines: string[][] = [[]];
  let currentLineWidth = 0;

  for (const w of words) {
    const wordWidth = ctx.measureText(w + ' ').width;
    if (currentLineWidth + wordWidth > maxLineWidth && lines.length === 1) {
      lines.push([]);
      currentLineWidth = 0;
    }
    lines[lines.length - 1].push(w);
    currentLineWidth += wordWidth;
  }

  const lineHeight = fontSize + 10;
  const pillPaddingX = 28;
  const pillPaddingY = 14;
  const pillHeight = lines.length * lineHeight + pillPaddingY * 2;
  const bottomY = height - 42;
  const pillY = bottomY - pillHeight / 2;

  // Measure max line width for background pill
  let maxW = 0;
  for (const line of lines) {
    const lineW = ctx.measureText((speakerName ? `${speakerName}: ` : '') + line.join(' ')).width;
    if (lineW > maxW) maxW = lineW;
  }
  const pillWidth = Math.min(width - 80, maxW + pillPaddingX * 2);
  const pillX = width / 2 - pillWidth / 2;

  // Rounded background pill
  ctx.fillStyle = isNarrate ? 'rgba(15, 23, 42, 0.82)' : 'rgba(30, 41, 59, 0.90)';
  ctx.strokeStyle = isNarrate ? 'rgba(255, 255, 255, 0.18)' : 'rgba(251, 191, 36, 0.45)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 20);
  ctx.fill();
  ctx.stroke();

  // Render text lines with karaoke highlighting
  let wordGlobalIndex = 0;
  for (let l = 0; l < lines.length; l++) {
    const lineWords = lines[l];
    const lineY = pillY + pillPaddingY + l * lineHeight + fontSize * 0.75;

    // Compute line start X
    let fullLineStr = lineWords.join(' ');
    if (l === 0 && speakerName) {
      fullLineStr = `${speakerName}: ${fullLineStr}`;
    }
    const lineTotalW = ctx.measureText(fullLineStr).width;
    let currentX = width / 2 - lineTotalW / 2;

    if (l === 0 && speakerName) {
      ctx.fillStyle = '#f59e0b'; // Amber chip
      const prefix = `${speakerName}: `;
      ctx.fillText(prefix, currentX, lineY);
      currentX += ctx.measureText(prefix).width;
    }

    for (const w of lineWords) {
      const timing = timings[wordGlobalIndex];
      let wordColor = '#f8fafc'; // default white

      if (timing) {
        if (timeInBeatMs >= timing.start_ms && timeInBeatMs <= timing.end_ms) {
          wordColor = '#fde047'; // Active karaoke word (bright gold)
        } else if (timeInBeatMs > timing.end_ms) {
          wordColor = '#ffffff'; // Past spoken word
        } else {
          wordColor = 'rgba(248, 250, 252, 0.75)'; // Future word
        }
      } else {
        wordColor = isNarrate ? '#f8fafc' : '#fef08a';
      }

      ctx.fillStyle = wordColor;
      ctx.fillText(w, currentX, lineY);
      currentX += ctx.measureText(w + ' ').width;
      wordGlobalIndex++;
    }
  }

  ctx.restore();
}
