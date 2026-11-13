# Prompts for Om (VoxFable lead / main dev)

> Paste these into **your own Antigravity agent**, in order. Each prompt is self-contained. After each one, read the agent's report, run the check it asks for, and commit.
> Om owns: `contracts/`, `fixtures/`, `backend/`, `supabase/`, `scripts/`, root config, `frontend/src/lib|auth|config`, `frontend/public/demo/`, `docs/` (except Nigel's files). Everything is defined in `docs/Master_Context.md` (the "Master Context"). Put a copy of `Master_Context.md` in the repo before running Part 0.2.
> Targets are not promises. **Push #1 (by about H+1:00) unblocks Maegan and Nigel, so do Part 0 first and fast.**

## How to use
1. Fresh Antigravity task for each Part. Start every task with the **Standard preamble** below.
2. If something in the Master Context is wrong or missing, fix it with a **Context update** (section 14.4) and tell the others.
3. After each push, post in the team chat: "pushed <thing>, pull now".

### Standard preamble (paste at the top of every new task)
````text
You are the coding agent for OM, the lead of VoxFable (24-hour hackathon, PS 16). Read AGENTS.md and docs/Master_Context.md first. Om owns: contracts/, fixtures/, backend/, supabase/, scripts/, root config, frontend/src/lib, frontend/src/auth, frontend/src/config, frontend/public/demo, and docs/ (except DEMO.md and ART_STYLE.md). Do not edit frontend/src/engine, live, characters, backgrounds, props, ui, studio or pages after the first scaffold push. Never commit secrets. Keep main runnable. Be concise, tell me honestly what is broken or unproven, and update docs/status/om.md when you finish.
````

---

## Git commands (copy-paste) and the Git closing prompt

**Workflow (same for all three):** work on your own branch (`om/<topic>`), commit often, and every 1-2 hours and after each milestone publish to `main` with a rebase and a fast-forward push. Folders are disjoint, so conflicts should be rare. Never force-push `main`.

**One-time setup**
```bash
git config user.name "Om"
git config user.email "<your email>"
# first time only (after prompt 0.2 made the first local commit):
git branch -M main
git remote add origin <REPO_URL>
git push -u origin main
# after Push #1 you may work on branches: git checkout -b om/backend-llm
```

**Start of every work block**
```bash
git fetch origin
git checkout om/<topic> || git checkout -b om/<topic> origin/main
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
cd backend && pytest && cd ..
python scripts/validate_fixtures.py
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
4. Run the checks for my area (cd frontend && npm run typecheck && npm test && cd .. / cd backend && pytest && cd .. / python scripts/validate_fixtures.py). If they fail, fix or tell me; do not push a broken main.
5. `git push origin HEAD:main`, then `git push --force-with-lease -u origin HEAD` (my own branch only, since it was rebased). Never force-push main.
6. Print the commit hash, a one-line summary, and a 3-line message I can send the team ("pushed <what>, pull now, anything they must do").
````

---

# PART 0: Setup (do this first)

## Manual checklist before the prompts (you, not the agent)
- [ ] Install: Git, Node 20+, Python 3.11+, **FFmpeg** (on PATH), GitHub CLI (optional). Optional: Ollama.
- [ ] Create the **GitHub repo** `voxfable` (private), add Maegan and Nigel as collaborators.
- [ ] Create the **Supabase project now** (free projects can pause). Keep open: Project URL, publishable key, secret key. Turn **email confirmation off** (Authentication, Sign In / Providers, Email; menu names shift).
- [ ] Get a **Gemini API key** (Google AI Studio) and, optionally, a **Groq** key.
- [ ] Copy `Master_Context.md` and the three `Prompts_*.md` files somewhere you can drag into the repo.

## 0.1 Environment check
````text
[Standard preamble]
TASK: Check my machine and report. Do not install anything without telling me first.
1. Print versions of git, node, npm, python, pip, ffmpeg (and ffprobe), and ollama if present.
2. Check ffmpeg has the libx264 encoder and aac (`ffmpeg -encoders`).
3. Check Python can `pip install` (use a venv at backend/.venv later).
4. Check which ports 5173 (Vite) and 8000 (FastAPI) are free.
5. Test outbound internet: can Python import and call `edge-tts --list-voices` after `pip install edge-tts` in a temp venv? Report the first 10 English voices, and tell me which of these exist: en-US-AnaNeural, en-US-JennyNeural, en-US-GuyNeural, en-GB-RyanNeural, en-GB-SoniaNeural.
REPORT: a table of tool, version, OK/missing, and the exact fix command for anything missing.
````

## 0.2 Repo skeleton, docs, .gitignore
````text
[Standard preamble]
TASK: Create the repo skeleton exactly as in Master Context section 13 inside the current empty git repo.
Do:
- Create folders (with .gitkeep where empty): docs/status, docs/prompts, contracts, fixtures, supabase/migrations, scripts, backend, frontend, assets/metadata, assets/audio/music, assets/audio/sfx, demo, media (git-ignored).
- Put the provided Master_Context.md in docs/. Create docs/status/{om,maegan,nigel}.md each with sections: Done / In progress / Next / Blockers / Requests / Contract proposals (empty bullets). Create stub docs/{ARCHITECTURE,TASKS,SUPABASE,PREFLIGHT,DEMO,ART_STYLE}.md with a title and one line saying who owns them.
- Create .gitignore covering: node_modules, dist, .env, .env.*, !.env.example, backend/.venv, __pycache__, .pytest_cache, media/, *.log, .DS_Store, and the identity rule `.agents/rules/99-identity.md`.
- Create a README.md stub (Nigel will rewrite it).
- Commit as "chore: repo skeleton". Do not push yet.
ACCEPTANCE: `git status` clean, tree matches section 13. REPORT the tree.
````

## 0.3 AGENTS.md and Antigravity rules
````text
[Standard preamble]
TASK: Write AGENTS.md and .agents/rules/*.md. HARD LIMIT: every file under 12,000 characters (check with wc -c). Keep them short and point to docs/ for detail.
Create:
1. AGENTS.md (the template below, adjusted only if the Master Context disagrees).
2. .agents/rules/00-project.md: what VoxFable is in 15 lines, the pipeline, the demo safety ladder, "read docs/Master_Context.md".
3. .agents/rules/10-ownership.md: the ownership table from Master Context section 1 and the "edit only your folders" rule, stubs rule, dependencies rule.
4. .agents/rules/20-git.md: section 14 rules.
5. .agents/rules/30-contracts.md: contracts are frozen, how to request changes, the engine/art/API interfaces in short form, "renderer is a pure function of time", "never execute LLM-written code", "no asset generation during requests", "art draws facing right".
6. .agents/rules/40-quality.md: child-safe content, no secrets, licence tracking for assets, honesty about unproven things, keep main runnable, small commits.
Do NOT create 99-identity.md (each person makes their own; it is git-ignored).
AGENTS.md TEMPLATE:
```
# VoxFable agent rules
Read docs/Master_Context.md before any task. It is the source of truth.
1. Identify who you work for (see .agents/rules/99-identity.md or the task preamble): Om, Maegan or Nigel.
2. Edit ONLY that person's folders (docs/Master_Context.md section 1). Shared files (contracts/, AGENTS.md, .agents/) change only through Om; others write a request in docs/status/<name>.md.
3. Keep main runnable. git pull --rebase origin main before every push. Never force-push main.
4. Contracts first: follow contracts/ exactly. Do not invent fields.
5. Never execute LLM-written code. Never commit secrets. Never generate assets during a user request.
6. Child-safe by default. Original art only. Record every asset licence in assets/LICENSES.md.
7. Be honest: say what is unproven or broken. Prefer the simplest thing that works.
8. Update docs/status/<name>.md at each milestone (Done/In progress/Next/Blockers/Requests/Contract proposals).
```
ACCEPTANCE: print `wc -c` for each file; all under 12,000. REPORT.
````

## 0.4 Contracts v0 (vocab, JSON schemas, TypeScript types, Pydantic models)
````text
[Standard preamble]
TASK: Freeze contracts v0 from docs/Master_Context.md sections 7, 8, 9, 10.1 and 10.8. Do not invent anything the Master Context does not say; where something is missing, choose the simplest option and list it in your report.
Create:
- contracts/vocab.json: every group in section 7 (commands, speech types, animations, expressions, mouth shapes, facing, camera shots with zoom, camera movements, moods with a tint color and opacity, interact kinds, accessories, species, palette keys, age bands, generation stages with labels). Moods tint suggestion: day none, sunset #ff9a4d at 0.18, night #1c2a5a at 0.35, cozy #ffb36b at 0.12, magical #9b6bff at 0.15.
- contracts/episode_plan.schema.json, character_bible.schema.json, series.schema.json, audio_manifest.schema.json, api.md (endpoint request/response shapes from section 9).
- contracts/types.ts: TypeScript types for EpisodePlan, Scene, Beat, Action (discriminated union), Choice, CastMember, AudioManifest, ChoiceInfo, EpisodePlayerProps, EpisodePlayerHandle, CharacterDrawState, GenerationStatus, EpisodeRecord, DataRepo interface (listSeries, getSeries, saveSeries, deleteSeries, listCharacters, saveCharacter, deleteCharacter, getProfile, saveProfile).
- backend/app/models/ Pydantic v2 models mirroring the schemas (Action as a discriminated union on `type`).
- scripts/validate_fixtures.py: validates every file in fixtures/ against the JSON Schemas (jsonschema package) and prints PASS/FAIL per file.
ACCEPTANCE: running `python scripts/validate_fixtures.py` works once fixtures exist (next prompt). Types compile with `tsc --noEmit` after the frontend exists. REPORT any ambiguity you resolved.
````

## 0.5 Fixtures and asset-metadata stubs
````text
[Standard preamble]
TASK: Create fixtures Maegan can play on day one, and minimal metadata stubs so the validator and engine have IDs.
1. fixtures/episode_quick_demo.json: non-interactive, about 45 s, 3 scenes, cast pip_owl + rusty_fox, backgrounds forest_day then meadow_day then treehouse_interior, uses MOVE_TO, SET_EXPRESSION, SET_CAMERA (all three shots and two movements), SET_MOOD (day then sunset), ATTACH_PROP, INTERACT wave_at, PLAY_SFX, PLAY_MUSIC. Story: a shy owl learns to share her treehouse. Child-friendly text, speech under 25 words.
2. fixtures/episode_live_demo.json: interactive, 2 choice points, branches sc2a/sc2b reconverging on sc3 (use the Master Context section 8 example as the start).
3. fixtures/audio_manifest_quick_demo.json and audio_manifest_live_demo.json with real line_ids and duration_ms (estimates are fine for now), urls pointing to /demo/... files that will exist after Part 9; words arrays may be empty.
4. assets/metadata/{characters,backgrounds,props,animations,sfx,music}.json containing exactly the v1 ids from Master Context section 7 with the fields in section 11 (copy default palettes sensibly; licence "original" for art; sfx/music entries with "licence": "TBD" and source_url ""). Nigel owns these files from the moment you push.
5. Run scripts/validate_fixtures.py. All fixtures must PASS and every id in them must exist in the metadata stubs.
ACCEPTANCE: PASS on all fixtures. REPORT.
````

## 0.6 Frontend scaffold, aliases and stubs in everyone's folders
````text
[Standard preamble]
TASK: Scaffold the frontend so Maegan and Nigel can start immediately. Use Vite + React + TypeScript + Tailwind + react-router + vitest.
Do:
- Create frontend/ (Vite react-ts). Add tailwindcss, react-router-dom, vitest, @testing-library/react (minimal), @supabase/supabase-js. Aliases: `@/`=frontend/src, `@contracts`=contracts, `@fixtures`=fixtures, `@assets`=assets. Set vite server.fs.allow to the repo root. Configure tsconfig paths to match. Add npm scripts: dev, build, test, typecheck.
- Router in frontend/src/App.tsx with these routes (lazy components): /login, /signup, /, /quick, /studio, /library, /episode/:id, /dev/engine, /dev/live, /dev/art. Route guard component in src/auth that allows signed-in users OR demo mode (stub for now).
- Create STUB files, one time only (owners take over immediately):
  - src/engine/index.ts exporting a placeholder EpisodePlayer component (renders an empty 16:9 canvas and a "stub" note) and the handle type from @contracts/types; src/engine/dev/Harness.tsx.
  - src/live/index.ts (placeholder LiveController), src/live/dev/LiveHarness.tsx.
  - src/characters/index.ts exporting drawCharacter (stub: a colored rounded rectangle + circle head using palette, with the species name drawn small); src/backgrounds/index.ts exporting drawBackground (stub gradient + id text); src/props/index.ts exporting drawProp (stub circle + id).
  - src/pages/{Home,Quick,Studio,Library,Episode}.tsx, src/pages/auth/{Login,Signup}.tsx, src/pages/dev/ArtGallery.tsx, src/ui/ (empty), src/studio/ (empty), each a one-line placeholder.
- Create frontend/.env.example (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_API_BASE=http://localhost:8000) and root .env.example listing every backend var from Master Context section 6.
- Make `npm run dev` start and every route render its placeholder; `npm run typecheck` and `npm test` pass.
ACCEPTANCE: dev server runs, all routes load, typecheck passes. REPORT.
````

## 0.7 PUSH #1: unblock the team
````text
[Standard preamble]
TASK: Prepare Push #1.
1. Make sure docs/status/om.md says what is done and what is next (Supabase, backend skeleton).
2. Copy the three Prompts_*.md files into docs/prompts/.
3. Run: git status; npm run typecheck; python scripts/validate_fixtures.py. Fix problems.
4. Make sure the remote exists (`git remote -v`; if empty run `git branch -M main && git remote add origin <REPO_URL>`; ask me for the URL), commit, then `git push -u origin main`. After this, I work on branches `om/<topic>` and publish with the Git closing prompt (G1).
5. Print the exact message I should send the team: what is in the push, how to clone, `cd frontend && npm install && npm run dev`, the routes they own, and "pull, then start a fresh Antigravity task".
ACCEPTANCE: pushed, and a fresh clone in another folder installs and runs. REPORT.
````

## 0.8 Supabase schema, RLS, trigger, two-account test
````text
[Standard preamble]
TASK: Write the Supabase migration from Master Context section 6 and test it.
Create:
- supabase/migrations/0001_init.sql: tables profiles, series, characters, episodes, generations with exactly the columns, checks and defaults in section 6; `updated_at` triggers where relevant; indexes on owner_id and (owner_id, created_at); RLS enabled on every table; owner-only policies; trigger function `handle_new_user` on auth.users that inserts a profiles row using raw_user_meta_data (display_name, account_type, default 'parent'). Make the SQL idempotent where easy.
- docs/SUPABASE.md: how to run the SQL (paste into the Supabase SQL editor, or Supabase CLI), the dashboard steps (disable email confirmation, where to copy URL and keys), key naming (publishable vs secret, legacy anon vs service_role), and the RLS test.
- scripts/test_rls.py: using supabase-py, sign up two test users with the publishable key, as user A insert a series, then as user B confirm it cannot select, update or delete it; confirm the backend secret-key client can read it; print PASS/FAIL. Reads keys from backend/.env and never prints them.
Tell me the exact manual steps (I will paste the SQL and fill backend/.env myself). Do not put real keys anywhere tracked.
ACCEPTANCE: after I run it, scripts/test_rls.py prints PASS. REPORT.
````

## 0.9 Backend skeleton, auth dependency, repositories, frontend lib
````text
[Standard preamble]
TASK: Build the backend skeleton and the shared frontend lib (PUSH #2 target: about H+2:00).
Backend (backend/): FastAPI app in backend/app with: config via pydantic-settings reading backend/.env (see Master Context section 6); CORS for http://localhost:5173; `/media` static mount at MEDIA_DIR; `GET /api/health` returning mode, supabase reachable, llm provider names, ffmpeg available; an auth dependency that verifies `Authorization: Bearer` through Supabase Auth `get_user(token)` and returns {user_id}; when DEMO_MODE=true it skips verification and returns user_id "demo"; a `Repository` interface (create/update/get/list for episodes and generations, owner-scoped) with `SupabaseRepository` (secret key; always set owner_id from the verified user) and `LocalFileRepository` (JSON files under MEDIA_DIR/data); standard error format {error:{code,message}}; backend/requirements.txt; a README section in docs/ARCHITECTURE.md on how to run (`uvicorn app.main:app --reload`); pytest with a health test and an auth test with a fake token.
Frontend lib (frontend/src/lib, auth, config): config.ts (reads env, exposes demoMode flag persisted in localStorage), supabase.ts (client with publishable key, null in demo mode), auth/AuthProvider + useAuth() (session, signUp(email,password,displayName,accountType), signIn, signOut, enterDemoMode, loading), route guard, DataRepo with SupabaseRepo and LocalRepo (localStorage) implementing @contracts/types DataRepo, lib/api.ts typed client for every endpoint in Master Context section 9 (attaches the bearer token; in demo mode sends no token), plus a `useGeneration(generationId)` polling hook (1.5 s interval, stops on succeeded/failed).
ACCEPTANCE: `uvicorn` runs; /api/health OK in both modes; frontend typechecks; a signup + login works against my Supabase from a temporary test page that you delete afterwards. Commit, pull --rebase, push. REPORT and give me the message for the team.
````

---

# PART 1: LLM adapter and story generation

## 1.1 LLM provider adapter
````text
[Standard preamble]
TASK: Implement backend/app/llm/ provider adapter.
- Interface: `async generate_json(system, user, schema: dict | PydanticModel, temperature=0.7, max_retries=2) -> dict`.
- Providers: Gemini (REST via httpx or the official SDK; check current docs, request JSON output), Groq (OpenAI-compatible endpoint), Ollama (local /api/chat with format json). Model names come ONLY from env (GEMINI_MODEL, GROQ_MODEL, OLLAMA_MODEL). Provider order from LLM_PROVIDER_ORDER (default gemini,groq,ollama) with automatic fallback on errors and rate limits.
- Reliability: strip code fences, parse JSON, validate with Pydantic; on failure retry with the validation error appended to the prompt; exponential backoff on 429/5xx; global concurrency semaphore (default 2) and a simple token-bucket rate limiter.
- Cache: file cache under MEDIA_DIR/cache keyed by sha256(provider-agnostic: system+user+schema name+temperature); cache hits skip the network. A flag to bypass the cache.
- A `scripts/llm_smoke.py` that asks for {"ok":true,"word":"..."} from each configured provider and prints latency and PASS/FAIL, and a pytest with a fake provider proving fallback and retry.
ACCEPTANCE: smoke test passes for at least one provider. REPORT latency and JSON success rate over 5 calls per provider (these are measurements, not promises).
````

## 1.2 Story Writer
````text
[Standard preamble]
TASK: Implement the Story Writer station in backend/app/stations/writer.py with prompts in backend/app/prompts/writer.md.
Input: user prompt (or series + characters + episode premise), age_band, language, interactive flag, and the available roster/backgrounds/props loaded from assets/metadata/*.json.
Output StoryDraft (Pydantic): title, synopsis, cast (character_ids from the roster or the series), scenes[] each with scene_id, background_id, mood, summary, beats[] (type NARRATE|SPEAK, character_id?, text, emotion), choice? (prompt, options with label and keywords and target scene ids) when interactive, and a main-path order.
Prompt requirements: narrative arc (hook, setup, conflict, escalation, payoff); child-appropriate tone for the age band; only roster characters and library locations; speech under 25 words; 3-6 scenes; no scary or violent content; for interactive episodes exactly 2-3 choice points whose branches reconverge; keywords are simple spoken words a child would say.
Add a unit test with a fake LLM and a golden-file test of the prompt assembly. Add scripts/try_writer.py "<prompt>" printing the draft.
ACCEPTANCE: three different prompts (owl shares treehouse; fox loses a kite; kid finds a glowing door) each give a valid StoryDraft. REPORT latency.
````

## 1.3 Animation Director
````text
[Standard preamble]
TASK: Implement the Animation Director in backend/app/stations/director.py with prompts in backend/app/prompts/director.md.
Input: one scene of the StoryDraft + cast + asset metadata + the command vocabulary from contracts/vocab.json. Output: a plan Scene (beats with actions) matching contracts/episode_plan.schema.json.
Rules in the prompt: only existing ids; use MOVE_TO with normalized coordinates and y inside 0.62-0.92; give every scene an opening SET_CAMERA wide; vary shots; use SET_EXPRESSION to match emotion; add PLAY_SFX/PLAY_MUSIC sparingly using ids from metadata; the choice beat is last in its scene; keep each beat actions under 4.
Run scenes IN PARALLEL (asyncio.gather, respecting the LLM concurrency limit) and stitch into a full EpisodePlan with cast snapshot (species, palette, accessories, voice from metadata or series bible), start_scene, next_scene links and age_band.
ACCEPTANCE: three draft-to-plan runs produce plans that load in the Master Context schema. REPORT how many validator repairs were needed (next prompt).
````

## 1.4 Validator and Asset Resolver
````text
[Standard preamble]
TASK: Implement backend/app/validation/ (code, not AI).
- Schema validation with Pydantic plus rules from Master Context section 8: id existence against assets/metadata, animation and expression support per character, numeric clamping (x 0.05-0.95, y 0.62-0.92), durations > 0, choice beat last, next_scene targets exist, reachability, limits (scenes, beats, words), characters used must be in cast, SPAWN inserted if a character is used but never placed.
- Resolver fallback ladder: exact match, similar asset (same species or tags), adapt (swap to an available asset and note it), rewrite scene (ask the Director again once with the error list), else drop the offending action. NEVER raise on an invented id; always return a valid plan plus a `repairs[]` list (keep repairs out of the plan itself; write them to the logs).
- 25+ pytest cases including nasty inputs (unknown ids, y out of range, dangling next_scene, choice not last, empty beats).
ACCEPTANCE: pytest passes; fixtures validate unchanged. REPORT the repair categories.
````

## 1.5 TTS and audio manifest
````text
[Standard preamble]
TASK: Implement backend/app/tts/ with edge-tts.
- For each speech line, pick the voice from the cast voice (narrator voice from env or default). Synthesize to MEDIA_DIR/audio/<sha256(text+voice+rate+pitch)>.mp3; reuse if present (cache).
- Capture word or sentence boundary events from edge-tts; build `words[]` (estimate evenly by character count if the library gives sentence-level or no timings). Get duration with mutagen or ffprobe.
- Build the audio manifest per Master Context section 8 (line_id = episode_id:scene_id:beat_id), include music and sfx entries pointing at /assets/audio/... for ids used by the plan.
- Run lines with limited concurrency (3). On failure retry twice, then fall back to a silent placeholder with estimated duration and flag `tts_failed` on that line so the episode still plays.
- scripts/tts_smoke.py that synthesizes two lines and prints durations.
ACCEPTANCE: a manifest for fixtures/episode_quick_demo.json is generated and plays in the browser (open an MP3 manually). Write the generated real audio into frontend/public/demo/fixtures/ and update the fixture manifests' urls so Maegan's engine can use real audio. REPORT measured time for 10 lines. Tell the team to pull.
````

## 1.6 Job pipeline, generation API and progress stages
````text
[Standard preamble]
TASK: Implement the Quick Story pipeline and the generation API.
- backend/app/pipeline.py: run Writer, Director (parallel), Validator/Resolver, (Continuity and Safety hooks that are no-ops for now), TTS, then store the episode through Repository with status ready. Update the generation row at each stage using the keys in contracts/vocab.json (understanding, writing, planning, preparing, checking, narration, ready); `progress` stays null unless truly measurable (for example lines synthesized / total).
- Endpoints per Master Context section 9: POST /api/generations (kind quick), GET /api/generations/{id}, GET /api/episodes, GET /api/episodes/{id} (include audio_manifest, safety, continuity, status, video_url). Background tasks via asyncio; in-memory registry plus Repository persistence; a failed stage sets status failed with a human-readable error, never a stack trace.
- Make every stage independently skippable via env for debugging (SKIP_TTS=true etc.).
- scripts/try_pipeline.py "<prompt>" runs end to end and prints stage timings.
ACCEPTANCE: `POST /api/generations` with a prompt returns an episode that Maegan's player can load. REPORT end-to-end time over 3 prompts (measurement). Push, then tell the team: INTEGRATION 1 can start.
````

---

# PART 2: Safety, continuity, batch, export, live match

## 2.1 Safety Gate
````text
[Standard preamble]
TASK: Implement backend/app/stations/safety.py.
- Keyword blocklist file backend/app/safety/blocklist.txt (violence, weapons, death, drugs, adult content, hate, strong fear words; scaled by age band) with a whole-word matcher.
- Reading-level check: average words per sentence and syllable estimate; flag text above the band.
- LLM judge: returns age_fit (0-1) and scary (0-1) with notes, strict JSON.
- Combine into safety {age_fit, scary, verdict: pass|review|fail, notes}. Thresholds as env values (defaults: fail if blocklisted word or scary > 0.5 or age_fit < 0.5; review if scary > 0.3).
- On fail regenerate only the offending scenes once via the Director/Writer with the notes; if still failing set the episode status needs_review (never silently pass).
- Tests for the blocklist and thresholds. Add 3 deliberately bad prompts to scripts/safety_demo.py to show the gate working.
ACCEPTANCE: a "scary monster eats everyone" prompt ends needs_review or is rewritten mild. REPORT.
````

## 2.2 Continuity Supervisor
````text
[Standard preamble]
TASK: Implement backend/app/stations/continuity.py.
- Input: plan + character bibles (personality, catchphrases, rules, voice) + previous-episode summaries (for series).
- Rule checks in code first (character used but not in series, species or name mismatch, catchphrase missing in a long episode, forbidden items from bible rules), then an LLM pass that returns violations {scene_id, beat_id, rule, suggestion}.
- One rewrite pass: ask the LLM to fix only the offending beats, then re-validate through the Validator. Record violations and `fixed` flags in plan.continuity.violations.
- Tests with a fake LLM.
ACCEPTANCE: a bible rule like "Pip never flies at night" is caught and fixed in a crafted example. REPORT.
````

## 2.3 Batch generation (Showrunner)
````text
[Standard preamble]
TASK: Implement kind=batch generation.
- Input: series + characters inline (per Master Context section 6 data-layer split), count N (cap at 5 for the demo), age_band, language.
- Stage 1: Season outline (LLM): N episode premises each with title, logline, characters used, and a thread that connects to the previous episode.
- Stage 2: for each premise run the full pipeline (Writer, Director, Validator, Continuity, Safety, TTS) with concurrency 2. After each episode finishes append its id to generation.episode_ids and persist, so the Studio UI shows episodes appearing one by one.
- If one episode fails, record it and continue; the generation finishes `succeeded` with failures listed in an `error_summary` field in the generation row (add to the schema if needed via a contract request to myself, then migration 0002).
- Make Studio episodes carry series_id and episode_no.
ACCEPTANCE: N=3 gives 3 consistent episodes for one series with badges data. REPORT total time (measurement) and cache effect on a second run.
````

## 2.4 Live match endpoint
````text
[Standard preamble]
TASK: Implement POST /api/live/match.
- Input {prompt, options[{id,label,keywords}], transcript}. Step 1: normalized keyword and label overlap scoring (lowercase, strip punctuation, simple plural stemming). If one option clearly wins return {option_id, confidence, method:"keyword"}.
- Step 2: otherwise ask the LLM (small prompt, strict JSON {option_id|null, confidence}) with a 2.5 s timeout. Step 3: on null or timeout return the default option with method:"default" (the client decides what to do).
- Never block on the network for more than 3 s total. Cache identical requests.
ACCEPTANCE: pytest with kid-like transcripts ("the door!", "ummm follow the fly thing") picks sensibly. REPORT.
````

## 2.5 FFmpeg export
````text
[Standard preamble]
TASK: Implement POST /api/episodes/{id}/export and GET /api/exports/{export_id}.
- Accept multipart `file` (WebM from the browser), store in MEDIA_DIR/exports/tmp. Convert with FFmpeg to MP4: -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart, scale to 1280x720 only if needed. Verify duration with ffprobe and fix a missing duration (browser WebM often lacks one) by re-encoding rather than stream copy.
- Run in a background task; status queued, running, done, failed; set episode.video_path on success; return mp4_url under /media/exports/.
- Limit upload size (for example 200 MB), validate the mime type, and clean temp files.
- scripts/export_smoke.py that exports a tiny generated WebM (create with ffmpeg testsrc) and prints PASS/FAIL.
ACCEPTANCE: smoke test passes; a Maegan-recorded WebM (after she finishes M4.1) exports. REPORT conversion time vs video length (measurement). If I am behind, hand this to Maegan per Master Context load balancing and note it in docs/status/om.md.
````

---

# PART 3: Integration, demo net, pre-flight

## 3.1 Integration checklist runner (use at H+7 and H+14)
````text
[Standard preamble]
TASK: Create docs/TASKS.md section "Integration checklist" and scripts/integration_check.py.
The script runs against a live local backend and checks: /api/health; sign up and sign in (online mode) or demo mode; POST a quick generation and poll to ready; fetch the episode and validate it against the schema; verify every audio url returns 200; call /api/live/match; run a batch of N=2; upload a tiny WebM to export and poll to done; print PASS/FAIL per step with timings.
The docs section lists the manual checks: open /quick, generate a judge-style prompt, play, switch to Live Mode, choose by voice and by tap, open /studio, generate N=3, see badges, export MP4, play the MP4, refresh the page and stay logged in, logout, use demo mode.
ACCEPTANCE: script runs and reports. REPORT failures with the owner (Om, Maegan or Nigel) responsible for each.
````

## 3.2 Bundled demo episodes (fallback net) and baked MP4s
````text
[Standard preamble]
TASK: Build the offline fallback.
- scripts/bake_demo_episode.py --prompt "<text>" --id demo_owl [--interactive]: runs the pipeline (or reads an existing episode id), copies plan.json, audio_manifest.json and all MP3s into frontend/public/demo/episodes/<id>/ (rewrite urls to /demo/episodes/<id>/...), and updates frontend/public/demo/episodes/index.json (id, title, interactive, has_video).
- Frontend side (I own lib/): LocalRepo / api layer in demo mode lists bundled episodes from that index and the player loads them statically with no backend; `has_video` episodes expose /demo/episodes/<id>/video.mp4 for the Download button.
- Bake at least 3 episodes: one Quick Story, one interactive Live episode, one Studio-style episode with badges. For the MP4s use Maegan's /dev/engine "Record" button then export through /api/episodes/{id}/export, then save as video.mp4 in the folder (manual step; document it in docs/PREFLIGHT.md).
- Test Level B and C of the safety ladder (Master Context section 5.3): turn off wifi, use "Continue in demo mode"; then stop the backend and confirm bundled episodes still play and download.
ACCEPTANCE: all three safety-ladder levels demonstrated. REPORT sizes of the demo folder (keep under about 30 MB).
````

## 3.3 Demo-machine pre-flight (H+19:30 on your laptop)
````text
[Standard preamble]
TASK: Write scripts/preflight.py and docs/PREFLIGHT.md.
The script checks on THIS machine: python, node, ffmpeg + libx264 + aac, ports 5173 and 8000 free, backend/.env and frontend/.env present with required keys (print only "set"/"missing", never values), Supabase reachable and a test sign-in works, Gemini (and Groq if set) reachable with a 1-token call, edge-tts reachable, bundled demo episodes present with audio files, DEMO_MODE fallback boots, one full quick generation completes (report time), export smoke passes, disk space, battery/power reminder, screen sleep reminder. Print a green/red summary and the one command to launch everything (`scripts/run_demo.bat` and `scripts/run_demo.sh` start backend and frontend).
PREFLIGHT.md: the human checklist: laptop plugged in, sleep off, notifications off, Chrome/Edge as the demo browser with mic permission pre-granted and tested, volume, projector/HDMI resolution, wifi plus phone hotspot as backup, Supabase project opened recently (not paused), API keys not expired, fallback episodes tested, all three team members have the pitch deck, who talks when.
ACCEPTANCE: green on my laptop. REPORT.
````

---

# PART 4: Everyday prompts (reuse as needed)

## 4.1 Contract change request from a teammate
````text
[Standard preamble]
TASK: Read docs/status/maegan.md and docs/status/nigel.md "Contract proposals" and "Requests". For each: say accept, modify or reject with a reason; if accepted update contracts/ (vocab, schema, types, Pydantic models), docs/Master_Context.md (Context update entry) and fixtures, run validate_fixtures.py and typecheck, commit, push, and give me a short message telling the requester what changed and which files to pull.
````

## 4.2 Merge/pull and fresh start
````text
[Standard preamble]
TASK: git pull --rebase origin main. If conflicts occur, resolve them keeping other owners' folders unchanged. Run typecheck, pytest and validate_fixtures. Report what came in (commits by author) and anything that now fails.
````

## 4.3 Status update (end of each milestone)
````text
[Standard preamble]
TASK: Update docs/status/om.md: Done, In progress, Next, Blockers, Requests, Contract proposals. Be honest about anything unproven. Then give me a 5-line summary I can paste in the team chat.
````

## 4.4 Debug a failing generation
````text
[Standard preamble]
TASK: A generation failed or looks wrong. Given generation id <ID>, find the stage that failed from the logs/rows, show the raw LLM outputs (from the cache), the validator repairs, and the exact error. Propose the smallest fix, apply it, add a regression test, and re-run scripts/try_pipeline.py with the same prompt.
````

## 4.5 Freeze-time review (H+15)
````text
[Standard preamble]
TASK: It is feature freeze. List every TODO/FIXME in backend/ and my frontend folders, every failing test, every endpoint without a test, every place a secret could leak (grep for key patterns in tracked files), and every dependency on the internet. Rank by demo risk. Fix only HIGH risk items. Report.
````
