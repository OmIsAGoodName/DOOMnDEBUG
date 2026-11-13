import pytest
from backend.app.live.matcher import match_transcript, MatchOption

@pytest.fixture
def sample_options():
    return [
        MatchOption(id="a", label="Follow the firefly", keywords=["firefly", "follow", "fly"]),
        MatchOption(id="b", label="Open the door", keywords=["door", "open", "enter"])
    ]

@pytest.mark.asyncio
async def test_live_match_door_transcript(sample_options):
    res = await match_transcript(
        prompt="Should I follow the firefly or open the door?",
        options=sample_options,
        transcript="the door!"
    )
    assert res.option_id == "b"
    assert res.method == "keyword"

@pytest.mark.asyncio
async def test_live_match_follow_fly_transcript(sample_options):
    res = await match_transcript(
        prompt="Should I follow the firefly or open the door?",
        options=sample_options,
        transcript="ummm follow the fly thing"
    )
    assert res.option_id == "a"
    assert res.method == "keyword"

@pytest.mark.asyncio
async def test_live_match_unrelated_fallback(sample_options):
    # Unrelated input falls back to default option
    async def fake_llm(sys, user, schema, temperature=0.1):
        return {"option_id": None, "confidence": 0.0}

    res = await match_transcript(
        prompt="Should I follow the firefly or open the door?",
        options=sample_options,
        transcript="i like pizza and cats",
        llm_fn=fake_llm
    )
    assert res.option_id == "a" # default
    assert res.method == "default"
