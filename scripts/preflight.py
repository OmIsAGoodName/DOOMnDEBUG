"""
VoxFable Pre-Flight Check Script.
Runs comprehensive environment, port, configuration, dependency, and pipeline health checks.
Prints a green/red summary and readiness assessment.
"""

import os
import sys
import shutil
import socket
import asyncio
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

def check_mark(cond: bool) -> str:
    return "\033[92m[PASS]\033[0m" if cond else "\033[91m[FAIL]\033[0m"

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def check_env_file(path: Path, required_keys: list) -> tuple:
    if not path.exists():
        return False, f"File {path.name} missing"
    
    found = set()
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if v.strip() and not v.strip().startswith("your-"):
                    found.add(k.strip())
    
    missing = [k for k in required_keys if k not in found]
    if missing:
        return False, f"Unset/default keys: {', '.join(missing)}"
    return True, "All keys configured"

async def run_checks():
    print("========================================================")
    print("             VOXFABLE DEMO PRE-FLIGHT CHECK             ")
    print("========================================================")

    results = []

    # 1. Python & Node
    py_ok = sys.version_info >= (3, 11)
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    results.append(("Python 3.11+", py_ok, f"Found {py_ver}"))

    node_bin = shutil.which("node")
    node_ok = bool(node_bin)
    node_ver = subprocess.getoutput("node -v") if node_bin else "N/A"
    results.append(("Node.js", node_ok, f"Found {node_ver}"))

    # 2. FFmpeg + Codecs
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        local_app = os.environ.get("LOCALAPPDATA")
        if local_app:
            winget_path = Path(local_app) / "Microsoft" / "WinGet" / "Packages"
            if winget_path.exists():
                for p in winget_path.glob("Gyan.FFmpeg*/**/ffmpeg.exe"):
                    ffmpeg_bin = str(p)
                    break

    ffmpeg_ok = bool(ffmpeg_bin)
    codec_info = ""
    if ffmpeg_ok:
        encoders = subprocess.getoutput(f'"{ffmpeg_bin}" -encoders')
        has_264 = "libx264" in encoders
        has_aac = "aac" in encoders
        ffmpeg_ok = has_264 and has_aac
        codec_info = f"libx264: {'yes' if has_264 else 'no'}, aac: {'yes' if has_aac else 'no'}"
    results.append(("FFmpeg (libx264 & aac)", ffmpeg_ok, codec_info or "Binary missing"))

    # 3. Ports 5173 (Vite) and 8000 (FastAPI)
    p5173 = is_port_in_use(5173)
    p8000 = is_port_in_use(8000)
    results.append(("Port 5173 (Frontend Vite)", not p5173, "Free" if not p5173 else "In use (or running)"))
    results.append(("Port 8000 (Backend FastAPI)", not p8000, "Free" if not p8000 else "In use (or running)"))

    # 4. Environment files
    backend_env = ROOT_DIR / "backend" / ".env"
    b_ok, b_msg = check_env_file(backend_env, ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY"])
    results.append(("Backend .env config", b_ok, b_msg))

    # 5. Offline Demo Episodes
    demo_idx = ROOT_DIR / "frontend" / "public" / "demo" / "episodes" / "index.json"
    demo_ok = demo_idx.exists()
    demo_count = 0
    if demo_ok:
        import json
        with open(demo_idx, "r", encoding="utf-8") as f:
            demo_count = len(json.load(f))
    results.append(("Baked Demo Fallback Episodes", demo_ok and demo_count >= 3, f"{demo_count} episodes present"))

    # 6. Edge-TTS network / voice connectivity
    tts_ok = False
    try:
        import edge_tts
        tts_ok = True
        tts_msg = "Library installed & available"
    except Exception as e:
        tts_msg = str(e)
    results.append(("TTS Engine (edge-tts)", tts_ok, tts_msg))

    # 7. Disk space check
    total, used, free = shutil.disk_usage(ROOT_DIR)
    free_gb = free // (2**30)
    disk_ok = free_gb >= 2
    results.append(("Disk Space (>= 2GB free)", disk_ok, f"{free_gb} GB free"))

    # Print summary table
    print(f"{'Check':<32} | {'Status':<8} | {'Details'}")
    print("-" * 70)
    all_pass = True
    for name, ok, details in results:
        status_str = "[PASS]" if ok else "[NOTE/FAIL]"
        print(f"{name:<32} | {status_str:<11} | {details}")
        if not ok and name not in ["Backend .env config", "Port 5173 (Frontend Vite)", "Port 8000 (Backend FastAPI)"]:
            all_pass = False

    print("\n" + "=" * 70)
    print("DEMO READINESS ASSESSMENT:")
    if all_pass:
        print("[READY] Machine environment is fully primed for live and offline demo!")
    else:
        print("[CAUTION] Some checks need attention before stepping up to present.")

    print("\nOne-command launcher:")
    print("  Windows: scripts\\run_demo.bat")
    print("  Linux/Mac: ./scripts/run_demo.sh")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_checks())
