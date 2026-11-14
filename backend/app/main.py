import os
import shutil
import asyncio
import uuid
import json
import httpx
from pathlib import Path
from typing import Dict, Any, List, Optional, Literal
from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .config import settings, BASE_DIR
from .auth import get_current_user
from .repositories import get_repository, Repository
from .pipeline import run_quick_story_pipeline, generation_tasks
from .stations.batch import run_batch_generation
from .live.matcher import match_transcript, MatchOption
from .export.converter import convert_webm_to_mp4, export_tasks, get_export_dirs
from .llm.providers import PROVIDER_STATS, MODEL_STATS
from .llm.cache import cache

app = FastAPI(title="VoxFable API", version="0.1.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# --- System Diagnostics & API Key Management ---
class KeyUpdateRequest(BaseModel):
    provider: Literal["groq", "gemini"]
    api_key: str
    model: Optional[str] = None

class ActiveProviderRequest(BaseModel):
    provider: Literal["groq", "gemini", "ollama"]
    model: Optional[str] = None

@app.get("/api/system/stats")
async def system_stats():
    groq_key = settings.GROQ_API_KEY or ""
    masked_groq = f"{groq_key[:6]}...{groq_key[-4:]}" if len(groq_key) > 10 else "Not configured"

    gemini_key = settings.GEMINI_API_KEY or ""
    has_gemini = bool(gemini_key and "your-gemini" not in gemini_key.lower())
    masked_gemini = f"{gemini_key[:6]}...{gemini_key[-4:]}" if has_gemini else "Not configured"

    media_audio = Path(settings.MEDIA_DIR) / "audio"
    audio_clips = len(list(media_audio.glob("*.mp3"))) if media_audio.exists() else 0

    active_prov = settings.LLM_PROVIDER_ORDER.split(",")[0].strip().lower()
    if active_prov == "gemini":
        active_model = settings.GEMINI_MODEL
    elif active_prov == "groq":
        active_model = settings.GROQ_MODEL
    else:
        active_model = settings.OLLAMA_MODEL

    active_stats = MODEL_STATS.get(active_model) or {
        "provider": active_prov,
        "display_name": active_model,
        "calls": 0,
        "successes": 0,
        "rate_limits": 0,
        "errors": 0,
        "last_latency_ms": None,
        "last_status": "idle"
    }

    return {
        "ok": True,
        "active_provider": active_prov,
        "active_model": active_model,
        "active_model_stats": active_stats,
        "models": MODEL_STATS,
        "provider_order": [p.strip().lower() for p in settings.LLM_PROVIDER_ORDER.split(",") if p.strip()],
        "providers": {
            "groq": {
                "configured": bool(groq_key and "your-groq" not in groq_key.lower()),
                "masked_key": masked_groq,
                "model": settings.GROQ_MODEL,
                "candidate_models": ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "openai/gpt-oss-20b", "llama-3.1-8b-instant"],
                "stats": PROVIDER_STATS["groq"]
            },
            "gemini": {
                "configured": has_gemini,
                "masked_key": masked_gemini,
                "model": settings.GEMINI_MODEL,
                "candidate_models": ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-pro-latest"],
                "stats": PROVIDER_STATS["gemini"]
            },
            "ollama": {
                "configured": bool(settings.OLLAMA_URL),
                "url": settings.OLLAMA_URL,
                "model": settings.OLLAMA_MODEL
            },
            "tts": {
                "engine": "Edge-TTS",
                "concurrency": 6,
                "cached_audio_clips": audio_clips
            }
        },
        "mode": "demo" if settings.DEMO_MODE else "online",
        "needs_attention": PROVIDER_STATS["groq"]["needs_new_key"] or PROVIDER_STATS["gemini"]["needs_new_key"]
    }

@app.post("/api/system/active-provider")
async def switch_active_provider(req: ActiveProviderRequest):
    new_active = req.provider.lower()
    all_providers = ["groq", "gemini", "ollama"]
    reordered = [new_active] + [p for p in all_providers if p != new_active]
    settings.LLM_PROVIDER_ORDER = ",".join(reordered)

    if req.model:
        if new_active == "gemini":
            settings.GEMINI_MODEL = req.model
        elif new_active == "groq":
            settings.GROQ_MODEL = req.model
        elif new_active == "ollama":
            settings.OLLAMA_MODEL = req.model

    # Clear response cache so new provider produces fresh stories
    cache.clear()

    # Persist to .env
    env_path = BASE_DIR / "backend" / ".env"
    if env_path.exists():
        content = env_path.read_text(encoding="utf-8")
        lines = []
        for line in content.splitlines():
            if line.startswith("LLM_PROVIDER_ORDER="):
                lines.append(f"LLM_PROVIDER_ORDER={settings.LLM_PROVIDER_ORDER}")
            elif req.model and new_active == "gemini" and line.startswith("GEMINI_MODEL="):
                lines.append(f"GEMINI_MODEL={req.model}")
            elif req.model and new_active == "groq" and line.startswith("GROQ_MODEL="):
                lines.append(f"GROQ_MODEL={req.model}")
            else:
                lines.append(line)
        env_path.write_text("\n".join(lines), encoding="utf-8")

    current_model = (
        settings.GEMINI_MODEL if new_active == "gemini" else
        (settings.GROQ_MODEL if new_active == "groq" else settings.OLLAMA_MODEL)
    )

    return {
        "ok": True,
        "active_provider": new_active,
        "active_model": current_model,
        "provider_order": reordered,
        "message": f"Switched active provider to {new_active.upper()} ({current_model})!"
    }

