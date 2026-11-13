import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from backend.app.models.story_draft import StoryDraft, DraftScene, DraftBeat, DraftSpeech
from backend.app.models.episode_plan import EpisodePlan, Scene, Beat, CastMember, Palette, VoiceConfig

client = TestClient(app)

@pytest.fixture
def mock_pipeline_components():
    fake_draft = StoryDraft(
        title="Mock Pipeline Story",
        synopsis="A short story for testing.",
        cast=["pip_owl"],
        age_band="4-6",
        scenes=[
            DraftScene(
                scene_id="sc1",
                background_id="forest_day",
                mood="day",
                summary="Pip appears.",
                beats=[DraftBeat(beat_id="b1", speech=DraftSpeech(type="NARRATE", text="Pip appears."))]
            )
        ]
    )

    fake_plan = EpisodePlan(
        schema_version="1.0",
        episode_id="ep_mock_pipe",
        title="Mock Pipeline Story",
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
                background_id="forest_day",
                mood="day",
                beats=[
                    Beat(
                        beat_id="b1",
                        speech={"type": "NARRATE", "text": "Pip appears."},
                        actions=[{"type": "SET_CAMERA", "shot": "wide", "movement": "static"}]
                    )
                ]
            )
        ]
    )

    with patch("backend.app.pipeline.write_story", return_value=fake_draft), \
         patch("backend.app.pipeline.direct_episode", return_value=fake_plan):
        yield

def test_pipeline_api_flow(mock_pipeline_components):
    settings.DEMO_MODE = True
    import os
    os.environ["SKIP_TTS"] = "true"

    # 1. Create Generation
    res = client.post("/api/generations", json={"kind": "quick", "prompt": "Pip explores"})
    assert res.status_code == 200
    gen_id = res.json()["generation_id"]
    assert gen_id is not None

    # 2. Check Generation status
    res_status = client.get(f"/api/generations/{gen_id}")
    assert res_status.status_code == 200
    data = res_status.json()
    assert data["id"] == gen_id
