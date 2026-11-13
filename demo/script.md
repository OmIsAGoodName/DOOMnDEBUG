# VoxFable: 3-Minute Demo Script & Rehearsal Guide

**Target Duration**: 3:00 Minutes (Timed Down to the Second)  
**Event**: Hackathon Final Presentations (PS 16)  
**Roles**:  
- **Nigel**: Lead Narrator & Pitch Speaker (Microphone & Audience focus)  
- **Om**: Technical Operator (Laptop controller, route navigation, timing keeper)  
- **Maegan**: Engine & Live Interaction Specialist (Handles speech interaction, on call for technical questions)  

---

## 1. Rehearsed 3-Minute Stage Script

```text
TIMELINE BREAKDOWN:
0:00 - 0:25  | The Hook & Problem (Nigel speaks, Om opens Home page)
0:25 - 1:15  | Quick Story & Audience Generation (Om types prompt, generation stages run, episode plays)
1:15 - 2:00  | Live Mode: The Cartoon That Listens (Maegan & Nigel interact with the character)
2:00 - 2:30  | Showrunner Studio & Batch Continuity (Om switches to Studio, shows character bible & season grid)
2:30 - 3:00  | MP4 Export, Safety Ladder & Business Wrap-up (Nigel concludes, Q&A hand-off)
```

---

### Act 1: The Hook & The Problem (0:00 – 0:25)

**[Screen: `http://localhost:5173/` — VoxFable Home Page]**

- **Om**: *Has browser open full screen at `1920x1080`, zoomed to 100%. Mouse hovering near "Quick Story" card.*
- **Nigel (Speaks to judges with energy)**:
  > "Judges, every child loves cartoons, but creating them has always been locked behind multi-million dollar studios or clunky generative video tools that hallucinate characters, morph limbs, and melt cloud GPUs.
  >
  > We built **VoxFable** — an autonomous AI cartoon studio for children. In under two minutes, VoxFable takes a single story prompt and produces a finished, voiced, scored animated episode with zero character drift. And unlike any video tool you've ever seen: **it listens to the child.**
  >
  > Om, let's make an episode right now."

---

### Act 2: Quick Story & Generation Pipeline (0:25 – 1:15)

**[0:25 - Om clicks "Quick Story" button -> Navigates to `/quick`]**

- **Om**: *Clicks into the story prompt box.*
- **Nigel (Turns to judges)**:
  > "Judge, give us a character and a quick challenge — or we can pick one of our audience favorites."

> **[Handling Judge Prompts]**:
> - *If Judge gives a great prompt* (e.g. "A fox looking for his lost kite"): Om types it quickly.
> - *If Judge gives a complex/odd prompt* (e.g. "Batman fights aliens"): Nigel steers instantly: *"Let's see Rusty the Fox take on an alien mystery in the sunny meadow!"* (Never argue, just gently adapt to available species: Owl, Fox, Kid).
> - *If Judge hesitates for >3 seconds*: Om immediately clicks the pre-set example chip: **"A fox loses his kite and finds a new friend"**.

- **Om**: *Selects Age Band `5-7`, leaves 'Let the cartoon listen' ON, and clicks **Generate**.*
- **[0:35 - Generation Stepper Appears: Stages activate]**

- **Nigel (Fills generation time with zero dead air — explains the architecture)**:
  > "While it generates, notice what's happening under the hood. We aren't calling a blind text-to-video API. 
  > 
  > Our **Story Writer** agent first drafts age-tailored narrative beats. Our **Animation Director** converts those beats into strict coordinate choreography — camera zooms, character poses, and prop interactions. 
  > 
  > Then, our **Validator** and **Safety Gate** inspect the entire scene plan. They verify that characters never break physical continuity and that every line passes child safety thresholds before a single audio track is recorded."

- **[0:55 - Stepper completes to 100%, `<EpisodePlayer>` loads canvas, 'Tap to play' appears]**
- **Om**: *Clicks canvas play button.*
- **[Audio plays: Sunny forest background music swells, Rusty Fox hops onto screen, voice speaks with real-time lip-sync]**
- **Nigel (Points to canvas)**:
  > "Look at the screen: 60 frames per second, crisp vector rendering, zero blur, dynamic camera framing, and real-time lip-sync driven by audio amplitude analysis. The entire episode plan is just 120 kilobytes of pure data."

---

### Act 3: Live Mode — The Cartoon That Listens (1:15 – 2:00)

**[1:15 - Story reaches branch point at Scene 2]**

- **[On Canvas: Rusty Fox stops at a crossroads, turns facing the viewer, music drops to ambient volume, listening microphone ripple pulses]**
- **[Character Voice]**: *"I found two paths! Should we climb up the tall oak tree, or search down by the riverbank?"*
- **[On-Screen: Mic pulse glows; two prominent buttons appear: [Climb Oak Tree] and [Search Riverbank]]**

- **Nigel**:
  > "Here is where the magic happens. The fourth wall disappears. Maegan, tell Rusty where to go."

