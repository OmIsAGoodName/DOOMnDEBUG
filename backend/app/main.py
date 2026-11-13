import os
import shutil
import asyncio
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .config import settings
from .auth import get_current_user
from .repositories import get_repository, Repository
from .pipeline import run_quick_story_pipeline, generation_tasks
from .stations.batch import run_batch_generation
from .live.matcher import match_transcript, MatchOption
from .export.converter import convert_webm_to_mp4, export_tasks, get_export_dirs

app = FastAPI(title="VoxFable API", version="0.1.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static media mount
media_path = Path(settings.MEDIA_DIR)
media_path.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_path)), name="media")

# Standard Exception Handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail and "message" in detail:
        error_payload = detail
    else:
        error_payload = {
            "code": f"HTTP_{exc.status_code}",
            "message": str(detail)
        }
    return JSONResponse(status_code=exc.status_code, content={"error": error_payload})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": str(exc)}}
    )

# --- Health Endpoint ---
@app.get("/api/health")
async def health():
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        local_app = os.environ.get("LOCALAPPDATA")
        if local_app:
            winget_path = Path(local_app) / "Microsoft" / "WinGet" / "Packages"
            if winget_path.exists():
                for p in winget_path.glob("Gyan.FFmpeg*/**/ffmpeg.exe"):
                    ffmpeg_bin = str(p)
                    break
    ffmpeg_available = ffmpeg_bin is not None
    supabase_configured = bool(settings.SUPABASE_URL and settings.SUPABASE_SECRET_KEY)
    mode = "demo" if settings.DEMO_MODE else "online"

    llm_info = settings.LLM_PROVIDER_ORDER.split(",")[0]
    if llm_info == "gemini":
        llm_desc = f"gemini/{settings.GEMINI_MODEL}"
    elif llm_info == "groq":
        llm_desc = f"groq/{settings.GROQ_MODEL}"
    else:
        llm_desc = f"ollama/{settings.OLLAMA_MODEL}"

    return {
        "ok": True,
        "mode": mode,
        "supabase": supabase_configured,
        "llm": llm_desc,
        "ffmpeg": ffmpeg_available
    }

# --- Request Models ---
class GenerationCreateRequest(BaseModel):
    kind: str = "quick" # "quick" | "batch"
    prompt: Optional[str] = None
    series: Optional[Dict[str, Any]] = None
    characters: Optional[List[Dict[str, Any]]] = None
    count: Optional[int] = 1
    age_band: Optional[str] = "4-6"
    language: Optional[str] = "en"
    interactive: Optional[bool] = False
    duration: Optional[str] = "1-2mins"
    generate_characters: Optional[bool] = False

class LiveMatchApiRequest(BaseModel):
    prompt: str
    options: List[MatchOption]
    transcript: str

# --- Generations Endpoints ---
@app.post("/api/generations")
async def create_generation(
    req: GenerationCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    repo: Repository = Depends(get_repository)
):
    gen_data = {
        "kind": req.kind,
        "prompt": req.prompt,
        "status": "queued",
        "stage": "understanding",
        "progress": 0,
        "episode_ids": []
    }
    created = await repo.create_generation(user["user_id"], gen_data)
    gen_id = created["id"]

    if req.kind == "batch" and req.series:
        asyncio.create_task(run_batch_generation(
            generation_id=gen_id,
            owner_id=user["user_id"],
            series=req.series,
            characters=req.characters or [],
            count=req.count or 3,
            age_band=req.age_band or "4-6",
            language=req.language or "en",
            repo=repo
        ))
    else:
        asyncio.create_task(run_quick_story_pipeline(
            generation_id=gen_id,
            owner_id=user["user_id"],
            prompt=req.prompt or "A charming friendship adventure",
            age_band=req.age_band or "4-6",
            language=req.language or "en",
            interactive=req.interactive or False,
            series=req.series,
            characters=req.characters,
            duration=req.duration or "1-2mins",
            generate_characters=req.generate_characters or False,
            repo=repo
        ))

    return {"generation_id": gen_id, "status": "queued"}

@app.get("/api/generations/{generation_id}")
async def get_generation(
    generation_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    repo: Repository = Depends(get_repository)
):
    cached = generation_tasks.get(generation_id)
    if cached:
        return {
            "id": cached["id"],
            "kind": cached.get("kind", "quick"),
            "status": cached.get("status", "running"),
            "stage": cached.get("stage", "understanding"),
            "progress": cached.get("progress"),
            "episode_ids": cached.get("episode_ids", []),
            "error": cached.get("error")
        }

    gen = await repo.get_generation(user["user_id"], generation_id)
    if not gen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Generation {generation_id} not found"}
        )
    return {
        "id": gen["id"],
        "kind": gen.get("kind", "quick"),
        "status": gen.get("status", "queued"),
        "stage": gen.get("stage", "understanding"),
        "progress": gen.get("progress"),
        "episode_ids": gen.get("episode_ids", []),
        "error": gen.get("error")
    }

# --- Episodes Endpoints ---
@app.get("/api/episodes")
async def list_episodes(
    user: Dict[str, Any] = Depends(get_current_user),
    repo: Repository = Depends(get_repository)
):
    episodes = await repo.list_episodes(user["user_id"])
    return [
        {
            "id": ep["id"],
            "title": ep.get("title", "Untitled"),
            "status": ep.get("status", "draft"),
            "video_url": ep.get("video_path"),
            "created_at": ep.get("created_at")
        }
        for ep in episodes
    ]

