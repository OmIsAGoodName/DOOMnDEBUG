import abc
import datetime
import json
import httpx
from typing import Optional, Dict, Any, List
from ..config import settings

PROVIDER_STATS: Dict[str, Any] = {
    "groq": {
        "calls": 0,
        "successes": 0,
        "rate_limits": 0,
        "errors": 0,
        "last_status": "idle",
        "last_model_used": None,
        "last_error": None,
        "last_error_time": None,
        "needs_new_key": False
    },
    "gemini": {
        "calls": 0,
        "successes": 0,
        "rate_limits": 0,
        "errors": 0,
        "last_status": "idle",
        "last_error": None,
        "last_error_time": None,
        "needs_new_key": False
    }
}

class BaseProvider(abc.ABC):
    @abc.abstractmethod
    async def call(self, system: str, user: str, temperature: float) -> str:
        """Returns raw text or JSON string from the model."""
        pass

    def is_configured(self) -> bool:
        return True

class GeminiProvider(BaseProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key and "your-gemini" not in self.api_key.lower())

    async def call(self, system: str, user: str, temperature: float) -> str:
        if not self.api_key or "your-gemini" in self.api_key.lower():
            raise ValueError("GEMINI_API_KEY not configured or placeholder")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": user}]}
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": temperature
            }
        }
        if system:
            payload["systemInstruction"] = {
                "parts": [{"text": system}]
            }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 429:
                raise RuntimeError(f"Gemini Rate Limit (429): {resp.text}")
            if resp.status_code >= 500:
                raise RuntimeError(f"Gemini Server Error ({resp.status_code}): {resp.text}")
            resp.raise_for_status()

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError(f"No candidates returned by Gemini: {data}")
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise ValueError(f"Empty parts returned by Gemini: {candidates[0]}")
            return parts[0].get("text", "")

class GroqProvider(BaseProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key and "your-groq" not in self.api_key.lower())

    async def call(self, system: str, user: str, temperature: float) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not configured")

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        messages = []
        combined_text = (system or "") + " " + user
        user_content = user
        if "json" not in combined_text.lower():
            user_content = f"{user}\n\nRespond strictly with valid JSON."

        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": user_content})

        PROVIDER_STATS["groq"]["calls"] += 1

        # Priority order: premier flagship models first, failing over to lighter models if rate limited
        candidate_priority = [
            "openai/gpt-oss-120b",
            "llama-3.3-70b-versatile",
            "openai/gpt-oss-20b",
            "llama-3.1-8b-instant"
        ]
        models_to_try = []
        if self.model and self.model in candidate_priority:
            models_to_try.append(self.model)
        for c in candidate_priority:
            if c not in models_to_try:
                models_to_try.append(c)

        last_err = None
        async with httpx.AsyncClient(timeout=60.0) as client:
            for model_name in models_to_try:
                payload = {
                    "model": model_name,
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                    "temperature": temperature,
                    "max_tokens": 1500
                }
                try:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 429:
                        PROVIDER_STATS["groq"]["rate_limits"] += 1
                        PROVIDER_STATS["groq"]["last_status"] = "rate_limited"
                        PROVIDER_STATS["groq"]["last_error"] = f"Rate limit on `{model_name}`: {resp.text}"
                        PROVIDER_STATS["groq"]["last_error_time"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                        last_err = RuntimeError(f"Groq Rate Limit (429) on model `{model_name}`: {resp.text}")
                        continue
                    if resp.status_code != 200:
                        PROVIDER_STATS["groq"]["errors"] += 1
                        PROVIDER_STATS["groq"]["last_status"] = "error"
                        PROVIDER_STATS["groq"]["last_error"] = f"Error ({resp.status_code}) on `{model_name}`: {resp.text}"
                        PROVIDER_STATS["groq"]["last_error_time"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                        last_err = RuntimeError(f"Groq Error ({resp.status_code}) on model `{model_name}`: {resp.text}")
                        continue

                    data = resp.json()
                    choices = data.get("choices", [])
                    if not choices:
                        last_err = ValueError(f"No choices returned by Groq for `{model_name}`: {data}")
                        continue

                    # Success!
                    PROVIDER_STATS["groq"]["successes"] += 1
                    PROVIDER_STATS["groq"]["last_status"] = "healthy"
                    PROVIDER_STATS["groq"]["last_model_used"] = model_name
                    PROVIDER_STATS["groq"]["needs_new_key"] = False
                    return choices[0].get("message", {}).get("content", "")
                except (httpx.TimeoutException, httpx.NetworkError) as net_err:
                    last_err = net_err
                    continue

        PROVIDER_STATS["groq"]["needs_new_key"] = True
        if last_err:
            raise last_err
        raise RuntimeError("All Groq candidate models failed.")

class OllamaProvider(BaseProvider):
    def __init__(self, url: Optional[str] = None, model: Optional[str] = None):
        self.url = (url or settings.OLLAMA_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL

    async def call(self, system: str, user: str, temperature: float) -> str:
        endpoint = f"{self.url}/api/chat"
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": user})

        payload = {
            "model": self.model,
            "messages": messages,
            "format": "json",
            "stream": False,
            "options": {"temperature": temperature}
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(endpoint, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "")
