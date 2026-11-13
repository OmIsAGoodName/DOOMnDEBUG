# Prompts for Nigel (VoxFable art, asset library, UI, pitch)

> Paste these into **your own Antigravity agent**, in order. Each prompt is self-contained. After each one, check the result in the browser, commit, and tell Om.
> You own: `frontend/src/characters/`, `backgrounds/`, `props/`, `ui/`, `studio/`, `pages/` (including `pages/auth/`), `assets/` (art metadata, audio, `LICENSES.md`), `demo/` (deck, script), `README.md`, `docs/DEMO.md`, `docs/ART_STYLE.md`, `docs/status/nigel.md`. Everything is defined in `docs/Master_Context.md` (the "Master Context"), especially sections 7 (vocabulary), 10.8 (art contract), 11 (metadata), 12 (routes).
> Om pushes the scaffold (**Push #1, about H+1:00**) with placeholder art, and the auth/lib layer (**Push #2, about H+2:00**). Until Push #1 do Part 0 only. Hours are targets, not promises.

## How to use
1. Fresh Antigravity task for each Part. Start every task with the **Standard preamble**.
2. If you need a contract change (new pose, expression, prop id, API field), do **not** edit `contracts/`. Write it under "Contract proposals" in your status file and tell Om (prompt 6.1). Metadata ids in `assets/metadata/` are yours to change, but tell Om so the validator stays in sync.
3. Commit small. Before every push: `git pull --rebase origin main`.
4. **Art is the main thing judges see.** Spend time on polish, but protect the schedule: 2 species fully polished by H+7 beats 3 half-finished ones.

### Standard preamble (paste at the top of every new task)
````text
You are the coding agent for NIGEL on VoxFable (24-hour hackathon, PS 16). Read AGENTS.md and docs/Master_Context.md first (sections 4, 7, 10.8, 11, 12). Nigel owns ONLY frontend/src/characters, backgrounds, props, ui, studio, pages (incl. pages/auth), assets/, demo/, README.md, docs/DEMO.md, docs/ART_STYLE.md and docs/status/nigel.md. Do not edit contracts/, fixtures/, backend/, lib/, auth/, config/, engine/ or live/. Follow the frozen art contract exactly: characters ALWAYS draw facing right (the engine mirrors), every draw function is deterministic for its inputs (no Math.random or Date.now; use `time` / `t`), missing data must never throw, art is original (no copyrighted characters or styles), and every audio or third-party asset gets a licence line in assets/LICENSES.md. Be concise, say honestly what is unproven, and update docs/status/nigel.md when you finish.
````

---

## Git commands (copy-paste) and the Git closing prompt

**Workflow (same for all three):** work on your own branch (`nigel/<topic>`), commit often, and every 1-2 hours and after each milestone publish to `main` with a rebase and a fast-forward push. Folders are disjoint, so conflicts should be rare. Never force-push `main`.

**One-time setup**
```bash
git clone <REPO_URL> voxfable && cd voxfable
git config user.name "Nigel"
git config user.email "<your email>"
git checkout -b nigel/art-setup
```

**Start of every work block**
```bash
git fetch origin
git checkout nigel/<topic> || git checkout -b nigel/<topic> origin/main
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

## N0.1 Environment check
````text
You are the coding agent for NIGEL. TASK: check my machine and report. Do not install anything without telling me first.
Print versions of git, node, npm, ffmpeg (needed to trim and convert audio) and tell me which browsers I have. Check I can open a local Vite dev server on 5173. Tell me which image/audio tools I have for checking assets (browser is enough).
REPORT: a table of tool, version, OK/missing, and the exact fix for anything missing.
````

## N0.2 Clone and identity rule
````text
You are the coding agent for NIGEL. TASK: help me set up the repo locally.
1. Show the commands to clone the repo (I will give the URL) and create my first branch `nigel/art-setup`.
2. Create the local, git-ignored file `.agents/rules/99-identity.md` with exactly this content (verify `.gitignore` already ignores it; if the repo is not cloned yet, hold this step):
"I am NIGEL. I own frontend/src/characters, backgrounds, props, ui, studio, pages, assets/, demo/, README.md, docs/DEMO.md, docs/ART_STYLE.md and docs/status/nigel.md. I do not edit any other folder. Source of truth: docs/Master_Context.md."
3. Show me how to verify the rule is loaded (new task, ask 'who am I working for?').
If Antigravity does not pick up the rule file, tell me; the Standard preamble above covers it.
````

## N0.3 Read-back (no code)
````text
You are the coding agent for NIGEL. TASK: read docs/Master_Context.md fully and report back WITHOUT writing any files.
Report: (1) my folders and deliverables, (2) the exact `drawCharacter` / `drawBackground` / `drawProp` signatures and the CharacterDrawState fields, (3) the logical canvas size, character height at scale 1, feet-center origin, and the depth-scale rule, (4) which poses, expressions, mouth shapes, accessories, species, backgrounds, props, sfx and music ids exist in the vocabulary, (5) what the metadata files must contain and who reads them, (6) the auth/Quick/Studio page requirements and which hooks and APIs I will call (useAuth, DataRepo, api.ts, useGeneration, Maegan's exportFlow), (7) anything ambiguous or missing that blocks me, (8) the three riskiest parts of my work and how you propose to de-risk them.
Keep it under 400 words. Do not start coding.
````

## N0.4 Art style guide (docs/ART_STYLE.md)
````text
You are the coding agent for NIGEL. TASK: write docs/ART_STYLE.md (my file) and nothing else.
Decide and document, briefly and concretely, an original, warm, child-friendly 2D cartoon look that is clearly NOT a copy of any existing franchise: palette (8-10 hex colors plus per-species defaults), outline width rules (for example 4 px on a 1280x720 canvas, rounded joins and caps), shape language (big round heads, small bodies, large eyes), proportions at scale 1 (character about 300 px tall, origin at feet center), eye/brow/mouth construction for the six expressions, the three mouth shapes (closed, half, wide), how the 8 poses differ (idle, walk, talk, wave, laugh, listen, react, point), the 6 accessories, shadow under each character, background layering rules (sky, far, mid, near, ambient motion), and the animation principle (all motion is a function of `time` and `poseT` using sine/ease functions, no randomness).
Include a small checklist "Is this polished?" (contrast, readable at small size, consistent outlines, no clipping, 16 px of padding at edges).
Keep it under 150 lines. Do not write code.
````

---

# PART 1: Art foundation and the first character (after you pull Push #1)

## N1.1 Pull and verify the scaffold
````text
[Standard preamble]
TASK: `git pull --rebase origin main`, `cd frontend && npm install && npm run dev`. Verify the routes /dev/art, /quick, /studio, /login and /signup load their placeholders; the stub drawCharacter, drawBackground, drawProp exist and typecheck; contracts/types.ts defines CharacterDrawState; assets/metadata/*.json exist with the v1 ids. Summarise the exact types I code against. Report anything inconsistent with the Master Context and write those as Requests in docs/status/nigel.md. Do not change contracts.
````

## N1.2 Drawing kit (shared primitives)
````text
[Standard preamble]
TASK: Create frontend/src/characters/kit/ with small, pure drawing helpers used by every species so the art stays consistent and fast.
Include: `outline(ctx, width, color)` helpers with round joins; `blob/roundedBody(ctx, ...)`; `ellipse`; `eye(ctx, {x,y,size,expression,blink})` with a deterministic blink from `time` (for example a short blink every 3-4 s as a pure function of time); `brows(ctx, expression)`; `mouth(ctx, shape: 'closed'|'half'|'wide', expression)`; `limb(ctx, from, angle1, angle2, len1, len2)` for simple two-segment arms/legs; `shadow(ctx, x, y, w)`; `ease` functions; `lerpColor`; `shade(color, amount)` for deriving light/dark tones from palette keys (primary, secondary, accent, outline).
Everything takes explicit inputs (no globals, no randomness). Add vitest tests for the pure math (ease, lerpColor, blink function).
ACCEPTANCE: typecheck and tests pass. REPORT the exported functions.
````

## N1.3 Species 1: owl (`pip_owl`), all poses, expressions, mouths, accessories
````text
[Standard preamble]
TASK: Implement the owl in frontend/src/characters/owl.ts and the dispatcher in frontend/src/characters/index.ts: `drawCharacter(ctx, state)` selects by `state.species` ('owl' | 'fox' | 'kid'; unknown species draws a visible placeholder and warns once).
Requirements for the owl:
- Uses state.palette (primary, secondary, accent, outline), faces RIGHT, origin at feet center, about 300 px tall at scale 1, multiplied by state.scale.
- 8 poses driven by `state.pose` and `state.poseT` and `state.time`: idle (gentle bob, blink), walk (leg cycle, body bounce; speed independent of position), talk (head bob), wave (wing raise), laugh (body shake), listen (head tilt), react (small jump), point (wing out).
- 6 expressions (neutral, happy, sad, surprised, worried, excited) via eyes/brows/beak; mouth shape from `state.mouth` (closed, half, wide) layered over the expression.
- 6 accessories drawn over the body in the right layer order (scarf, glasses, hat, bow, backpack, cape), only those listed in state.accessories.
- A soft ground shadow.
Deterministic: same state gives identical draw calls. No allocations in tight loops where avoidable.
Then build `/dev/art` (frontend/src/pages/dev/ArtGallery.tsx): a grid of canvases showing the selected species across all poses, expressions, mouth shapes, accessory toggles, palette swatches, scale slider, a "play" toggle that advances `time`, and a "facing left" preview (mirror with ctx.scale(-1,1) like the engine). 
ACCEPTANCE: the gallery looks polished at 1x and 2x zoom; no clipping; poses are readable. Commit and push, then tell Om and Maegan: "owl is ready in main".
````

## N1.4 Background 1 and metadata v1
````text
[Standard preamble]
TASK: (1) Implement `forest_day` in frontend/src/backgrounds/ with `drawBackground(ctx, id, t, w, h)` dispatching by id (unknown ids draw a placeholder and warn once). Layers: sky gradient, far hills, mid trees, near foreground grass/bushes with a clear ground band (y 0.62 to 0.92 of the height) where characters stand, plus ambient motion as pure functions of t (swaying leaves, drifting clouds, floating pollen). NO mood tint (the engine tints).
(2) Update assets/metadata/*.json (my files now): make `characters.json` and `backgrounds.json` describe exactly what is implemented (animations, expressions, default palettes, default voices, ground_band, tags, mood_hint). Do not claim capabilities that are not implemented.
(3) Add the background to /dev/art with a selector.
ACCEPTANCE: owl + forest_day look good together at 1280x720 in the gallery. Commit and push; message the team.
````

---

# PART 2: Remaining art, props and audio (H+2 to H+8)

## N2.1 Fox and kid
````text
[Standard preamble]
TASK: Implement `rusty_fox` (species 'fox': tail animation, pointed ears, expressive brows) and `mia_kid` (species 'kid': simple round head, hair color from the palette, clothing colors from secondary/accent) with the same 8 poses, 6 expressions, 3 mouth shapes and 6 accessories as the owl, reusing the kit. Keep a consistent outline, proportion and shadow style across the three species. Update /dev/art and metadata.
ACCEPTANCE: the three species look like one family and every pose x expression x mouth x accessory combination renders without clipping errors. Commit and push; message the team. If time is short, finish the fox fully and make the kid simpler, but say so in the status file.
````

## N2.2 Backgrounds 2-5
````text
[Standard preamble]
TASK: Implement `forest_night`, `meadow_day`, `treehouse_interior`, `village_street`, each with the same layering, a clear ground band, ambient motion, and a distinct palette. `forest_night`: stars twinkling and fireflies drifting (pure functions of t). `treehouse_interior`: wooden walls, a round window with parallax, hanging lights, shelves. `village_street`: simple houses and a path. Update metadata (tags, mood_hint, ground_band) and the gallery.
ACCEPTANCE: all five backgrounds look intentional with each species standing on the ground band at y 0.62, 0.77 and 0.92. Commit and push.
````

## N2.3 Props
````text
[Standard preamble]
TASK: Implement frontend/src/props/ with `drawProp(ctx, id, x, y, scale, t)` for: lantern (gentle glow), key, treasure_chest, book, apple, basket, umbrella, balloon (sways), flower, glowing_door (pulsing glow), firefly_jar (blinking light), kite (flutter). Origin at the bottom center; about 80 to 160 px at scale 1 depending on the prop; deterministic and original. Add a props section to /dev/art. Update assets/metadata/props.json with `tags` and `default_slot` (hand, head or ground).
ACCEPTANCE: all 12 props recognisable at small size. Commit and push.
````

## N2.4 Audio assets (SFX and music) with licences
````text
[Standard preamble]
TASK: Prepare the audio library under assets/audio/sfx and assets/audio/music for the ids in contracts/vocab.json (sfx_pop, sfx_whoosh, sfx_sparkle, sfx_door, sfx_giggle, sfx_footsteps, sfx_ding, sfx_wind, sfx_birds, sfx_splash; music_cheerful, music_calm, music_mystery_soft, music_adventure).
Rules: only CC0 / public-domain / clearly free-for-commercial-use sources; I download the files myself from sites you suggest (for example OpenGameArt, Freesound filtered to CC0, Pixabay) and you verify the licence wording on each source page with me before use. Give me a download shopping list with search terms for each id. Then write a script `assets/prepare_audio.sh` (or .ps1) using ffmpeg to trim, normalise loudness, convert to mono/stereo MP3 at 96 to 128 kbps, and keep each file small (SFX under about 60 KB, music loops under about 600 KB; if larger, shorten). Create assets/LICENSES.md with one row per file (id, filename, source URL, author, licence, attribution required yes/no). If a licence needs attribution, add it to the README credits list. Update sfx.json and music.json with `duration_s`, `loop`, `licence`, `source_url`.
Do not commit any file whose licence you could not confirm; list it as TODO instead.
ACCEPTANCE: at least 6 SFX and 2 music loops committed with full licence rows; the rest listed as TODO. REPORT total size.
````

## N2.5 Art polish pass (H+7 integration prep)
````text
[Standard preamble]
TASK: Polish with the checklist in docs/ART_STYLE.md. Review every species and background in /dev/art at 1x and 2x; fix clipping, thin outlines, muddy colors, jerky poses. Verify that performance is good: measure the time to draw one frame of 3 characters + background + 2 props (use performance.now in a small dev test) and report. Maegan's engine targets under 8 ms per frame average; if my art is the bottleneck, optimise (cache Path2D objects keyed by shape params, avoid gradients created every frame by caching them per canvas, reduce shadowBlur).
ACCEPTANCE: numbers reported honestly, with before/after if you optimised. Commit and push.
````

---

# PART 3: UI, auth and Quick Story (H+2 to H+10; needs Om's Push #2 for auth and api)

## N3.1 UI foundation (`ui/`)
````text
[Standard preamble]
TASK: Create the shared UI kit in frontend/src/ui/ (Tailwind): Button (primary, secondary, ghost, big-kid variant), Card, Input, Textarea, Select, Chip, Badge (pass/review/fail for safety, ok/warn for continuity), Stepper (for generation stages), Toast, Spinner, EmptyState, Layout with a top bar (logo, nav: Quick Story, Studio, Library, user menu with logout, demo-mode indicator), and a VoxFable logo as inline SVG (original, friendly, a speech bubble + a star or fox ear).
Design: warm, playful, high contrast, rounded, accessible (focus rings, keyboard, reduced-motion respect), responsive from 360 px to 1920 px; a coherent palette from docs/ART_STYLE.md. Add the Home page (`/`) with three big cards (Quick Story, Studio, Library) and a short tagline.
ACCEPTANCE: Home looks good on desktop and phone width. Commit and push.
````

## N3.2 Login, signup, route guard UI (`pages/auth/`)
````text
[Standard preamble]
TASK: After pulling Om's Push #2 (check that frontend/src/auth/ and lib/ exist), implement Login and Signup pages using ONLY `useAuth()` (signUp(email, password, displayName, accountType), signIn, signOut, enterDemoMode, loading, session). Do not write Supabase calls directly.
Signup fields: display name, email, password, account type (Parent, Creator, School) as big choice chips. Login: email, password. Both show friendly validation and error messages (never raw error strings), a loading state, and a prominent "Continue in demo mode" button (explain in one line: works offline with sample episodes). Redirect to `/` after success; signed-out users on protected routes go to `/login` (Om's guard). Add a logout in the top bar.
ACCEPTANCE: sign up, log in, refresh (still logged in), log out, and demo mode all work against Om's Supabase. Test with two accounts. Commit and push.
````

## N3.3 Quick Story page (`/quick`)
````text
[Standard preamble]
TASK: Implement frontend/src/pages/Quick.tsx.
Flow: prompt textarea with 3 example chips (for example "A shy owl learns to share her treehouse", "A fox loses his kite and finds a new friend", "A curious kid discovers a glowing door in the forest"), a toggle "Let the cartoon listen (Live Mode)" which sets `interactive: true`, an age band select, a big Generate button. On submit call `api.createGeneration({kind:'quick', prompt, interactive, age_band})`, then `useGeneration(id)` to poll. Show the stages with the Stepper using the labels from contracts/vocab.json (Understanding your story, Writing the script, Planning the scenes, Preparing characters and locations, Checking continuity and safety, Generating narration, Your episode is ready); show a percentage ONLY if `progress` is a number; friendly error state with Retry; never show JSON.
When ready, fetch the episode via `api.getEpisode`, then show: the player (Maegan's `<EpisodePlayer>` from @/engine in watch mode, captions on, with a "Tap to start" overlay), the safety badge and continuity badge, and buttons: Play again, Live Mode (uses Maegan's `<LiveController>` from @/live when the episode is interactive), Download MP4. Download flow: call Maegan's `exportEpisode({handle, episodeId, uploader})` where `uploader` calls `api.exportEpisode(blob)`, then poll `api.getExport` until done and download `mp4_url`; show the recording/converting progress honestly ("this takes about as long as the episode"). In demo mode with a `has_video` bundled episode, download the baked MP4 directly.
Handle: backend unreachable, generation failed, safety verdict needs_review (show a calm message and still allow playing), mic unsupported.
ACCEPTANCE: after Om's Push (pipeline) a prompt produces a playing episode with real art. Commit and push; tell Om and Maegan.
````

## N3.4 Library and Episode pages
````text
[Standard preamble]
TASK: Implement frontend/src/pages/Library.tsx (list from `api.listEpisodes`, in demo mode also the bundled episodes; cards with title, badges, interactive tag, date; empty state) and frontend/src/pages/Episode.tsx (`/episode/:id`: loads one episode and shows the same player and action buttons as Quick Story; extract the shared "EpisodeView" component into frontend/src/ui/ or studio/ so Quick and Episode reuse it).
ACCEPTANCE: open an episode from the library, play it, go back. Commit and push.
````

---

# PART 4: Studio Mode (H+8 to H+14)

## N4.1 Series setup and character builder (`studio/`, `pages/Studio.tsx`)
````text
[Standard preamble]
TASK: Implement the Studio setup using `DataRepo` (via the repo hook Om provides in lib/auth) for series and characters, never Supabase directly.
Series form: title, setting, world rules (add/remove short lines), tone chips, age band, language (English only for now). Character builder: name, species (owl, fox, kid), palette presets plus custom color inputs for primary/secondary/accent, accessories toggles, personality chips (shy, brave, curious, silly, kind), catchphrases (up to 3), voice select (from contracts/voices.json if Om added it, otherwise the three defaults from metadata), character rules (for example "never flies at night"), with a LIVE PREVIEW canvas that uses `drawCharacter` with a looping idle/talk and an expression picker. Up to 3 characters per series for the demo. Save, edit, delete. All parameter changes only (recolor, accessories, names): no image generation.
ACCEPTANCE: create a series with 2 customised characters, reload, it is still there (Supabase) and in demo mode (localStorage). Commit and push.
````

## N4.2 Generate a season and episode grid
````text
[Standard preamble]
TASK: Add "Generate N episodes" (N from 1 to 5, default 3) to the Studio page. On click call `api.createGeneration({kind:'batch', series, characters, count, age_band, language})` with the series and characters INLINE (per Master Context section 6), poll with `useGeneration`, and show episodes as they appear (the generation's `episode_ids` grows) in a grid of cards: title, episode number, mini thumbnail (draw a still frame by rendering the plan's first scene with the engine's renderAt if exposed, otherwise a colored card with the characters drawn via drawCharacter), Safety badge (pass/review/fail with age_fit and scary values in a tooltip), Continuity badge (violations fixed count), and Play. Show a season progress bar based on episodes completed (that is measurable). A failed episode shows a retry hint, not a crash.
ACCEPTANCE: N=3 produces 3 episodes with badges; clicking Play opens the episode player. Commit and push; tell Om.
````

---

# PART 5: Pitch, demo script, README (can start around H+8; finalise H+15 to H+19)

## N5.1 Pitch deck outline and speaker notes
````text
[Standard preamble]
TASK: Write demo/DECK_OUTLINE.md: a slide-by-slide outline for a 3-minute pitch plus 5 backup slides, each slide with title, 2 to 4 bullet points, a visual suggestion, and speaker notes. Slides: problem (kids' animation is expensive and slow); solution (VoxFable in one sentence); live demo cue; how it works (pipeline diagram: Writer, Director, Validator, Continuity, Safety, Voice, Player); why programmatic art is deliberate (character consistency, speed, cost) and where GenAI does the heavy lifting; Live Mode; Studio/Showrunner; safety and rights; business model (parent subscription, creator credits, schools, licensing, marketplace); market and competition; roadmap; team. Rules: NO invented market statistics. Every number must be marked [VERIFY: source needed] until I add a source, and list those in a "Claims to verify" table at the end. Keep wording honest (for example "no paid per-generation model/API charges in the local/free-tier setup; hosting, storage and bandwidth if deployed").
I will build the deck itself in PowerPoint/Slides/Canva from this outline. Also list the screenshots and 10-second screen recordings I should capture from the app (with the exact route and step for each).
ACCEPTANCE: outline complete, claims table present. REPORT.
````

## N5.2 Demo script (`docs/DEMO.md`)
````text
[Standard preamble]
TASK: Write docs/DEMO.md: the 3-minute demo script with exact words and clicks for each person, matching Master Context section 16 (0:00 problem; 0:25 a judge suggests a story, stages show, it plays; 1:15 the judge talks to the cartoon; 2:00 Studio batch with badges; 2:30 MP4 export and business model). Operator is Om (his laptop); Nigel narrates; Maegan handles Live Mode and is on call.
Include: the opening line; the exact sentence to ask the judge; what to do if the judge's prompt is odd or unsafe (steer to a safe variation without lecturing); what we say while the stages run (so there is no dead air: for example explain the pipeline); how to trigger Live Mode and what to say if the mic fails (use taps, joke it off); the fallback plan for each level of the safety ladder (Level B, Level C) with the exact click path to the bundled episodes; a 60-second version and a 5-minute version; timing marks; and a "never do on stage" list (do not refresh during generation, do not open dev routes, do not run the export unless time allows, do not show the terminal).
ACCEPTANCE: a timed run-through reads at about 3 minutes aloud. REPORT.
````

## N5.3 Judge Q&A (`demo/QA.md`)
````text
[Standard preamble]
TASK: Write demo/QA.md with honest, short answers (2 to 4 sentences each) to likely judge questions: Is this really GenAI if the art is programmatic? How do you keep characters consistent? How do you keep it safe for kids? What about copyright and voice licences (Edge-TTS is unofficial, flagged for commercial use)? How long does an episode take to generate (say what we measured, not promises)? What happens when the internet or the API fails (the safety ladder)? What is the business model? Who are the competitors and how are we different? What would you build next? How does it scale cost-wise? Why 2D and not 3D? What did you build in 24 hours and what is mocked or unproven? Answers must match docs/Master_Context.md section 17 (known weaknesses) and never claim anything we have not built.
ACCEPTANCE: 12 or more Q&As, each honest. REPORT.
````

## N5.4 README
````text
[Standard preamble]
TASK: Rewrite README.md: what VoxFable is (3 lines), screenshots placeholders, features (Quick Story, Live Mode, Studio), architecture diagram in Mermaid, tech stack, how to run (backend and frontend; copy exact commands from Om's docs/ARCHITECTURE.md and docs/SUPABASE.md, do not guess), environment variables (names only, no values), demo mode, the demo safety ladder, project structure, team and roles, credits and licences (link to assets/LICENSES.md and list required attributions), known limitations (honest), and what we would do next. No secrets, no invented statistics.
ACCEPTANCE: a stranger can run the project from the README. REPORT any commands you could not verify.
````

---

# PART 6: Everyday prompts

## N6.1 Contract proposal (template)
````text
[Standard preamble]
TASK: I need a contract change: <describe>. Write it under "Contract proposals" in docs/status/nigel.md with: what and why, the exact fields/ids proposed, which files would change (contracts/, metadata, my code), the impact on Om's validator and Maegan's engine, and a safe temporary workaround I can use inside my own folders until Om decides. Do not edit contracts/.
````

## N6.2 Fix a UI/art bug (template)
````text
[Standard preamble]
TASK: Bug: <describe>. Reproduce it first (route, steps, or a /dev/art configuration), find the root cause, make the smallest fix inside my folders, run `npm run typecheck` and `npm test`, and explain in two lines what was wrong. If the root cause is in someone else's area (engine timing, plan data, API), write a precise Request for them with a reproducer and add a safe workaround in my area.
````

## N6.3 Status update
````text
[Standard preamble]
TASK: Update docs/status/nigel.md (Done / In progress / Next / Blockers / Requests / Contract proposals). Be honest about anything unproven or unfinished (for example the kid species being simpler). Commit, `git pull --rebase origin main`, push, and give me a 5-line summary for the team chat.
````

## N6.4 Pull and fresh start
````text
[Standard preamble]
TASK: `git pull --rebase origin main`; resolve conflicts keeping other owners' folders untouched; run npm install if package.json changed, then npm run typecheck and npm test. Report what changed (commits by author) and whether anything broke my area.
````

## N6.5 Accessibility and responsive pass (H+12)
````text
[Standard preamble]
TASK: Review every page I own for: keyboard navigation, visible focus, contrast (WCAG AA for text), tap targets of at least 44 px (64 px for kid-facing buttons), alt text/aria labels, reduced-motion support, and layouts at 360, 768, 1280 and 1920 px widths (the demo may be on a projector). Fix issues inside my folders and list anything that belongs to Maegan's live/ or the engine as a Request.
````

## N6.6 Feature-freeze review (H+15)
````text
[Standard preamble]
TASK: Feature freeze. List every TODO/FIXME in my folders, every visual glitch across the three demo episodes (clipping, popping, wrong layering), every page that shows a raw error or JSON, every missing licence row, every unverified claim in the deck outline. Rank by demo risk, fix only HIGH-risk items, and finalise docs/DEMO.md, demo/DECK_OUTLINE.md and README.md.
````
