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

  // Camera Pan and Zoom transform on world layer
  ctx.save();
  const centerX = width / 2;
  const centerY = height / 2;

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

  ctx.translate(centerX + panX, centerY + panY);
  ctx.scale(zoom, zoom);
  ctx.translate(-centerX, -centerY);

  // 2. Draw Background
  try {
    drawBackground(ctx, activeScene.backgroundId, t, width, height);
  } catch (err) {
    warnOnce(activeScene.backgroundId, 'background');
    drawPlaceholder(ctx, activeScene.backgroundId, 'bg', centerX, centerY, width, height);
  }

  // 3. Draw Props
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

  // 4. Characters sorted by y position
  const castMap = new Map<string, typeof timeline.plan.cast[0]>();
  for (const c of timeline.plan.cast) {
    castMap.set(c.character_id, c);
  }

  const charactersToDraw: Array<{
    charId: string;
    state: ReturnType<typeof evaluateCharacterState>;
    cast: typeof timeline.plan.cast[0];
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

  // Sort characters by Y (feet position)
  charactersToDraw.sort((a, b) => a.state.y - b.state.y);

  for (const item of charactersToDraw) {
    const { charId, state, cast } = item;
    const px = state.x * width;
    const py = state.y * height;

    // Determine mouth shape
    let mouth: 'closed' | 'half' | 'wide' = 'closed';
    if (opts?.mouthOverride) {
      mouth = opts.mouthOverride;
    } else if (state.animation === 'talk' && currentBeat?.speech && currentBeat.speech.character_id === charId) {
      const lineId = currentBeat.lineId;
      if (lineId && !currentBeat.estimatedSpeech) {
        mouth = mouthAt(lineId, t - currentBeat.startTime);
      } else {
        mouth = fallbackMouthCycle(t, currentBeat.speech.text.length, true);
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

  // 6. Scene Cross-fade (0.5s total: 0.25s at scene start and 0.25s at scene end)
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

  // 7. Captions
  const showCaptions = opts?.showCaptions !== false;
  if (showCaptions && currentBeat?.speech?.text) {
    drawCaptions(ctx, currentBeat, t, width, height, castMap);
  }

  ctx.restore();
}

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
  const paddingX = 24;
  const paddingY = 12;
  const bottomY = height - 48;

  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fullText = speakerName ? `${speakerName}: ${speech.text}` : speech.text;
  const metrics = ctx.measureText(fullText);
  const pillWidth = Math.min(width - 80, metrics.width + paddingX * 2);
  const pillHeight = 48;
  const pillX = width / 2 - pillWidth / 2;
  const pillY = bottomY - pillHeight / 2;

  // Background pill
  ctx.fillStyle = isNarrate ? 'rgba(15, 23, 42, 0.75)' : 'rgba(30, 41, 59, 0.85)';
  ctx.strokeStyle = isNarrate ? 'rgba(255, 255, 255, 0.15)' : 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 24);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = isNarrate ? '#f8fafc' : '#fef08a';
  ctx.fillText(fullText, width / 2, bottomY);

  ctx.restore();
}
