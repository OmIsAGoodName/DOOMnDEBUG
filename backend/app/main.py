import os
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .config import settings
from .auth import get_current_user
from .repositories import get_repository, Repository

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
    ffmpeg_available = shutil.which("ffmpeg") is not None
    supabase_configured = bool(settings.SUPABASE_URL and settings.SUPABASE_SECRET_KEY)
    mode = "demo" if settings.DEMO_MODE else "online"

    # LLM identifier
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

# --- Request / Response Models ---
class GenerationCreateRequest(BaseModel):
    kind: str = "quick" # "quick" | "batch"
    prompt: Optional[str] = None
    series: Optional[Dict[str, Any]] = None
    characters: Optional[List[Dict[str, Any]]] = None
    count: Optional[int] = 1
    age_band: Optional[str] = "4-6"
    language: Optional[str] = "en"
    interactive: Optional[bool] = False

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
    return {"generation_id": created["id"], "status": created["status"]}

@app.get("/api/generations/{generation_id}")
async def get_generation(
    generation_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    repo: Repository = Depends(get_repository)
):
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
