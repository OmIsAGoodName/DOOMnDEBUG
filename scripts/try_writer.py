import asyncio
import sys
import time
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.app.stations.writer import write_story

async def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else "A shy owl learns to share her treehouse with a cheeky fox"
    interactive = "--interactive" in sys.argv

    print(f"Generating StoryDraft for premise: '{prompt}' (interactive={interactive})...")
    t0 = time.perf_counter()
    try:
        draft = await write_story(prompt=prompt, interactive=interactive)
        elapsed = (time.perf_counter() - t0) * 1000
        print(f"\n[SUCCESS] Generated in {elapsed:.0f} ms:")
        print(json.dumps(draft.model_dump(), indent=2))
    except Exception as e:
        elapsed = (time.perf_counter() - t0) * 1000
        print(f"\n[FAIL] Failed after {elapsed:.0f} ms: {e}")

if __name__ == "__main__":
    asyncio.run(main())
