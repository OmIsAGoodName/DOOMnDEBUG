# Prompts for Maegan (VoxFable engine: renderer, timeline, audio, lip-sync, Live Mode, recording)

> Paste these into **your own Antigravity agent**, in order. Each prompt is self-contained. After each one, run the check it asks for, commit, and tell Om.
> You own: `frontend/src/engine/`, `frontend/src/live/`, `docs/status/maegan.md`. Everything is defined in `docs/Master_Context.md` (the "Master Context"), especially sections 8 (plan), 10 (engine spec) and 7 (vocabulary).
> Om pushes the scaffold (**Push #1, about H+1:00**) with placeholder art and fixtures. Until then do Part 0 only. Hours are targets, not promises.

## How to use
1. Fresh Antigravity task for each Part. Start every task with the **Standard preamble**.
2. If you need a contract change (new field, new command), do **not** edit `contracts/`. Write it under "Contract proposals" in your status file and tell Om (prompt M5.7).
3. Commit small. Before every push: `git pull --rebase origin main`.

### Standard preamble (paste at the top of every new task)
````text
You are the coding agent for MAEGAN on VoxFable (24-hour hackathon, PS 16). Read AGENTS.md and docs/Master_Context.md first (sections 4, 7, 8, 10). Maegan owns ONLY frontend/src/engine/, frontend/src/live/ and docs/status/maegan.md. Do not edit contracts/, fixtures/, backend/, lib/, auth/, characters/, backgrounds/, props/, pages/, studio/ or ui/. Follow the frozen contracts exactly; never invent fields. The engine has no Supabase code and no backend API calls (it may fetch the audio URLs it is handed); the live/ module may use frontend/src/lib/api.ts. The renderer is a pure function of time (renderAt(t)). Missing or unknown ids must draw a placeholder and warn, never throw. Be concise, say honestly what is unproven, and update docs/status/maegan.md when you finish.
````

---

## Git commands (copy-paste) and the Git closing prompt

**Workflow (same for all three):** work on your own branch (`maegan/<topic>`), commit often, and every 1-2 hours and after each milestone publish to `main` with a rebase and a fast-forward push. Folders are disjoint, so conflicts should be rare. Never force-push `main`.

**One-time setup**
```bash
git clone <REPO_URL> voxfable && cd voxfable
git config user.name "Maegan"
git config user.email "<your email>"
git checkout -b maegan/engine-setup
```

**Start of every work block**
```bash
git fetch origin
git checkout maegan/<topic> || git checkout -b maegan/<topic> origin/main
git rebase origin/main
# if package.json changed:  cd frontend && npm install
```

**Save work (often)**
```bash
git status
git add -A
git commit -m "feat(<area>): <what changed>"
```

**Publish to `main` (every 1-2 hours and after each milestone)**
```bash
git fetch origin
git rebase origin/main          # resolve conflicts if any, then: git add <files> && git rebase --continue
cd frontend && npm run typecheck && npm test && cd ..
git push origin HEAD:main       # fast-forward main
git push --force-with-lease -u origin HEAD   # backs up YOUR branch only (it is rebased, so a plain push can be rejected); never force-push main
```
If the push is rejected: `git fetch origin && git rebase origin/main && git push origin HEAD:main`.

**Conflicts**
- During a rebase, `--ours` means **main's** version. For a file you do not own, keep main's: `git checkout --ours <file> && git add <file>`.
- Lockfile conflict: `git checkout --ours frontend/package-lock.json && cd frontend && npm install && cd .. && git add frontend/package-lock.json && git rebase --continue`.
- Stuck? `git rebase --abort`, then ask Om. Do not use `git reset --hard` on work you have not pushed.

**Never:** commit `.env` or keys, force-push `main`, edit other owners' folders, commit `node_modules/`, `media/` or large binaries.

### G1: Git closing prompt (paste at the END of every task, after the work is done)
````text
[Standard preamble]
TASK: Git closing step. Do these in order and stop to ask me if anything looks wrong.
1. Run `git status`. Show me what will be committed. Confirm there are NO .env files, keys, node_modules, media/, or files over about 2 MB, and that every changed file is inside MY folders (if not, tell me which files and unstage them).
2. Commit with a clear conventional message (for example `feat(<area>): <summary>`).
3. `git fetch origin` then `git rebase origin/main`. If there are conflicts, keep main's version of any file I do not own, resolve mine carefully, and continue.
4. Run the checks for my area (cd frontend && npm run typecheck && npm test && cd ..). If they fail, fix or tell me; do not push a broken main.
5. `git push origin HEAD:main`, then `git push --force-with-lease -u origin HEAD` (my own branch only, since it was rebased). Never force-push main.
6. Print the commit hash, a one-line summary, and a 3-line message I can send the team ("pushed <what>, pull now, anything they must do").
````

---

# PART 0: Setup (before Om's Push #1 lands)

## M0.1 Environment check
````text
You are the coding agent for MAEGAN. TASK: check my machine and report. Do not install anything without telling me first.
Print versions of git, node, npm, python (optional), and tell me which browser versions I have (Chrome and Edge). Check that `MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')` and `webkitSpeechRecognition` would be available (explain how I can check in the browser console if you cannot). Check ffmpeg on PATH (optional for me).
REPORT: a table of tool, version, OK/missing, and the exact fix for anything missing.
````

## M0.2 Clone and identity rule
````text
You are the coding agent for MAEGAN. TASK: help me set up the repo locally.
1. Show the commands to clone the repo (I will give the URL) and create my first branch `maegan/engine-setup`.
2. Create the local, git-ignored file `.agents/rules/99-identity.md` with exactly this content (verify `.gitignore` already ignores it; if the repo is not cloned yet, hold this step):
"I am MAEGAN. I own frontend/src/engine/ and frontend/src/live/ and docs/status/maegan.md. I do not edit any other folder. Source of truth: docs/Master_Context.md."
3. Show me how to verify the rule is loaded (new task, ask 'who am I working for?').
If Antigravity does not pick up the rule file, tell me; the Standard preamble above covers it.
````

## M0.3 Read-back (no code)
````text
You are the coding agent for MAEGAN. TASK: read docs/Master_Context.md fully and report back WITHOUT writing any files.
Report: (1) my folders and what I must deliver, (2) the EpisodePlayer props and handle exactly as frozen, (3) the beat-length rule and what happens at a choice, (4) what the art contract expects from Nigel and what I must do for `facing: left`, (5) the audio manifest shape and how I find the line for a beat, (6) the recording approach and why the uploader is injected, (7) anything ambiguous, contradictory or missing that blocks me, (8) the three riskiest parts of my work and how you propose to de-risk them.
Keep it under 400 words. Do not start coding.
````

## M0.4 Engine design doc (local only, committed after the scaffold)
````text
You are the coding agent for MAEGAN. TASK: write my engine design note as `frontend/src/engine/README.md` (my folder; create it locally and commit it after Om's scaffold lands).
Cover, briefly and concretely: file layout (suggested: types.ts, resolveTimeline.ts, renderAt.ts, camera.ts, stateMachine.ts, audio/engine.ts, audio/lipsync.ts, EpisodePlayer.tsx, recorder.ts, exportFlow.ts, dev/Harness.tsx); data flow plan+audio -> ResolvedTimeline -> renderAt; the exact beat-length algorithm; how actions (delay/duration) become keyframes per character; how MOVE_TO, INTERACT and SET_CAMERA interpolate; how branching re-resolves the timeline; the master clock design (own clock advanced by requestAnimationFrame deltas, audio scheduled on AudioContext with offset on seek/resume); the test plan with vitest (what is unit-tested, what is checked visually in /dev/engine); and a day-one order of work.
Keep it under 150 lines. No implementation yet.
````

---

# PART 1: Engine core (after you pull Push #1)

## M1.1 Pull and verify the scaffold
````text
[Standard preamble]
TASK: `git pull --rebase origin main`, `cd frontend && npm install && npm run dev`. Verify: routes /dev/engine and /dev/live load, `@contracts/types`, `@fixtures/episode_quick_demo.json` and `@fixtures/episode_live_demo.json` import and typecheck, the stub `drawCharacter`, `drawBackground`, `drawProp` exist, vitest runs. Read contracts/types.ts and contracts/vocab.json and summarise the exact types I will code against. Report anything missing or inconsistent with the Master Context, and write those as Requests in docs/status/maegan.md. Do not change contracts.
````

## M1.2 Timeline resolver (pure TypeScript, unit-tested)
````text
[Standard preamble]
TASK: Implement frontend/src/engine/resolveTimeline.ts (pure functions, no DOM) with vitest tests.
Input: EpisodePlan, AudioManifest | null, a list of chosen option ids. Output: ResolvedTimeline: ordered scenes with absolute start/end; beats with absolute start/end and `lineId`; every action with absolute start/end; for characters, keyframe tracks for position, facing, expression, animation (with `poseT` start), visibility (spawn/remove with entrance/exit); camera keyframes; mood keyframes; music/sfx events; choice points with the time at which LISTENING begins.
Rules: beat length = max(speech audio duration + 0.3 s, latest action end, min_duration, 1.0 s); if no audio line, estimate words / 2.6 + 0.3 s and mark `estimated: true`. Scenes follow next_scene; the path follows chosen option ids, falling back to choice.default (or `choicePath` for watch mode). Implement `resolveFrom(timeline, choiceBeatId, optionId)` that re-resolves only the remaining part after a choice, keeping earlier times unchanged. MOVE_TO speaks the character's `walk` animation and facing automatically and returns to idle at the end; speech SPEAK sets `talking` for the line duration and the expression if given; SPAWN is implicit for scene.characters at scene start.
Tests: durations from audio vs estimate; overlapping actions with delays; choice branch A vs B produces different total durations; re-resolve keeps the past; reachable-only scenes; fixtures resolve without errors; no NaN; deterministic (same input, same output).
ACCEPTANCE: `npm test` passes, fixtures resolve, a printed summary for both fixtures (scene list with start/end times). REPORT.
````

## M1.3 renderAt (the pure renderer)
````text
[Standard preamble]
TASK: Implement frontend/src/engine/renderAt.ts: `renderAt(ctx, timeline, t, opts)` on a 1280x720 logical canvas.
Order: background (drawBackground from @/backgrounds) -> props (drawProp) -> characters sorted by y (drawCharacter from @/characters) -> mood tint overlay (color/opacity from contracts/vocab.json, interpolated over `transition`) -> captions (placeholder now) -> scene cross-fade (0.5 s). Camera is a zoom (wide 1.0, medium 1.35, close 1.8) and pan transform applied to the world layer, with push-in/pull-out/pan movements as time-based interpolation.
Character state: interpolate position along MOVE_TO tracks; depth scale scale = lerp(0.8, 1.15, clamp((y - 0.62) / 0.30)); art draws facing right so mirror with ctx.scale(-1, 1) around the character x for facing left; compute `poseT` from the animation start time; pass expression, accessories, palette and species from plan.cast; `mouth` comes from lip-sync (closed until M1.6 exists).
Robustness: unknown character/background/prop ids draw a placeholder box with the id and console.warn once per id; never throw. No Date.now/Math.random inside render (use t only; if randomness is needed use a seeded function of t).
Devicepixelratio handled by the Player component, not here.
ACCEPTANCE: a vitest that renders frames to an offscreen canvas (use a canvas mock or node-canvas only if already installed; otherwise a call-recording fake context) at several t values without throwing, and calling renderAt twice with the same t makes the identical sequence of draw calls. Visual check comes in M1.5.
````

## M1.4 Master clock and `<EpisodePlayer>`
````text
[Standard preamble]
TASK: Implement frontend/src/engine/EpisodePlayer.tsx as a React component with forwardRef implementing EpisodePlayerHandle exactly as in contracts/types.ts.
- Canvas sized by CSS (16:9, max width of container) with devicePixelRatio scaling of a 1280x720 logical space.
- Master clock: own `t` advanced by requestAnimationFrame deltas (clamped to avoid big jumps after tab sleep); play/pause/seek(t) (seek re-evaluates state purely from the timeline; audio is rescheduled); `getTime`, `getDuration`.
- Choice handling: when t reaches a choice point's LISTENING time, pause the clock, enter `listening` state, call onChoice({beatId, sceneId, prompt, options}). `resolveChoice(optionId)` calls resolveFrom, resumes, plays `react` for ~0.8 s, records the path in `getChosenPath()`. In `watch` mode auto-resolve with `choicePath` or the default after the speech ends.
- onEnd when the last scene ends; onError for fatal problems; a visible "Tap to start" overlay that creates/resumes the AudioContext on user gesture.
- No fetch other than the audio URLs (next prompt).
ACCEPTANCE: in /dev/engine (M1.7 will polish it) both fixtures play silently (estimated durations) with stub art: characters move, expressions change in the debug overlay, camera changes, the live fixture stops at the first choice and continues after resolveChoice. REPORT.
````

## M1.5 Audio engine
````text
[Standard preamble]
TASK: Implement frontend/src/engine/audio/engine.ts.
- One AudioContext. Decode every speech line, sfx and music url from the manifest with fetch + decodeAudioData (parallel, with a concurrency cap of 4, and a clear loading state: `ready` Promise and progress). Failures degrade: log, skip that sound, keep playing.
- Schedule from the ResolvedTimeline: speech starts at its beat start; sfx at action times; music loops with fade in/out and ducking (-12 dB under speech with a 150 ms ramp). On pause suspend, on seek stop all sources and reschedule from t, on resume continue. Volumes from the plan; a master `muted` flag.
- Provide a master gain node and an optional MediaStreamAudioDestinationNode used by the recorder (M4.1).
- If `audio` is null the engine runs silent using estimated durations.
- Vitest with a fake AudioContext for scheduling math (start offsets after seek).
ACCEPTANCE: with Om's real fixture audio (after his TTS push, fixture manifests point at /demo/fixtures/...) the narration is heard in sync with captions-placeholder timing and music ducks under speech. REPORT any drift you measure over a 45 s episode.
````

## M1.6 Lip-sync from audio
````text
[Standard preamble]
TASK: Implement frontend/src/engine/audio/lipsync.ts exactly as Master Context 10.6.
- From each decoded speech AudioBuffer compute RMS in 50 ms windows, normalize by the 95th percentile of that line, classify with thresholds closed < 0.15 <= half < 0.45 <= wide, smooth with a minimum hold of 80 ms (hysteresis), and cache a MouthTrack per line_id.
- `mouthAt(lineId, tInLine)` returns 'closed' | 'half' | 'wide'. Wire it into renderAt for the speaking character only (others closed). No audio: cycle closed/half/wide by a deterministic function of t and text length while the character is talking.
- Vitest on synthetic buffers (silence, loud tone, ramp).
ACCEPTANCE: in /dev/engine the speaking character's mouth state is shown in the debug overlay and visibly follows the audio once Nigel's art uses `mouth`. REPORT.
````

## M1.7 Dev harness `/dev/engine`
````text
[Standard preamble]
TASK: Implement frontend/src/engine/dev/Harness.tsx.
Controls: fixture picker (both fixtures plus any JSON the user pastes), manifest toggle (with/without audio), play/pause, seek slider with scene/beat markers, speed 0.5x/1x/2x (for debugging only), mute, captions toggle, debug overlay (t, scene, beat, state per character, mouth state, fps, frame time ms, choice status), choice buttons when listening, `Record` / `Stop` / `Download WebM` buttons (wired after M4.1), and a "log resolved timeline" button.
ACCEPTANCE: I can scrub through a fixture and the frame always matches t (scrub back and forth, same frame twice). REPORT frame time on this laptop (measurement).
````

---

# PART 2: Features and polish

## M2.1 Camera, mood, scene transitions, entrances, INTERACT, props
````text
[Standard preamble]
TASK: Complete the remaining commands in the engine.
- SET_CAMERA with focus_character_id (pan to that character), push-in/pull-out/pan movements; SET_MOOD with smooth tint transitions; scene cross-fade; SPAWN/REMOVE entrance and exit effects (fade, slide, pop); ATTACH_PROP (hand/head/ground slots attached to the character's pose anchor; if the art does not expose anchors use fixed offsets relative to the character and document them in README); INTERACT kinds wave_at, high_five, hand_off, hug as coordinated sequences (move characters close, face each other, play the matching animation, then restore); PLAY_ANIMATION with loop; WAIT.
- Document every approximation in frontend/src/engine/README.md "Known limitations".
ACCEPTANCE: fixtures show every command working; no console errors. REPORT.
````

## M2.2 Captions
````text
[Standard preamble]
TASK: Implement captions drawn ON THE CANVAS (so recorded video includes them), controlled by the `captions` prop.
Rules: child-friendly large font with a rounded translucent background, max 2 lines, wrapped to width, speaker name chip for SPEAK lines, narration in a different style; show the text of the current beat's speech from its start to end; if `words` timings exist highlight the current word (karaoke style), otherwise show the whole line. Deterministic: depends only on t. Use a web-safe font stack; do not load remote fonts.
ACCEPTANCE: captions readable at 1280x720 and when scaled to a laptop screen; long lines wrap correctly. REPORT.
````

## M2.3 Robustness pass
````text
[Standard preamble]
TASK: Harden the engine.
- Add a lenient runtime guard at the start of EpisodePlayer that checks the plan has the minimum needed (scenes, start_scene, beats) and reports a friendly onError otherwise; unknown commands are skipped with a warning.
- Handle: audio decode failure, missing audio for a line, very long lines, zero-length beats, a scene with no characters, choice with one option, a branch cycle (limit total scenes visited to 20), window resize, tab hidden/visible (pause and resume), unmount cleanup (cancel RAF, close/suspend audio, stop recorder), React StrictMode double-mount.
- Add vitest cases for these and a "torture" fixture in frontend/src/engine/dev/ (my folder, not fixtures/) with deliberately odd plans.
ACCEPTANCE: torture plans play or fail gracefully, never crash the page. REPORT.
````

## M2.4 Performance check
````text
[Standard preamble]
TASK: Profile and fix performance.
Measure average and worst frame time in /dev/engine for both fixtures on this laptop with the stub art, then again when Nigel's real art lands. Targets (unverified goals): average under 8 ms, worst under 20 ms, no per-frame allocations in hot paths (reuse objects), cache measured text widths and Path2D objects where possible, avoid ctx.save/restore explosions, avoid recomputing the timeline each frame. Add a perf overlay and a note to README with the real numbers. If the real art is slow, write a precise Request for Nigel in docs/status/maegan.md (which function, what cost).
ACCEPTANCE: numbers reported honestly. REPORT.
````

---

# PART 3: Live Mode (target H+7 to H+12)

## M3.1 Listening state in the engine
````text
[Standard preamble]
TASK: Finish the Live Mode behaviour inside the engine.
- At a choice: the speaking character finishes the question, then enters `listening` (the `listen` pose), a soft thinking indicator (animated dots near the character) shows, the clock is paused, and the `onChoice` callback fires. An engine-level timeout is NOT used; timeouts belong to live/ (M3.2).
- `resolveChoice(id)` accepts only valid ids (ignore others with a warning), resumes, plays `react`, then continues along the branch. Also support `resolveChoice('default')` as an alias for the default option.
- `getChosenPath()` returns the option ids in order so a UI can offer "your episode".
- Tests: both branches of the live fixture, repeated resolveChoice calls ignored, seek back before a choice then forward again.
ACCEPTANCE: both branches of the live fixture play to the end. REPORT.
````

## M3.2 `live/` module: LiveController, mic, keywords, tap fallback
````text
[Standard preamble]
TASK: Implement frontend/src/live/ (this module MAY use frontend/src/lib/api.ts).
- `LiveController` component wrapping EpisodePlayer in mode="live": shows tap buttons for the current choice ALWAYS (big, colorful, labeled with option labels; keyboard accessible) and a microphone button.
- Speech input: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`), language from the plan, interimResults on, short timeout, graceful handling of unsupported browsers, permission denied, no-speech, and network errors (then only taps are shown, with a friendly message). Never start the mic outside a choice point. Stop it after an answer. Show a mic-active indicator and "I heard: ..." with the transcript.
- Matching: client keyword match first (normalize, lowercase, strip punctuation, simple plural stemming, match against option.keywords and label words); if a single option wins, resolve immediately. If not clear, show a "thinking" animation and call `api.liveMatch` with a 2.5 s timeout; use the answer if confidence is decent; otherwise ask once more ("Say it again or tap one!") with the character repeating the question via a subtitle line; after about 12 s total or a second failure use the default option and show a caption "Let's go with <label>!".
- A small `useLiveChoices` hook and pure `matchChoice(transcript, options)` function with vitest cases (kid-like phrases: "the door!", "umm the firefly one", "open it").
- `/dev/live` harness (live/dev/LiveHarness.tsx) that runs the live fixture with a transcript text box to simulate speech, mock API mode, and real mic mode.
- After the episode ends offer `onEnd` with the chosen path; expose `exportChosenPath`.
ACCEPTANCE: tapping works with no mic; speaking works on Chrome/Edge; denying the mic does not break the flow. REPORT how well speech recognition worked in a quiet room and a noisy room (honest observations).
````

## M3.3 Kid-friendly Live UI polish
````text
[Standard preamble]
TASK: Polish the Live Mode UI inside live/ only (Nigel owns ui/ and pages/, so build self-contained components with Tailwind classes and no dependency on ui/).
- Large tap targets (at least 64 px), high contrast, option buttons with icons or emoji, a pulsing mic ring, a progress dot trail of choices made, short friendly microcopy, reduced motion support, focus states. Show the heard phrase in a speech-bubble style. Make sure nothing overlaps the canvas captions.
- Responsive from 360 px wide phones to 1920 px projector.
ACCEPTANCE: screenshots (or a description) of idle, listening, heard, thinking, default-chosen states. REPORT.
````

---

# PART 4: Recording and export client (target H+10 to H+14)

## M4.1 Recorder
````text
[Standard preamble]
TASK: Implement frontend/src/engine/recorder.ts and wire `startRecording` / `stopRecording` on the player handle.
- Capture the canvas with `canvas.captureStream(30)` and mix in the audio engine's MediaStreamAudioDestinationNode; choose the first supported mime in [video/webm;codecs=vp9,opus, video/webm;codecs=vp8,opus, video/webm]; `videoBitsPerSecond` about 4 Mbps; collect chunks with a 1 s timeslice; `stopRecording()` resolves with the Blob.
- `startRecording({muteLocal})`: when muteLocal is true the speakers are silent but the recording still has sound. Recording starts at t=0 (restart the episode) and stops automatically at onEnd unless stopped earlier.
- Caveats to document: runs in real time (episode length), the tab must stay visible and focused, and long recordings are memory-bound; show a warning in the harness.
- Add a Record/Stop/Download WebM flow to /dev/engine. Test: record both fixtures, open the WebM in a browser, check that audio and captions are included and the duration is right.
ACCEPTANCE: a recorded WebM of the quick fixture plays with sound. REPORT file size and recording time.
````

## M4.2 exportFlow with injected uploader
````text
[Standard preamble]
TASK: Implement frontend/src/engine/exportFlow.ts.
`exportEpisode({ handle, episodeId, uploader, onProgress })`: start recording, wait for the episode to end, stop, then call `uploader(blob, episodeId)` (a function supplied by the caller that returns `{ exportId }`, implemented by Nigel's page with `api.exportEpisode`), then resolve with the result; polling of `GET /api/exports/{id}` is done by the CALLER via `api.getExport` (Om's client). Report stages through onProgress: 'recording' (with elapsed/total time), 'uploading', 'converting' (caller-driven), 'done', 'error'. Support cancel.
Document the usage with a short example in frontend/src/engine/README.md so Nigel can wire the Download button. Message Om and Nigel when it is ready: "exportFlow is ready, here is the usage".
ACCEPTANCE: with Om's export endpoint, a recorded WebM becomes a playable MP4 (test with /dev/engine plus curl if the UI is not wired yet). REPORT conversion time vs video length.
````

---

# PART 5: Integration, polish and everyday prompts

## M5.1 Integration 1 checklist (H+7) and Integration 2 (H+14)
````text
[Standard preamble]
TASK: Integration check for the engine against the REAL backend and REAL art. Pull main, start backend and frontend as Om documented, generate three different prompts from /quick (Nigel's page), and for each episode report: loads without errors, durations vs audio, lip-sync and captions in sync, camera/mood sensible, characters stay inside the canvas, no console errors, frame time, Live Mode choice works by tap and by voice (interactive prompt), recording and MP4 export work. List every bug with the owner (Om = plan/audio data, Nigel = art/UI, Maegan = engine) and a minimal reproducer (episode id or JSON). Fix mine immediately; write Requests for others in docs/status/maegan.md.
````

## M5.2 Fix a bug (template)
````text
[Standard preamble]
TASK: Bug: <describe>. Reproduce first (write a failing vitest if possible or a plan JSON that triggers it), find the root cause, make the smallest fix inside my folders, add or update a test, run `npm test` and `npm run typecheck`, and explain in two lines what was wrong. If the root cause is in someone else's folder or data, write a precise Request for them and a safe workaround in the engine.
````

## M5.3 Status update
````text
[Standard preamble]
TASK: Update docs/status/maegan.md (Done / In progress / Next / Blockers / Requests / Contract proposals). Be honest about anything unproven. Commit, `git pull --rebase origin main`, push, and give me a 5-line summary for the team chat.
````

## M5.4 Pull and fresh start
````text
[Standard preamble]
TASK: `git pull --rebase origin main`; resolve conflicts keeping other owners' folders untouched; run npm install if package.json changed, then npm test and npm run typecheck. Report what changed (commits by author) and whether anything broke my area.
````

## M5.5 Optional spillover: FFmpeg export endpoint (ONLY if Om asks)
````text
[Standard preamble]
TASK: Om has handed me the export endpoint. I may edit backend/app/export/ and add the routes only as he specified in docs/status/om.md. Implement POST /api/episodes/{id}/export and GET /api/exports/{export_id} per Master Context section 9: multipart WebM upload, FFmpeg to MP4 (-c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart), re-encode instead of stream copy so the duration is correct, background task, status polling, size and mime limits, temp file cleanup, a smoke test. Do not touch other backend files.
````

## M5.6 Feature-freeze review (H+15)
````text
[Standard preamble]
TASK: Feature freeze. List every TODO/FIXME in engine/ and live/, every failing test, every console warning that appears during the three demo episodes, every browser-specific risk (Chrome vs Edge, autoplay policy, mic permission), and the worst frame time. Rank by demo risk, fix only HIGH-risk items, and write a short "Engine demo notes" section in README.md (what to click, what not to do on stage).
````

## M5.7 Contract proposal (template)
````text
[Standard preamble]
TASK: I need a contract change: <describe>. Write it under "Contract proposals" in docs/status/maegan.md with: what and why, the exact fields/ids proposed, which files would change (contracts/, my code), the impact on Om's validator/backend and Nigel's art or UI, and a safe temporary workaround I can use inside my own folders until Om decides. Do not edit contracts/.
````
