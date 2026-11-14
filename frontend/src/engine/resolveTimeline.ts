import type {
  Action,
  ActionAttachProp,
  ActionInteract,
  ActionMoveTo,
  ActionPlayAnimation,
  ActionRemoveCharacter,
  ActionSetExpression,
  ActionSpawnCharacter,
  AudioLine,
  AudioManifest,
  EpisodePlan,
  PlacedCharacter,
  Scene,
} from '@contracts';
import type {
  AttachedPropState,
  MoodName,
  ResolvedAction,
  ResolvedAudioEvent,
  ResolvedBeat,
  ResolvedChoicePoint,
  ResolvedScene,
  ResolvedTimeline,
} from './types';

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateSpeechDuration(text: string): number {
  const words = countWords(text);
  return words / 2.6 + 0.3;
}

export function resolveTimeline(
  plan: EpisodePlan,
  audio: AudioManifest | null,
  chosenOptionIds: string[] = []
): ResolvedTimeline {
  const scenesMap = new Map<string, Scene>();
  if (plan.scenes) {
    for (const s of plan.scenes) {
      scenesMap.set(s.scene_id, s);
    }
  }

  const audioLinesMap = new Map<string, AudioLine>();
  if (audio && audio.lines) {
    for (const line of audio.lines) {
      audioLinesMap.set(line.line_id, line);
    }
  }

  const resolvedScenes: ResolvedScene[] = [];
  const allBeats: ResolvedBeat[] = [];
  const choicePoints: ResolvedChoicePoint[] = [];
  const audioEvents: ResolvedAudioEvent[] = [];
  const chosenPath: string[] = [...chosenOptionIds];

  let currentSceneId: string | null = plan.start_scene;
  let currentTime = 0;
  let choiceIndex = 0;
  let sceneCount = 0;
  const maxScenes = 20; // Guard against infinite branch cycles

  const visitedSceneIds = new Set<string>();

  while (currentSceneId && !visitedSceneIds.has(currentSceneId) && sceneCount < maxScenes) {
    visitedSceneIds.add(currentSceneId);
    sceneCount++;
    const scene = scenesMap.get(currentSceneId);
    if (!scene) {
      console.warn(`[resolveTimeline] Scene ${currentSceneId} not found in plan`);
      break;
    }

    const sceneStartTime = currentTime;
    const resolvedBeats: ResolvedBeat[] = [];

    let nextSceneId: string | null = scene.next_scene ?? null;

    if (scene.beats) {
      for (const beat of scene.beats) {
        const beatStartTime = currentTime;
        const lineId = `${plan.episode_id}:${scene.scene_id}:${beat.beat_id}`;

        let speechDuration = 0;
        let isEstimated = false;
        let wordsTiming = undefined;

        if (beat.speech && beat.speech.text) {
          const audioLine = audioLinesMap.get(lineId);
          if (audioLine) {
            speechDuration = (audioLine.duration_ms || 0) / 1000;
            wordsTiming = audioLine.words;
          } else {
            speechDuration = estimateSpeechDuration(beat.speech.text);
            isEstimated = true;
          }

          if (audioLine) {
            audioEvents.push({
              type: 'speech',
              id: lineId,
              url: audioLine.url,
              startTime: beatStartTime,
              duration: speechDuration,
            });
          }
        }

        // Resolve beat actions
        let latestActionEnd = 0;
        const resolvedActions: ResolvedAction[] = [];

        if (beat.actions) {
          for (let i = 0; i < beat.actions.length; i++) {
            const action = beat.actions[i];
            const delay = action.delay ?? 0;
            let duration = action.duration ?? 0;

            if (action.type === 'MOVE_TO') {
              duration = action.duration;
            } else if (action.type === 'WAIT') {
              duration = action.duration;
            } else if (action.type === 'INTERACT') {
              duration = action.duration ?? 1.5;
            } else if (action.type === 'ATTACH_PROP') {
              duration = action.duration ?? 0.2;
            } else if (action.type === 'PLAY_ANIMATION') {
              duration = action.duration ?? 1.5;
            }

            const actionStart = beatStartTime + delay;
            const actionEnd = actionStart + duration;
            if (actionEnd - beatStartTime > latestActionEnd) {
              latestActionEnd = actionEnd - beatStartTime;
            }

            resolvedActions.push({
              id: `${beat.beat_id}_act_${i}`,
              action,
              startTime: actionStart,
              endTime: actionEnd,
              duration,
            });

            // Music / SFX audio events
            if (action.type === 'PLAY_MUSIC') {
              if (action.music_id && audio?.music) {
                const m = audio.music.find((item) => item.music_id === action.music_id);
                if (m) {
                  audioEvents.push({
                    type: 'music',
                    id: action.music_id,
                    url: m.url,
                    startTime: actionStart,
                    volume: action.volume,
                    fade: action.fade,
                    loop: true,
                  });
                }
              }
            } else if (action.type === 'PLAY_SFX') {
              if (action.sfx_id && audio?.sfx) {
                const s = audio.sfx.find((item) => item.sfx_id === action.sfx_id);
                if (s) {
                  audioEvents.push({
                    type: 'sfx',
                    id: action.sfx_id,
                    url: s.url,
                    startTime: actionStart,
                    volume: action.volume,
                  });
                }
              }
            }
          }
        }

        // Beat length = max(speech + 0.8s, latest action end, min_duration, 3.5s)
        const speechWithPadding = speechDuration > 0 ? speechDuration + 0.8 : 0;
        const minDur = beat.min_duration ?? (speechDuration > 0 ? speechDuration + 0.8 : 4.0);
        const beatDuration = Math.max(speechWithPadding, latestActionEnd, minDur, 3.5);
        const beatEndTime = beatStartTime + beatDuration;

        let listeningStart: number | undefined;

        if (beat.choice) {
          listeningStart = beatStartTime + Math.max(speechDuration, latestActionEnd);

          let chosenId: string;
          if (choiceIndex < chosenPath.length) {
            chosenId = chosenPath[choiceIndex];
          } else {
            chosenId = beat.choice.default;
            chosenPath.push(chosenId);
          }
          choiceIndex++;

          const opt = beat.choice.options.find((o) => o.id === chosenId) || beat.choice.options[0];
          if (opt) {
            nextSceneId = opt.next_scene && !visitedSceneIds.has(opt.next_scene) ? opt.next_scene : null;
          }

          choicePoints.push({
            choiceBeatId: beat.beat_id,
            sceneId: scene.scene_id,
            listeningStartTime: listeningStart,
            options: beat.choice.options,
            defaultOptionId: beat.choice.default,
            prompt: beat.speech?.text || 'What should happen next?',
          });
        }

        const resBeat: ResolvedBeat = {
          beatId: beat.beat_id,
          sceneId: scene.scene_id,
          startTime: beatStartTime,
          endTime: beatEndTime,
          duration: beatDuration,
          speech: beat.speech,
          lineId: beat.speech ? lineId : undefined,
          words: wordsTiming,
          speechDuration: speechDuration > 0 ? speechDuration : undefined,
          estimatedSpeech: isEstimated,
          actions: resolvedActions,
          choice: beat.choice,
          listeningStartTime: listeningStart,
        };

        resolvedBeats.push(resBeat);
        allBeats.push(resBeat);
        currentTime = beatEndTime;
      }
    }

    const sceneEndTime = currentTime;
    resolvedScenes.push({
      sceneId: scene.scene_id,
      backgroundId: scene.background_id,
      mood: (scene.mood as MoodName) || 'day',
      startTime: sceneStartTime,
      endTime: sceneEndTime,
      duration: sceneEndTime - sceneStartTime,
      nextSceneId,
      beats: resolvedBeats,
      initialCharacters: scene.characters || [],
      initialProps: scene.props || [],
    });

    currentSceneId = nextSceneId;
  }

  return {
    episodeId: plan.episode_id,
    title: plan.title,
    totalDuration: currentTime,
    scenes: resolvedScenes,
    beats: allBeats,
    choicePoints,
    chosenPath,
    audioEvents,
    plan,
    audioManifest: audio,
  };
}

