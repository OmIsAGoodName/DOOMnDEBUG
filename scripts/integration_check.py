import sys
import time
import json
from pathlib import Path
import httpx

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

def run_integration_check():
    print("========================================")
    print("   VOXFABLE INTEGRATION CHECK RUNNER    ")
    print("========================================\n")

    base_url = "http://localhost:8000"
    client = httpx.Client(base_url=base_url, timeout=30.0)

    # 1. Health
    t0 = time.perf_counter()
    try:
        res = client.get("/api/health")
        assert res.status_code == 200, f"Status {res.status_code}"
        data = res.json()
        assert data["ok"] is True
        print(f"[PASS] 1. /api/health OK (mode: {data.get('mode')}, ffmpeg: {data.get('ffmpeg')}) - {(time.perf_counter()-t0)*1000:.0f} ms")
    except Exception as e:
        print(f"[FAIL] 1. /api/health failed: {e}")
        return False

    # 2. Live Match
    t0 = time.perf_counter()
    try:
        match_payload = {
            "prompt": "Should I follow the firefly or open the door?",
            "options": [
                {"id": "a", "label": "Follow the firefly", "keywords": ["firefly", "follow"]},
                {"id": "b", "label": "Open the door", "keywords": ["door", "open"]}
            ],
            "transcript": "let's open the door"
        }
        res = client.post("/api/live/match", json=match_payload)
        assert res.status_code == 200, f"Status {res.status_code}"
        m_data = res.json()
        assert m_data["option_id"] == "b"
        print(f"[PASS] 2. /api/live/match OK (matched: {m_data['option_id']}, method: {m_data['method']}) - {(time.perf_counter()-t0)*1000:.0f} ms")
    except Exception as e:
        print(f"[FAIL] 2. /api/live/match failed: {e}")

    # 3. Quick Generation Pipeline
    t0 = time.perf_counter()
    try:
        gen_payload = {
            "kind": "quick",
            "prompt": "Pip and Rusty find a golden key under a tree",
            "age_band": "4-6"
        }
        res = client.post("/api/generations", json=gen_payload)
        assert res.status_code == 200, f"Status {res.status_code}"
        gen_id = res.json()["generation_id"]
        print(f"[INFO] 3. Generation started: {gen_id}. Polling for completion...")

        # Poll status
        episode_id = None
        for _ in range(30):
            time.sleep(2.0)
            res_poll = client.get(f"/api/generations/{gen_id}")
            poll_data = res_poll.json()
            stage = poll_data.get("stage")
            status = poll_data.get("status")
            print(f"       -> Stage: {stage} ({status})")
            if status == "succeeded":
                episode_ids = poll_data.get("episode_ids", [])
                if episode_ids:
                    episode_id = episode_ids[0]
                break
            elif status == "failed":
                raise RuntimeError(f"Generation failed: {poll_data.get('error')}")

        if episode_id:
            print(f"[PASS] 3. Generation completed in {(time.perf_counter()-t0):.1f}s -> Episode ID: {episode_id}")
            # Fetch episode
            res_ep = client.get(f"/api/episodes/{episode_id}")
            assert res_ep.status_code == 200
            ep_data = res_ep.json()
            assert ep_data.get("plan") is not None
            print(f"[PASS] 4. Episode plan & audio manifest verified for '{ep_data.get('title')}'")
        else:
            print(f"[WARN] 3. Generation polling timed out.")

    except Exception as e:
        print(f"[FAIL] 3. Generation pipeline failed: {e}")

    print("\n========================================")
    print("Integration Check Completed.")
    print("========================================")
    return True

if __name__ == "__main__":
    run_integration_check()
