import asyncio
import httpx
from backend.app.config import settings

async def test_candidate(model_id: str):
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model_id,
        "messages": [
            {"role": "user", "content": 'Respond strictly in JSON with {"model": "' + model_id + '"}'}
        ],
        "response_format": {"type": "json_object"}
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        print(f"[{model_id}] Status:", resp.status_code)
        limit_tpm = resp.headers.get("x-ratelimit-limit-tokens")
        remaining_tpm = resp.headers.get("x-ratelimit-remaining-tokens")
        print(f"[{model_id}] Tokens Limit: {limit_tpm}, Remaining: {remaining_tpm}")

async def main():
    for m in ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"]:
        await test_candidate(m)

if __name__ == "__main__":
    asyncio.run(main())
