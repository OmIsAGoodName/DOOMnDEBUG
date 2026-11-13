import pytest
from backend.app.models.story_draft import StoryDraft, DraftScene, DraftBeat, DraftSpeech
from backend.app.stations.director import direct_episode
from backend.app.models.episode_plan import EpisodePlan

@pytest.mark.asyncio
async def test_director_with_fake_llm():
    draft = StoryDraft(
        title="Fox Lost a Kite",
        synopsis="Rusty the fox loses a kite and Pip helps him retrieve it.",
        cast=["pip_owl", "rusty_fox"],
        age_band="4-6",
        interactive=False,
        scenes=[
            DraftScene(
                scene_id="sc1",
                background_id="meadow_day",
                mood="day",
                summary="Rusty runs across meadow with kite.",
                beats=[
                    DraftBeat(
                        beat_id="b1",
                        speech=DraftSpeech(type="SPEAK", character_id="rusty_fox", text="Look at my kite soar!")
                    )
                ]
            ),
            DraftScene(
                scene_id="sc2",
                background_id="forest_day",
                mood="day",
                summary="Kite is stuck in a branch.",
                beats=[
                    DraftBeat(
                        beat_id="b1",
                        speech=DraftSpeech(type="SPEAK", character_id="pip_owl", text="I can fly up and get it.")
                    )
                ]
            )
        ]
    )

    async def fake_scene_llm(system: str, user: str, schema, temperature=0.7):
        # Determine which scene from user prompt
        sc_id = "sc1" if "sc1" in user else "sc2"
        bg_id = "meadow_day" if sc_id == "sc1" else "forest_day"
        return {
            "scene_id": sc_id,
            "background_id": bg_id,
            "mood": "day",
            "next_scene": "sc2" if sc_id == "sc1" else None,
            "props": [{"prop_id": "kite", "position": [0.6, 0.7]}],
            "characters": [{"character_id": "rusty_fox", "position": [0.3, 0.75]}],
            "beats": [
                {
                    "beat_id": "b1",
                    "speech": {"type": "SPEAK", "character_id": "rusty_fox", "text": "Look at my kite soar!"},
                    "actions": [
                        {"type": "SET_CAMERA", "shot": "wide", "movement": "static"},
                        {"type": "PLAY_SFX", "sfx_id": "sfx_whoosh"}
                    ]
                }
            ]
        }

    plan = await direct_episode(draft, llm_fn=fake_scene_llm)
    assert isinstance(plan, EpisodePlan)
    assert plan.title == "Fox Lost a Kite"
    assert len(plan.scenes) == 2
    assert plan.scenes[0].scene_id == "sc1"
    assert plan.scenes[1].scene_id == "sc2"
    assert len(plan.cast) == 2
    assert plan.cast[0].character_id == "pip_owl"
    assert plan.cast[1].character_id == "rusty_fox"