@app.post("/api/system/keys")
async def update_api_key(req: KeyUpdateRequest):
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")

    if req.provider == "groq":
        # Test key against Groq API
        test_url = "https://api.groq.com/openai/v1/models"
        headers = {"Authorization": f"Bearer {key}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(test_url, headers=headers)
                if resp.status_code == 401:
                    raise HTTPException(status_code=400, detail="Invalid Groq API key (Unauthorized 401)")
                if resp.status_code == 429:
                    raise HTTPException(status_code=400, detail="This Groq API key has already exceeded rate limits (429)")
                if resp.status_code != 200:
                    raise HTTPException(status_code=400, detail=f"Groq API returned HTTP {resp.status_code}: {resp.text}")
            except httpx.RequestError as e:
                raise HTTPException(status_code=502, detail=f"Could not connect to Groq API: {e}")

        # Update in-memory settings
        settings.GROQ_API_KEY = key
        if req.model:
            settings.GROQ_MODEL = req.model

        # Reset provider stats
        PROVIDER_STATS["groq"]["needs_new_key"] = False
        PROVIDER_STATS["groq"]["last_status"] = "healthy"
        PROVIDER_STATS["groq"]["last_error"] = None

        # Persist to .env
        env_path = BASE_DIR / "backend" / ".env"
        if env_path.exists():
            content = env_path.read_text(encoding="utf-8")
            lines = []
            for line in content.splitlines():
                if line.startswith("GROQ_API_KEY="):
                    lines.append(f"GROQ_API_KEY={key}")
                elif req.model and line.startswith("GROQ_MODEL="):
                    lines.append(f"GROQ_MODEL={req.model}")
                else:
                    lines.append(line)
            env_path.write_text("\n".join(lines), encoding="utf-8")

        return {"ok": True, "message": "Groq API key verified and applied successfully!"}

    elif req.provider == "gemini":
        test_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(test_url)
                if resp.status_code != 200:
                    raise HTTPException(status_code=400, detail=f"Gemini API returned HTTP {resp.status_code}: {resp.text}")
            except httpx.RequestError as e:
                raise HTTPException(status_code=502, detail=f"Could not connect to Gemini API: {e}")

        settings.GEMINI_API_KEY = key
        if req.model:
            settings.GEMINI_MODEL = req.model

        PROVIDER_STATS["gemini"]["needs_new_key"] = False
        PROVIDER_STATS["gemini"]["last_status"] = "healthy"
        PROVIDER_STATS["gemini"]["last_error"] = None

        env_path = BASE_DIR / "backend" / ".env"
        if env_path.exists():
            content = env_path.read_text(encoding="utf-8")
            lines = []
            for line in content.splitlines():
                if line.startswith("GEMINI_API_KEY="):
                    lines.append(f"GEMINI_API_KEY={key}")
                elif req.model and line.startswith("GEMINI_MODEL="):
                    lines.append(f"GEMINI_MODEL={req.model}")
                else:
                    lines.append(line)
            env_path.write_text("\n".join(lines), encoding="utf-8")

        return {"ok": True, "message": "Gemini API key verified and applied successfully!"}

    raise HTTPException(status_code=400, detail="Unsupported provider")

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
    num_choices: Optional[int] = 1
    force_interactive_tree: Optional[bool] = False

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
            num_choices=req.num_choices or 1,
            force_interactive_tree=req.force_interactive_tree or False,
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
            "video_url": ep.get("video_path") or ep.get("video_url"),
            "created_at": ep.get("created_at"),
            "plan": ep.get("plan"),
            "safety": ep.get("safety"),
            "continuity": ep.get("continuity"),
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

@app.delete("/api/episodes/{episode_id}")
async def delete_episode(
    episode_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    repo: Repository = Depends(get_repository)
):
    success = await repo.delete_episode(user["user_id"], episode_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Episode {episode_id} not found"}
        )
    return {"ok": True, "deleted_id": episode_id}

@app.post("/api/episodes/clear")
async def clear_all_episodes(
    user: Dict[str, Any] = Depends(get_current_user),
    repo: Repository = Depends(get_repository)
):
    deleted_count = await repo.clear_episodes(user["user_id"])
    return {"ok": True, "cleared_count": deleted_count}

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

class BackgroundCreateRequest(BaseModel):
    name: str
    mood_hint: Optional[str] = "day" # day | night | sunset | cozy | magical
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    base_variant: Optional[str] = None

class PropCreateRequest(BaseModel):
    name: str
    default_slot: Optional[str] = "hand" # hand | head | ground
    tags: Optional[List[str]] = None
    emoji: Optional[str] = None
    description: Optional[str] = None

class AudioCreateRequest(BaseModel):
    name: str
    type: str = "music" # music | sfx
    mood: Optional[str] = "cheerful"
    description: Optional[str] = None

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

def get_custom_backgrounds_file() -> Path:
    p = Path(settings.MEDIA_DIR) / "data" / "custom_backgrounds.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists():
        with open(p, "w", encoding="utf-8") as f:
            json.dump([], f)
    return p

def load_custom_backgrounds() -> List[Dict[str, Any]]:
    p = get_custom_backgrounds_file()
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_custom_background(bg_data: Dict[str, Any]):
    p = get_custom_backgrounds_file()
    bgs = load_custom_backgrounds()
    bgs.append(bg_data)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(bgs, f, indent=2)

def get_custom_props_file() -> Path:
    p = Path(settings.MEDIA_DIR) / "data" / "custom_props.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists():
        with open(p, "w", encoding="utf-8") as f:
            json.dump([], f)
    return p

def load_custom_props() -> List[Dict[str, Any]]:
    p = get_custom_props_file()
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_custom_prop(prop_data: Dict[str, Any]):
    p = get_custom_props_file()
    props = load_custom_props()
    props.append(prop_data)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(props, f, indent=2)

def get_custom_audio_file() -> Path:
    p = Path(settings.MEDIA_DIR) / "data" / "custom_audio.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists():
        with open(p, "w", encoding="utf-8") as f:
            json.dump([], f)
    return p

def load_custom_audio() -> List[Dict[str, Any]]:
    p = get_custom_audio_file()
    try:
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []

def save_custom_audio(audio_data: Dict[str, Any]):
    p = get_custom_audio_file()
    audios = load_custom_audio()
    audios.append(audio_data)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(audios, f, indent=2)

@app.get("/api/assets")
async def get_assets():
    from .stations.writer import load_metadata
    meta = load_metadata()
    return {
        "characters": meta.get("characters", []),
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

@app.post("/api/backgrounds")
async def create_background(
    req: BackgroundCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    clean_name = req.name.strip() or "Enchanted Valley"
    clean_slug = clean_name.lower().replace(" ", "_").replace("-", "_")
    bg_id = f"custom_bg_{clean_slug}_{uuid.uuid4().hex[:4]}"
    mood = (req.mood_hint or "day").lower()
    if mood not in ("day", "night", "sunset", "cozy", "magical"):
        mood = "day"

    tags = ["custom", mood]
    if req.tags:
        tags.extend(req.tags)

    new_bg = {
        "id": bg_id,
        "name": clean_name,
        "status": "implemented",
        "tags": tags,
        "mood_hint": mood,
        "ground_band": [0.62, 0.92],
        "description": req.description or f"Custom storybook scenery: {clean_name}",
        "base_variant": req.base_variant or ("forest_night" if mood == "night" else "forest_day"),
        "licence": "original"
    }

    save_custom_background(new_bg)
    return new_bg

@app.post("/api/props")
async def create_prop(
    req: PropCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    clean_name = req.name.strip() or "Magic Trinket"
    clean_slug = clean_name.lower().replace(" ", "_").replace("-", "_")
    prop_id = f"custom_prop_{clean_slug}_{uuid.uuid4().hex[:4]}"
    slot = (req.default_slot or "hand").lower()
    if slot not in ("hand", "head", "ground"):
        slot = "hand"

    tags = ["custom", slot]
    if req.tags:
        tags.extend(req.tags)

    new_prop = {
        "id": prop_id,
        "name": clean_name,
        "default_slot": slot,
        "tags": tags,
        "emoji": req.emoji or "✨",
        "description": req.description or f"Custom story prop: {clean_name}",
        "licence": "original"
    }

    save_custom_prop(new_prop)
    return new_prop

@app.post("/api/audio")
async def create_audio(
    req: AudioCreateRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    clean_name = req.name.strip() or "Story Sound"
    clean_slug = clean_name.lower().replace(" ", "_").replace("-", "_")
    audio_type = "sfx" if req.type.lower() == "sfx" else "music"
    audio_id = f"custom_{audio_type}_{clean_slug}_{uuid.uuid4().hex[:4]}"

    new_audio = {
        "id": audio_id,
        "name": clean_name,
        "type": audio_type,
        "duration_s": 1.5 if audio_type == "sfx" else 32.0,
        "loop": audio_type == "music",
        "mood": req.mood or "cheerful",
        "description": req.description or f"Atmospheric {audio_type}: {clean_name}",
        "licence": "original"
    }

    save_custom_audio(new_audio)
    return new_audio
