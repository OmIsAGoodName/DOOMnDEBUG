import asyncio
import time
import sys
from pathlib import Path
from pydantic import BaseModel
from dotenv import dotenv_values

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.app.config import settings
from backend.app.llm.providers import GeminiProvider, GroqProvider, OllamaProvider
from backend.app.llm.adapter import clean_json_string, validate_schema

class SmokeResponse(BaseModel):
    ok: bool
    word: str

async def test_provider(name: str, provider):
    print(f"\n--- Testing Provider: {name} ---")
    system = "You are a fast JSON test assistant. Always output strict JSON."
    user = 'Respond with JSON in this exact shape: {"ok": true, "word": "sunshine"}'

    latencies = []
    successes = 0

    for i in range(5):
        t0 = time.perf_counter()
        try:
            raw = await provider.call(system, user, temperature=0.2)
            cleaned = clean_json_string(raw)
            import json
            data = json.loads(cleaned)
            validate_schema(data, SmokeResponse)
            latency = (time.perf_counter() - t0) * 1000
            latencies.append(latency)
            successes += 1
            print(f"  Call {i+1}: PASS ({latency:.0f} ms, word='{data.get('word')}')")
        except Exception as e:
            latency = (time.perf_counter() - t0) * 1000
            print(f"  Call {i+1}: FAIL ({latency:.0f} ms) - {e}")

    avg_lat = sum(latencies) / len(latencies) if latencies else 0.0
    print(f"Result for {name}: {successes}/5 successful (Avg Latency: {avg_lat:.0f} ms)")
    return successes > 0

async def main():
    providers = {
        "gemini": GeminiProvider(),
        "groq": GroqProvider(),
        "ollama": OllamaProvider()
    }

    results = {}
    for name, prov in providers.items():
        try:
            ok = await test_provider(name, prov)
            results[name] = "PASS" if ok else "FAIL"
        except Exception as e:
            results[name] = f"SKIPPED ({e})"

    print("\n===============================")
    print("LLM Smoke Test Summary:")
    for name, res in results.items():
        print(f"  {name}: {res}")
    print("===============================")

if __name__ == "__main__":
    asyncio.run(main())