export function resolveFrom(
  timeline: ResolvedTimeline,
  choiceBeatId: string,
  optionId: string
): ResolvedTimeline {
  const choiceIdx = timeline.choicePoints.findIndex((cp) => cp.choiceBeatId === choiceBeatId);
  const newChosenPath = [...timeline.chosenPath];
  if (choiceIdx >= 0) {
    // Check if optionId is 'default' alias
    const actualOptionId =
      optionId === 'default'
        ? timeline.choicePoints[choiceIdx].defaultOptionId
        : optionId;
    newChosenPath[choiceIdx] = actualOptionId;
    newChosenPath.splice(choiceIdx + 1);
  } else {
    newChosenPath.push(optionId);
  }

  return resolveTimeline(timeline.plan, timeline.audioManifest, newChosenPath);
}

/**
 * Evaluates character state (position, animation, expression, facing, visibility, attached props) at time t.
 */
export function evaluateCharacterState(
  scene: ResolvedScene,
  charId: string,
  initialChar: PlacedCharacter,
  t: number
): {
  x: number;
  y: number;
  facing: 'left' | 'right';
  expression: string;
  animation: string;
  animStartTime: number;
  scale: number;
  visible: boolean;
  alpha: number;
  attachedProps: AttachedPropState[];
} {
  let x = initialChar.position[0];
  let y = initialChar.position[1];
  let facing: 'left' | 'right' = initialChar.facing || 'right';
  let expression = initialChar.expression || 'neutral';
  let animation = initialChar.animation || 'idle';
  let animStartTime = scene.startTime;
  let visible = true;
  let alpha = 1.0;
  let scaleMod = 1.0;
  const attachedProps: AttachedPropState[] = [];

  // Check scene props for initially attached props
  for (const p of scene.initialProps) {
    if (p.prop_id && p.position) {
      // scene props stay on ground unless attached
    }
  }

  for (const beat of scene.beats) {
    if (t < beat.startTime) break;

    // Check SPEAK
    if (beat.speech && beat.speech.type === 'SPEAK' && beat.speech.character_id === charId) {
      if (t >= beat.startTime && t < beat.endTime) {
        animation = 'talk';
        animStartTime = beat.startTime;
        if (beat.speech.expression) {
          expression = beat.speech.expression;
        }
      }
    }

    // Check actions
    for (const act of beat.actions) {
      const a = act.action;

      if (a.type === 'SPAWN_CHARACTER' && a.character_id === charId) {
        const spawn = a as ActionSpawnCharacter;
        if (t >= act.startTime) {
          x = spawn.position[0];
          y = spawn.position[1];
          if (spawn.facing) facing = spawn.facing;
          if (spawn.expression) expression = spawn.expression;
          if (spawn.animation) {
            animation = spawn.animation;
            animStartTime = act.startTime;
          }
          visible = true;

          const duration = act.duration || 0.5;
          const elapsed = t - act.startTime;
          if (elapsed < duration) {
            const p = Math.min(1, Math.max(0, elapsed / duration));
            if (spawn.entrance === 'fade') {
              alpha = p;
            } else if (spawn.entrance === 'slide_left') {
              x = spawn.position[0] - (1 - p) * 0.25;
            } else if (spawn.entrance === 'slide_right') {
              x = spawn.position[0] + (1 - p) * 0.25;
            } else if (spawn.entrance === 'pop') {
              scaleMod = Math.sin(p * Math.PI * 0.5) * 1.1;
            }
          } else {
            alpha = 1.0;
            scaleMod = 1.0;
          }
        } else {
          visible = false;
        }
      } else if (a.type === 'REMOVE_CHARACTER' && a.character_id === charId) {
        const remove = a as ActionRemoveCharacter;
        if (t >= act.endTime) {
          visible = false;
        } else if (t >= act.startTime) {
          const duration = act.duration || 0.5;
          const elapsed = t - act.startTime;
          const p = Math.min(1, Math.max(0, elapsed / duration));
          if (remove.exit === 'fade') {
            alpha = 1 - p;
          } else if (remove.exit === 'slide_left') {
            x -= p * 0.35;
            facing = 'left';
            animation = 'walk';
          } else if (remove.exit === 'slide_right') {
            x += p * 0.35;
            facing = 'right';
            animation = 'walk';
          } else if (remove.exit === 'fly_away') {
            y -= p * 0.7; // Soars up high into the sky!
            x += (facing === 'right' ? 1 : -1) * p * 0.25;
            alpha = Math.max(0, 1 - p * 0.85);
            animation = 'talk'; // Flapping / dynamic flight motion
          }
        }
      } else if (a.type === 'MOVE_TO' && a.character_id === charId) {
        const moveTo = a as ActionMoveTo;
        if (t >= act.startTime && t < act.endTime) {
          const rawProgress = act.duration > 0 ? (t - act.startTime) / act.duration : 1;
          const clamped = Math.min(1, Math.max(0, rawProgress));
          // Organic Cubic Ease-In-Out for natural acceleration & deceleration
          const progress = clamped < 0.5
            ? 4 * clamped * clamped * clamped
            : 1 - Math.pow(-2 * clamped + 2, 3) / 2;

          const startX = x;
          const startY = y;
          const targetX = moveTo.to[0];
          const targetY = moveTo.to[1];

          x = startX + (targetX - startX) * progress;
          y = startY + (targetY - startY) * progress;
          facing = targetX >= startX ? 'right' : 'left';
          animation = 'walk';
          animStartTime = act.startTime;
        } else if (t >= act.endTime) {
          x = moveTo.to[0];
          y = moveTo.to[1];
          if (animation === 'walk') {
            animation = 'idle';
            animStartTime = act.endTime;
          }
        }
      } else if (a.type === 'SET_EXPRESSION' && a.character_id === charId) {
        if (t >= act.startTime) {
          expression = (a as ActionSetExpression).expression;
        }
      } else if (a.type === 'PLAY_ANIMATION' && a.character_id === charId) {
        const playAnim = a as ActionPlayAnimation;
        if (t >= act.startTime) {
          if (playAnim.loop || !act.duration || t < act.endTime) {
            animation = playAnim.animation;
            animStartTime = act.startTime;
          } else if (t >= act.endTime && !playAnim.loop) {
            animation = 'idle';
            animStartTime = act.endTime;
          }
        }
      } else if (a.type === 'INTERACT') {
        const interact = a as ActionInteract;
        if (interact.character_id === charId || interact.target_id === charId) {
          if (t >= act.startTime && t < act.endTime) {
            const isActor = interact.character_id === charId;
            if (interact.kind === 'wave_at') {
              animation = isActor ? 'wave' : 'react';
              animStartTime = act.startTime;
            } else if (interact.kind === 'high_five') {
              animation = 'point';
              animStartTime = act.startTime;
            } else if (interact.kind === 'hug') {
              animation = 'react';
              animStartTime = act.startTime;
            } else if (interact.kind === 'hand_off') {
              animation = isActor ? 'point' : 'react';
              animStartTime = act.startTime;
            }
          }
        }
      } else if (a.type === 'ATTACH_PROP' && a.character_id === charId) {
        const attach = a as ActionAttachProp;
        if (t >= act.startTime) {
          const idx = attachedProps.findIndex((ap) => ap.propId === attach.prop_id);
          if (attach.remove) {
            if (idx >= 0) attachedProps.splice(idx, 1);
          } else {
            const slot = attach.slot || 'hand';
            if (idx >= 0) {
              attachedProps[idx].slot = slot;
            } else {
              attachedProps.push({
                propId: attach.prop_id,
                slot,
                characterId: charId,
              });
            }
          }
        }
      }
    }
  }

  // Depth scale: lerp(0.8, 1.15, clamp((y - 0.62) / 0.30)) * scaleMod
  const depthFactor = Math.max(0, Math.min(1, (y - 0.62) / 0.3));
  const baseScale = 0.8 + depthFactor * (1.15 - 0.8);
  const scale = baseScale * scaleMod;

  return {
    x,
    y,
    facing,
    expression,
    animation,
    animStartTime,
    scale,
    visible,
    alpha,
    attachedProps,
  };
}
