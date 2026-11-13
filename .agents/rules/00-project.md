# 00-project: VoxFable Project Overview

VoxFable is an AI cartoon studio for children built for a 24-hour hackathon (PS 16).
Type one story idea and get a finished, narrated, consistent animated 2D episode in minutes.

### Key Modes
- Quick Story: Prompt -> instant generated episode -> play -> download MP4.
- Live Mode: Interactive storytelling where children speak to characters at branch points.
- Studio Mode: Multi-episode series generator with continuity & safety validation.

Always read `docs/Master_Context.md` before starting any task.

### Pipeline
Story Writer -> Animation Director -> Validator + Asset Resolver -> Continuity Supervisor -> Safety Gate -> TTS -> Player -> Export

### Demo Safety Ladder
- Level A (Online): Everything live via Supabase, Gemini/Groq LLMs, Edge-TTS.
- Level B (Degraded): "Demo Mode" login, local bundled episodes, tap choices, local FFmpeg export.
- Level C (Offline/Fallback): Pre-baked static episodes & MP4 downloads in frontend/public/demo/.
