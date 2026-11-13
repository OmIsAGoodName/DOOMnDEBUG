import pytest
from backend.app.stations.writer import build_writer_user_prompt, write_story
from backend.app.models.story_draft import StoryDraft

def test_prompt_assembly_golden():
    premise = "A curious kid finds a shining lantern"
    user_prompt = build_writer_user_prompt(
        prompt=premise,
        age_band="4-6",
        language="en",
        interactive=True
    )
    # Check that golden elements are present in the assembled prompt
    assert premise in user_prompt
    assert "pip_owl" in user_prompt
    assert "forest_day" in user_prompt
    assert "Interactive: YES" in user_prompt
    assert "< 25 words" in user_prompt

@pytest.mark.asyncio
async def test_writer_with_fake_llm():
    async def fake_llm(system: str, user: str, schema, temperature=0.7):
        return {
            "title": "Pip's Treehouse Guest",
            "synopsis": "Pip the shy owl learns to share her cozy treehouse with Rusty the fox.",
            "cast": ["pip_owl", "rusty_fox"],
            "age_band": "4-6",
            "language": "en",
            "interactive": False,
            "main_path": ["sc1", "sc2", "sc3"],
            "scenes": [
                {
                    "scene_id": "sc1",
                    "background_id": "forest_day",
                    "mood": "day",
                    "summary": "Pip is reading quietly in her treehouse.",
                    "beats": [
                        {
                            "beat_id": "b1",
                            "speech": {
                                "type": "NARRATE",
                                "text": "Pip loved reading all alone in the high branches."
                            }
                        }
                    ]
                },
                {
                    "scene_id": "sc2",
                    "background_id": "treehouse_interior",
                    "mood": "cozy",
                    "summary": "Rusty knocks and asks to read together.",
                    "beats": [
                        {
                            "beat_id": "b1",
                            "speech": {
                                "type": "SPEAK",
                                "character_id": "rusty_fox",
                                "text": "Knock knock! Can I look at the picture book too?"
                            }
                        }
                    ]
                },
                {
                    "scene_id": "sc3",
                    "background_id": "treehouse_interior",
                    "mood": "sunset",
                    "summary": "They share the book joyfully.",
                    "beats": [
                        {
                            "beat_id": "b1",
                            "speech": {
                                "type": "SPEAK",
                                "character_id": "pip_owl",
                                "text": "Yes! Reading together is even more fun."
                            }
                        }
                    ]
                }
            ]
        }

    draft = await write_story("Pip shares her treehouse", llm_fn=fake_llm)
    assert isinstance(draft, StoryDraft)
    assert draft.title == "Pip's Treehouse Guest"
    assert len(draft.scenes) == 3
    assert draft.cast == ["pip_owl", "rusty_fox"]
    # Check speech length rule
    for scene in draft.scenes:
        for beat in scene.beats:
            word_count = len(beat.speech.text.split())
            assert word_count < 25
