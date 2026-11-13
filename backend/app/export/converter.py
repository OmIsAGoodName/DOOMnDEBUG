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

def get_ffmpeg_binary() -> str:
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        local_app = os.environ.get("LOCALAPPDATA")
        if local_app:
            winget_path = Path(local_app) / "Microsoft" / "WinGet" / "Packages"
            if winget_path.exists():
                for p in winget_path.glob("Gyan.FFmpeg*/**/ffmpeg.exe"):
                    ffmpeg_bin = str(p)
                    break
    if not ffmpeg_bin:
        raise RuntimeError("ffmpeg executable not found on system PATH")
    return os.path.normpath(ffmpeg_bin)

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
        ffmpeg_bin = get_ffmpeg_binary()

        # Standardized 720p H.264 + AAC MP4 conversion
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

        def run_conversion():
            return subprocess.run(cmd, capture_output=True)

        # Use asyncio.to_thread for universal Windows SelectorEventLoop / ProactorEventLoop compatibility
        result = await asyncio.to_thread(run_conversion)

        if result.returncode != 0:
            err_text = result.stderr.decode(errors="ignore")[-400:]
            raise RuntimeError(f"FFmpeg conversion failed (code {result.returncode}): {err_text}")

        # Success: update repository and task status
        repo = get_repository()
        await repo.update_episode(owner_id, episode_id, {"video_path": mp4_url})

        export_tasks[export_id] = {
            "status": "done",
            "mp4_url": mp4_url,
            "error": None
        }

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[CONVERTER ERROR] {tb}", flush=True)
        export_tasks[export_id] = {
            "status": "failed",
            "mp4_url": None,
            "error": f"{type(e).__name__}: {str(e)}"
        }
    finally:
        # Clean up temporary uploaded WebM file
        try:
            if webm_path.exists():
                webm_path.unlink()
        except Exception:
            pass
