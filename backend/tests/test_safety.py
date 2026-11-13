import pytest
from backend.app.stations.safety import check_blocklist_words, check_reading_level, evaluate_plan_safety
from backend.app.models.episode_plan import EpisodePlan, Scene, Beat, CastMember, Palette, VoiceConfig, Speech

def test_blocklist_detection():
    assert "sword" in check_blocklist_words("The pirate has a wooden sword.")
    assert "blood" in check_blocklist_words("There was blood on the floor.")
    assert len(check_blocklist_words("A cheerful bird sings in the forest.")) == 0

def test_reading_level_simple():
    res = check_reading_level("The cat sat on the mat. It was happy.", age_band="3-5")
    assert res["pass"] is True

@pytest.mark.asyncio
async def test_plan_safety_pass():
    plan = EpisodePlan(
        schema_version="1.0",
        episode_id="ep_safe",
        title="Safe Story",
        age_band="4-6",
        start_scene="sc1",
        cast=[CastMember(character_id="pip_owl", name="Pip", species="owl", palette=Palette(primary="#8b5e3c", secondary="#d9b38c", accent="#f2a65a", outline="#3b2a1e"), voice=VoiceConfig(engine_voice="en-US-AnaNeural"))],
        scenes=[Scene(scene_id="sc1", background_id="forest_day", mood="day", beats=[Beat(beat_id="b1", speech=Speech(type="NARRATE", text="Pip saw a friendly squirrel."))])]
    )
    async def fake_llm(sys, user, schema, temperature=0.2):
        return {"age_fit": 1.0, "scary": 0.0, "notes": "Wholesome and safe."}

    verdict = await evaluate_plan_safety(plan, llm_fn=fake_llm)
    assert verdict.verdict == "pass"
    assert verdict.scary == 0.0
    assert verdict.age_fit == 1.0

@pytest.mark.asyncio
async def test_plan_safety_fail_on_blocklist():
    plan = EpisodePlan(
        schema_version="1.0",
        episode_id="ep_unsafe",
        title="Unsafe Story",
        age_band="4-6",
        start_scene="sc1",
        cast=[CastMember(character_id="pip_owl", name="Pip", species="owl", palette=Palette(primary="#8b5e3c", secondary="#d9b38c", accent="#f2a65a", outline="#3b2a1e"), voice=VoiceConfig(engine_voice="en-US-AnaNeural"))],
        scenes=[Scene(scene_id="sc1", background_id="forest_day", mood="day", beats=[Beat(beat_id="b1", speech=Speech(type="NARRATE", text="A terrifying monster attacks with a bloody knife!"))])]
    )
    verdict = await evaluate_plan_safety(plan)
    assert verdict.verdict == "fail"
    assert "monster" in verdict.notes
    assert "knife" in verdict.notes
