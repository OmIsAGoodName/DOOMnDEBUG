import pytest
from backend.app.models.episode_plan import EpisodePlan, Scene, Beat, CastMember, Palette, VoiceConfig, Speech
from backend.app.stations.continuity import check_and_fix_continuity

@pytest.mark.asyncio
async def test_continuity_pip_night_flying_fixed():
    plan = EpisodePlan(
        schema_version="1.0",
        episode_id="ep_cont_test",
        title="Night Adventure",
        age_band="4-6",
        start_scene="sc1",
        cast=[
            CastMember(
                character_id="pip_owl",
                name="Pip",
                species="owl",
                palette=Palette(primary="#8b5e3c", secondary="#d9b38c", accent="#f2a65a", outline="#3b2a1e"),
                voice=VoiceConfig(engine_voice="en-US-AnaNeural")
            )
        ],
        scenes=[
            Scene(
                scene_id="sc1",
                background_id="forest_night",
                mood="night",
                beats=[
                    Beat(
                        beat_id="b1",
                        speech=Speech(type="SPEAK", character_id="pip_owl", text="I will fly through the starry trees!")
                    )
                ]
            )
        ]
    )

    bibles = {
        "pip_owl": {
            "rules": ["Pip never flies at night because her eyes are sensitive."]
        }
    }

    repaired_plan = await check_and_fix_continuity(plan, bibles=bibles)
    # Speech text should have been rewritten
    assert "fly" not in repaired_plan.scenes[0].beats[0].speech.text
    assert "walk" in repaired_plan.scenes[0].beats[0].speech.text
    assert len(repaired_plan.continuity.violations) == 1
    assert "FIXED" in repaired_plan.continuity.violations[0]