- **Maegan (Leans toward Om's laptop microphone, speaks clearly)**:
  > *"Let's search by the riverbank!"*

> **[Mic Failure Fallback]**:
> - *If ambient room noise prevents Web Speech recognition within 3 seconds*: Om immediately clicks the visible **[Search Riverbank]** button without hesitation!
> - *Nigel seamlessly covers*: *"And with one tap or a voice command, Rusty listens!"*

- **[1:35 - Canvas instantly resumes: Rusty nods, exclaims 'To the riverbank!', and branches into the river path with continuous musical scoring]**
- **Nigel**:
  > "Notice there was zero buffering. The system matched intent in milliseconds, stitched the branch scene, and continued playback without breaking the child's immersion."

---

### Act 4: Studio Mode & Consistency Rules (2:00 – 2:30)

**[2:00 - Om clicks "Studio" in top navigation bar -> Navigates to `/studio`]**

- **Om**: *Selects the series **'Pip & Friends'**, scrolls down to show Character Builder and World Rules.*
- **Nigel**:
  > "Now imagine you're an educator or indie animator creating an entire series. Welcome to **Studio Mode**.
  > 
  > In the Character Builder, you customize species, color palettes, and accessories with live 60-FPS canvas rendering. More importantly, you establish **World Rules** and character bibles — for example, 'Pip never flies at night' or 'The magic door is always locked'."

- **Om**: *Scrolls to the Season Batch Generator showing 3 generated episodes with green badges.*
- **Nigel**:
  > "With one click, you generate an entire season. Notice the badges on each episode card: **Safety: PASS** with age-fit metrics, and **Continuity: OK** indicating zero lore or prop violations. VoxFable acts as an autonomous showrunner."

---

### Act 5: MP4 Export, Business Model & Wrap-up (2:30 – 3:00)

**[2:30 - Om clicks back to Episode view, hovers over "Download MP4"]**

- **Om**: *Clicks "Download MP4" — export modal shows recording progress cleanly.*
- **Nigel (Delivers high-impact closing summary)**:
  > "When the creator is ready to distribute, VoxFable records the canvas client-side and transcodes to standard MP4 with FFmpeg — ready for YouTube, classroom projectors, or offline playback.
  >
  > Because rendering runs client-side on Canvas 2D, our marginal playback cost is essentially zero. We can offer families an unlimited interactive bedtime story subscription for \$9.99 a month, and creators a \$29 tier for seasonal batch generation.
  >
  > Every piece of art is 100% original. Every sound effect is CC0. 
  >
  > We are VoxFable — bringing personal, safe, interactive storytelling to every child in the world. Thank you, and we'd love to take your questions!"

---

## 2. Safety Ladder & Contingency Plan (What to Do If Things Break)

| Level | Condition | Stage Action | Exact Click Path |
|---|---|---|---|
| **Level A** | **Everything is Green** | Full live generation from audience prompt. Real-time TTS and speech recognition. | `/quick` -> Type prompt -> Generate -> Play. |
| **Level B** | **API Slow / Rate Limited / WiFi Jitter** | Skip waiting on LLM: trigger cached generation or local pre-computed response. | Click preset example chip on `/quick`. If generation takes > 15s, switch immediately to pre-cached generation in `/quick`. |
| **Level C** | **Total Network / Backend Drop** | Use bundled offline demo episodes in standalone demo mode. | Click "Demo Mode" in top bar, navigate to `/library`, open pre-bundled episode **'Pip and the Glowing Door'**. Play instant video/canvas. |

---

## 3. Alternative Presentation Timers

### The 60-Second Elevator Pitch Variant
- **0:00 - 0:15**: Problem statement: Animation is slow, diffusion video hallucinates characters.
- **0:15 - 0:40**: Jump straight to `/episode/1` (Pip and Rusty at branch point). Maegan speaks: *"Climb the oak tree!"*. Character branches and plays instantly.
- **0:40 - 0:60**: Open `/studio`, flash the 3-episode batch grid with green safety badges. State pricing (\$9.99/mo) and wrap.

### The 5-Minute Deep-Dive Variant
- Use the standard 3-minute script, but expand:
  - **At 1:00**: Show the raw JSON Scene Plan in the dev tools or explain coordinate interpolation and `renderAt(t)` determinism.
  - **At 2:15**: Open `/studio`, create a new customized character live (recolor Rusty Fox with custom teal fur and a wizard hat accessory).
  - **At 3:30**: Open `/dev/art` to show the full 8-pose matrix and 12 vector props, proving 100% vector determinism and zero copyright risk.
  - **At 4:30**: Detailed review of unit economics and enterprise school pilot plans.

---

## 4. "Never Do On Stage" Rules

1. **NEVER reload the browser during an active generation.** (Let the stepper finish or fail gracefully; refreshing kills the polling state).
2. **NEVER open dev routes on stage** (like `/dev/art` or `/dev/engine`) unless a judge explicitly asks to inspect raw rendering primitives.
3. **NEVER apologize or argue about speech recognition.** If the microphone doesn't pick up within 2 seconds, tap the on-screen choice immediately and keep talking smoothly.
4. **NEVER show terminal windows, console errors, or backend tracebacks.** Keep the browser full-screen at all times.
5. **NEVER invent market statistics or revenue claims.** Stick strictly to verified unit economics.
