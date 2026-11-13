import re
import json
import asyncio
from typing import Union, Type, Dict, Any, Optional
from pydantic import BaseModel, ValidationError
import jsonschema

from ..config import settings
from .cache import cache
from .rate_limiter import semaphore, rate_limiter
from .providers import GeminiProvider, GroqProvider, OllamaProvider, BaseProvider

def clean_json_string(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
    return cleaned.strip()

def validate_schema(data: Dict[str, Any], schema: Union[Dict[str, Any], Type[BaseModel]]) -> Dict[str, Any]:
    if isinstance(schema, type) and issubclass(schema, BaseModel):
        validated = schema.model_validate(data)
        return validated.model_dump()
    elif isinstance(schema, dict):
        jsonschema.validate(instance=data, schema=schema)
        return data
    return data

class LLMAdapter:
    def __init__(self):
        self.providers: Dict[str, BaseProvider] = {
            "gemini": GeminiProvider(),
            "groq": GroqProvider(),
            "ollama": OllamaProvider()
        }

    async def generate_json(
        self,
        system: str,
        user: str,
        schema: Union[Dict[str, Any], Type[BaseModel]],
        temperature: float = 0.7,
        max_retries: int = 2,
        bypass_cache: bool = False
    ) -> Dict[str, Any]:
        schema_name = schema.__name__ if isinstance(schema, type) else "json_schema"

        # Check Cache
        if not bypass_cache:
            cached_result = cache.get(system, user, schema_name, temperature)
            if cached_result is not None:
                return cached_result

        provider_order = [p.strip().lower() for p in settings.LLM_PROVIDER_ORDER.split(",") if p.strip()]
        last_error = None

        for provider_name in provider_order:
            provider = self.providers.get(provider_name)
            if not provider:
                continue

            current_user_prompt = user
            for attempt in range(max_retries + 1):
                try:
                    await rate_limiter.acquire()
                    async with semaphore:
                        raw_output = await provider.call(system, current_user_prompt, temperature)

                    cleaned = clean_json_string(raw_output)
                    parsed_json = json.loads(cleaned)
                    validated_dict = validate_schema(parsed_json, schema)

                    # Success: Cache and Return
                    cache.set(system, user, schema_name, temperature, validated_dict)
                    return validated_dict

                except (ValidationError, jsonschema.ValidationError, json.JSONDecodeError) as ve:
                    last_error = ve
                    # Feed validation error back into the prompt for the next attempt
                    current_user_prompt = f"{user}\n\n[PREVIOUS ATTEMPT FAILED WITH PARSING/SCHEMA ERROR]: {str(ve)}\nPlease output strictly valid JSON conforming to the requirements."
                    await asyncio.sleep(0.5 * (2 ** attempt))

                except Exception as e:
                    last_error = e
                    # Backoff on rate-limits (429) or server errors
                    err_msg = str(e)
                    if "429" in err_msg or "500" in err_msg or "503" in err_msg:
                        match = re.search(r"try again in (\d+\.?\d*)s", err_msg)
                        wait_time = float(match.group(1)) + 0.5 if match else 2.5 * (2 ** attempt)
                        await asyncio.sleep(wait_time)
                    else:
                        break # Unrecoverable provider error, switch provider

        raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")

llm_adapter = LLMAdapter()

async def generate_json(
    system: str,
    user: str,
    schema: Union[Dict[str, Any], Type[BaseModel]],
    temperature: float = 0.7,
    max_retries: int = 2,
    bypass_cache: bool = False
) -> Dict[str, Any]:
    return await llm_adapter.generate_json(
        system=system,
        user=user,
        schema=schema,
        temperature=temperature,
        max_retries=max_retries,
        bypass_cache=bypass_cache
    )
