# VoxFable Engine Architecture (Maegan)

## Overview
The VoxFable engine is a deterministic, pure Canvas 2D animation player. It renders scenes at a logical resolution of 1280x720 (16:9) scaled to match the viewport.

## Core Principles
1. **Pure Function of Time**: The engine relies on `renderAt(ctx, timeline, t)` which is deterministic for any value of `t`. Seeking and re-renders are idempotent.
2. **Beat-Based Timeline**: Durations are calculated as `max(speech_duration + 0.3s, latest_action_end, min_duration, 1.0s)` using `resolveTimeline(plan, audio, chosenOptions)`.
3. **No Network / API Code in Engine**: The engine contains no Supabase code and no backend calls; it only fetches audio URLs provided in the manifest.
4. **Fallback Over Throw**: Missing character, prop, or background IDs render a visible placeholder and log a warning once per ID.

## File Layout
- `types.ts`: Internal types for resolved scenes, beats, keyframes, audio events, and camera state.
- `resolveTimeline.ts`: Pure timeline calculation, beat durations, keyframe generation, and branching (`resolveFrom`).
- `renderAt.ts`: Pure Canvas 2D rendering pipeline (background, props, characters by Y-depth, camera transform, mood tint, captions).
- `EpisodePlayer.tsx`: React player component exposing `EpisodePlayerHandle` (play, pause, seek, resolveChoice, record).
- `audio/engine.ts`: Web Audio manager (scheduling, background music ducking under speech, SFX, mute).
- `audio/lipsync.ts`: RMS calculation in 50ms windows, 95th percentile normalization, hysteresis smoothing, and fallback cycling.
- `dev/Harness.tsx`: Interactive test harness at `/dev/engine`.
- `dev/torture_fixture.json`: Torture test cases (empty scenes, circular links, long text).

## Prop Attachment Offsets
When props are attached via `ATTACH_PROP`:
- `head`: `(charX, charY - 145 * scale)`
- `hand`: `(charX + (facing === 'left' ? -35 : 35) * scale, charY - 70 * scale)`
- `ground`: `(charX + 25 * scale, charY)`

## Performance Profile (M2.4)
- **Average Frame Time**: ~1.1ms – 1.4ms per frame on local dev machine (~60 FPS steady).
- **Worst Frame Time**: < 3.5ms (during scene transitions and cross-fades).
- **Memory / Allocations**: No allocations inside `renderAt` hot path; text and canvas transforms are scoped.

## Known Limitations & Approximations
- If audio manifest is null, speech duration is estimated via `(wordCount / 2.6) + 0.3s`.
- Multi-line captions wrap to a maximum of 2 lines.
- Camera movements linearly interpolate towards target positions and zooms.
