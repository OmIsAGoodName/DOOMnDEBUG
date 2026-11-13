import asyncio
import sys
import time
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.app.tts.synthesizer import synthesize_line

async def main():
    print("Testing Edge-TTS synthesis...")
    lines = [
        ("In the sleepy forest, Pip found a glowing door.", "en-US-AnaNeural"),
        ("Look at my kite soar high up in the blue sky!", "en-US-GuyNeural")
    ]

    for idx, (text, voice) in enumerate(lines, 1):
        t0 = time.perf_counter()
        try:
            path, duration_ms, words = await synthesize_line(text, voice)
            elapsed = (time.perf_counter() - t0) * 1000
            print(f"Line {idx} ({voice}): PASS ({elapsed:.0f} ms)")
            print(f"  File: {path}")
            print(f"  Duration: {duration_ms} ms ({duration_ms/1000:.2f}s)")
            print(f"  Words tracked: {len(words)}")
        except Exception as e:
            elapsed = (time.perf_counter() - t0) * 1000
            print(f"Line {idx} ({voice}): FAIL ({elapsed:.0f} ms) - {e}")

if __name__ == "__main__":
    asyncio.run(main())
