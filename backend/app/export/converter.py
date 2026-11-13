import os
import shutil
import asyncio
import uuid
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from ..config import settings
from ..repositories import get_repository

export_tasks: Dict[str, Dict[str, Any]] = {}

def get_export_dirs() -> Tuple[Path, Path]:
    media_dir = Path(settings.MEDIA_DIR)
    exports_dir = media_dir / "exports"
    tmp_dir = exports_dir / "tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    return exports_dir, tmp_dir

async def convert_webm_to_mp4(
    export_id: str,
    episode_id: str,
    webm_path: Path,
    owner_id: str = "demo"
):
    exports_dir, tmp_dir = get_export_dirs()
    mp4_filename = f"{episode_id}_{export_id[:8]}.mp4"
    mp4_path = exports_dir / mp4_filename
    mp4_url = f"/media/exports/{mp4_filename}"

    export_tasks[export_id] = {
        "status": "running",
        "mp4_url": None,
        "error": None
    }

    try:
        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            raise RuntimeError("ffmpeg executable not found on system PATH")

        # FFmpeg conversion arguments
        cmd = [
            ffmpeg_bin,
            "-y",
            "-i", str(webm_path),
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
            str(mp4_path)
        ]

        # Execute conversion in a worker thread / subshell
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            err_text = stderr.decode(errors="ignore")[-400:]
            raise RuntimeError(f"FFmpeg conversion failed: {err_text}")

        # Success: update repository and task status
        repo = get_repository()
        await repo.update_episode(owner_id, episode_id, {"video_path": mp4_url})

        export_tasks[export_id] = {
            "status": "done",
            "mp4_url": mp4_url,
            "error": None
        }

    except Exception as e:
        export_tasks[export_id] = {
            "status": "failed",
            "mp4_url": None,
            "error": str(e)
        }
    finally:
        # Clean up temporary uploaded WebM file
        try:
            if webm_path.exists():
                webm_path.unlink()
        except Exception:
            pass
