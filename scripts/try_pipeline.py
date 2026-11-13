import asyncio
import sys
import uuid
import time
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.app.pipeline import run_quick_story_pipeline

async def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else "A shy owl learns to share her cozy treehouse with a cheeky fox"
    interactive = "--interactive" in sys.argv
    gen_id = f"gen_smoke_{uuid.uuid4().hex[:6]}"

    print(f"=== VoxFable Pipeline Run ===")
    print(f"Generation ID: {gen_id}")
    print(f"Premise: '{prompt}'")
    print(f"Interactive: {interactive}\n")

    t0 = time.perf_counter()
    try:
        episode_id = await run_quick_story_pipeline(
            generation_id=gen_id,
            owner_id="demo",
            prompt=prompt,
            interactive=interactive
        )
        total_sec = time.perf_counter() - t0
        print(f"\n[PIPELINE SUCCESS] Finished in {total_sec:.2f}s!")
        print(f"Episode ID created: {episode_id}")
    except Exception as e:
        total_sec = time.perf_counter() - t0
        print(f"\n[PIPELINE FAILED] Failed after {total_sec:.2f}s: {e}")

if __name__ == "__main__":
    asyncio.run(main())
