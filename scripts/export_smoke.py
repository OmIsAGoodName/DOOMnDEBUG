import os
import sys
import time
import shutil
import subprocess
from pathlib import Path
import httpx

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

def create_tiny_webm(output_path: Path):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg not found on PATH")

    # Generate 1-second video with testsrc
    cmd = [
        ffmpeg, "-y",
        "-f", "lavfi", "-i", "testsrc=duration=1:size=320x180:rate=15",
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=22050",
        "-t", "1",
        "-c:v", "libvpx",
        "-b:v", "200k",
        "-c:a", "libvorbis",
        str(output_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def main():
    print("Testing Video Export Pipeline with tiny testsrc WebM...")
    tmp_webm = root / "media" / "test_smoke.webm"
    tmp_webm.parent.mkdir(parents=True, exist_ok=True)

    try:
        create_tiny_webm(tmp_webm)
        print(f"Created sample WebM ({tmp_webm.stat().st_size} bytes)")

        # Upload to localhost:8000
        client = httpx.Client(base_url="http://localhost:8000", timeout=10.0)

        # Check health first
        try:
            h = client.get("/api/health")
            if h.status_code != 200:
                print(f"[SKIP] Backend is not currently running on port 8000 ({h.status_code}).")
                return
        except Exception:
            print("[INFO] Backend server not running on port 8000. Testing converter directly via Python...")
            from backend.app.export.converter import convert_webm_to_mp4, export_tasks
            import asyncio

            exp_id = "smoke_direct"
            asyncio.run(convert_webm_to_mp4(
                export_id=exp_id,
                episode_id="ep_smoke",
                webm_path=tmp_webm
            ))
            res = export_tasks.get(exp_id, {})
            if res.get("status") == "done":
                print(f"[PASS] Video exported directly to {res.get('mp4_url')}")
            else:
                print(f"[FAIL] Conversion failed: {res.get('error')}")
            return

        with open(tmp_webm, "rb") as f:
            resp = client.post("/api/episodes/ep_smoke/export", files={"file": ("test.webm", f, "video/webm")})
            assert resp.status_code == 200, f"Export failed: {resp.text}"
            exp_id = resp.json()["export_id"]
            print(f"Export task created: {exp_id}")

        for _ in range(10):
            time.sleep(1.0)
            status_res = client.get(f"/api/exports/{exp_id}")
            data = status_res.json()
            if data["status"] == "done":
                print(f"[PASS] Video converted successfully: {data['mp4_url']}")
                return
            elif data["status"] == "failed":
                print(f"[FAIL] Video conversion failed: {data['error']}")
                return

        print("[TIMEOUT] Video export took longer than 10 seconds.")

    finally:
        if tmp_webm.exists():
            tmp_webm.unlink()

if __name__ == "__main__":
    main()
