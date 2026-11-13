import pytest
from pydantic import BaseModel
from backend.app.llm.adapter import LLMAdapter
from backend.app.llm.providers import BaseProvider
from backend.app.config import settings

class SimpleModel(BaseModel):
    message: str
    code: int

class FlakyProvider(BaseProvider):
    def __init__(self):
        self.attempts = 0

    async def call(self, system: str, user: str, temperature: float) -> str:
        self.attempts += 1
        if self.attempts == 1:
            # First attempt returns invalid schema (missing code field)
            return '{"message": "hello"}'
        # Second attempt succeeds
        return '{"message": "hello", "code": 200}'

class BrokenProvider(BaseProvider):
    async def call(self, system: str, user: str, temperature: float) -> str:
        raise RuntimeError("Provider connection failed")

class WorkingProvider(BaseProvider):
    async def call(self, system: str, user: str, temperature: float) -> str:
        return '```json\n{"message": "fallback success", "code": 42}\n```'

@pytest.mark.asyncio
async def test_retry_on_schema_error():
    adapter = LLMAdapter()
    flaky = FlakyProvider()
    adapter.providers = {"flaky": flaky}
    settings.LLM_PROVIDER_ORDER = "flaky"

    result = await adapter.generate_json(
        system="system prompt",
        user="user request",
        schema=SimpleModel,
        bypass_cache=True
    )
    assert result["message"] == "hello"
    assert result["code"] == 200
    assert flaky.attempts == 2

@pytest.mark.asyncio
async def test_provider_fallback():
    adapter = LLMAdapter()
    adapter.providers = {
        "broken": BrokenProvider(),
        "backup": WorkingProvider()
    }
    settings.LLM_PROVIDER_ORDER = "broken,backup"

    result = await adapter.generate_json(
        system="test system",
        user="test user",
        schema=SimpleModel,
        bypass_cache=True
    )
    assert result["message"] == "fallback success"
    assert result["code"] == 42

@pytest.mark.asyncio
async def test_llm_cache():
    adapter = LLMAdapter()
    working = WorkingProvider()
    adapter.providers = {"working": working}
    settings.LLM_PROVIDER_ORDER = "working"

    # First call - cache miss
    res1 = await adapter.generate_json(
        system="cache test sys",
        user="cache test user",
        schema=SimpleModel,
        bypass_cache=False
    )
    # Second call - should hit cache
    res2 = await adapter.generate_json(
        system="cache test sys",
        user="cache test user",
        schema=SimpleModel,
        bypass_cache=False
    )
    assert res1 == res2
    assert res1["code"] == 42
