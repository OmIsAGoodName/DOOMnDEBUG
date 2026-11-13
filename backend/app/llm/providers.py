import abc
import json
import httpx
from typing import Optional, Dict, Any
from ..config import settings

class BaseProvider(abc.ABC):
    @abc.abstractmethod
    async def call(self, system: str, user: str, temperature: float) -> str:
        """Returns raw text or JSON string from the model."""
        pass

class GeminiProvider(BaseProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL

    async def call(self, system: str, user: str, temperature: float) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not configured")

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

        async with httpx.AsyncClient(timeout=30.0) as client:
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

        payload = {
            "model": self.model,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": temperature
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 429:
                raise RuntimeError(f"Groq Rate Limit (429): {resp.text}")
            if resp.status_code != 200:
                raise RuntimeError(f"Groq Error ({resp.status_code}): {resp.text}")
            resp.raise_for_status()

            data = resp.json()
            choices = data.get("choices", [])
            if not choices:
                raise ValueError(f"No choices returned by Groq: {data}")
            return choices[0].get("message", {}).get("content", "")

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