@app.get("/api/episodes/{episode_id}")
async def get_episode(
    episode_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    repo: Repository = Depends(get_repository)
):
    ep = await repo.get_episode(user["user_id"], episode_id)
    if not ep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Episode {episode_id} not found"}
        )
    return {
        "id": ep["id"],
        "title": ep.get("title", "Untitled"),
        "plan": ep.get("plan"),
        "safety": ep.get("safety"),
        "continuity": ep.get("continuity"),
        "audio_manifest": ep.get("audio_manifest"),
        "status": ep.get("status", "draft"),
        "video_url": ep.get("video_path")
    }

# --- Live Mode Matching ---
@app.post("/api/live/match")
async def live_match(
    req: LiveMatchApiRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    res = await match_transcript(
        prompt=req.prompt,
        options=req.options,
        transcript=req.transcript
    )
    return {
        "option_id": res.option_id,
        "confidence": res.confidence,
        "method": res.method
    }

# --- Video Export Endpoints ---
@app.post("/api/episodes/{episode_id}/export")
async def export_episode(
    episode_id: str,
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    MAX_SIZE = 200 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "PAYLOAD_TOO_LARGE", "message": "Video exceeds 200 MB limit"}
        )

    export_id = f"exp_{uuid.uuid4().hex[:8]}"
    _, tmp_dir = get_export_dirs()
    temp_webm = tmp_dir / f"{export_id}.webm"

    with open(temp_webm, "wb") as f:
        f.write(content)

    asyncio.create_task(convert_webm_to_mp4(
        export_id=export_id,
        episode_id=episode_id,
        webm_path=temp_webm,
        owner_id=user["user_id"]
    ))

    return {"export_id": export_id}

@app.get("/api/exports/{export_id}")
async def get_export_status(
    export_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    task = export_tasks.get(export_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Export task {export_id} not found"}
        )
    return {
        "status": task["status"],
        "mp4_url": task.get("mp4_url"),
        "error": task.get("error")
    }

# --- Asset Catalog & Custom Character Endpoints ---
class CharacterCreateRequest(BaseModel):
    name: str
    species: str = "rabbit" # rabbit | turtle | fox | owl | kid
    prompt: Optional[str] = None
    personality: Optional[str] = "friendly"
    palette: Optional[Dict[str, str]] = None
    voice: Optional[Dict[str, str]] = None

def get_custom_characters_file() -> Path:
    p = Path(settings.MEDIA_DIR) / "data" / "custom_characters.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists():
        with open(p, "w", encoding="utf-8") as f:
            json.dump([], f)
    return p

def load_custom_characters() -> List[Dict[str, Any]]:
    p = get_custom_characters_file()
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_custom_character(char_data: Dict[str, Any]):
    p = get_custom_characters_file()
    chars = load_custom_characters()
    chars.append(char_data)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(chars, f, indent=2)

@app.get("/api/assets")
async def get_assets():
    from .stations.writer import load_metadata
    meta = load_metadata()
    customs = load_custom_characters()
    all_chars = meta.get("characters", []) + customs
    return {
        "characters": all_chars,
        "backgrounds": meta.get("backgrounds", []),
        "props": meta.get("props", []),
        "music": meta.get("music", []),
        "sfx": meta.get("sfx", [])
    }

@app.post("/api/characters")
async def create_character(
    req: CharacterCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    clean_name = req.name.strip() or "New Friend"
    char_id = f"custom_{clean_name.lower().replace(' ', '_')}_{uuid.uuid4().hex[:4]}"
    species = req.species.lower()
    if species not in ("rabbit", "turtle", "fox", "owl", "kid"):
        species = "kid"

    # Harmonious cartoon color palettes
    palette = req.palette
    if not palette:
        if species == "rabbit":
            palette = {"primary": "#e0e7ff", "secondary": "#fbcfe8", "accent": "#818cf8", "outline": "#1e1b4b"}
        elif species == "turtle":
            palette = {"primary": "#16a34a", "secondary": "#bbf7d0", "accent": "#fde047", "outline": "#14532d"}
        elif species == "fox":
            palette = {"primary": "#ea580c", "secondary": "#fed7aa", "accent": "#334155", "outline": "#1c1917"}
        elif species == "owl":
            palette = {"primary": "#78350f", "secondary": "#fde68a", "accent": "#f97316", "outline": "#451a03"}
        else:
            palette = {"primary": "#3b82f6", "secondary": "#fef08a", "accent": "#ec4899", "outline": "#0f172a"}

    voice = req.voice
    if not voice:
        if species == "rabbit":
            voice = {"engine_voice": "en-US-BrianMultilingualNeural", "rate": "+6%", "pitch": "+3Hz"}
        elif species == "turtle":
            voice = {"engine_voice": "en-US-ChristopherNeural", "rate": "-8%", "pitch": "-2Hz"}
        elif species == "fox":
            voice = {"engine_voice": "en-US-AndrewMultilingualNeural", "rate": "+4%", "pitch": "+0Hz"}
        elif species == "owl":
            voice = {"engine_voice": "en-US-EmmaNeural", "rate": "+2%", "pitch": "+1Hz"}
        else:
            voice = {"engine_voice": "en-US-AvaMultilingualNeural", "rate": "+3%", "pitch": "+2Hz"}

    new_char = {
        "id": char_id,
        "name": clean_name,
        "species": species,
        "status": "implemented",
        "tags": ["custom", req.personality or "friendly", species],
        "animations": ["idle", "walk", "talk", "wave", "laugh", "listen", "react", "point"],
        "expressions": ["neutral", "happy", "sad", "surprised", "worried", "excited"],
        "accessories": ["scarf", "hat"],
        "default_palette": palette,
        "default_voice": voice,
        "licence": "original"
    }

    save_custom_character(new_char)
    return new_char
