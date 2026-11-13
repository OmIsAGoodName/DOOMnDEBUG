import pytest
from backend.app.models.episode_plan import (
    EpisodePlan, Scene, Beat, CastMember, Palette, VoiceConfig,
    ActionMoveTo, ActionPlaySfx, ActionPlayMusic, ActionAttachProp, Choice, ChoiceOption, Speech
)
from backend.app.validation.validator import PlanValidator, clamp_x, clamp_y
from backend.app.validation.resolver import AssetResolver

@pytest.fixture
def base_plan():
    return EpisodePlan(
        schema_version="1.0",
        episode_id="ep_test",
        title="Test Plan",
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
                        speech=Speech(type="SPEAK", character_id="pip_owl", text="Hello world!"),
                        actions=[ActionMoveTo(type="MOVE_TO", character_id="pip_owl", to=(0.5, 0.75), duration=1.5)]
                    )
                ]
            )
        ]
    )

def test_clamp_x_bounds():
    assert clamp_x(0.0) == 0.05
    assert clamp_x(-1.0) == 0.05
    assert clamp_x(1.2) == 0.95
    assert clamp_x(0.5) == 0.5

def test_clamp_y_bounds():
    assert clamp_y(0.0) == 0.62
    assert clamp_y(0.5) == 0.62
    assert clamp_y(1.0) == 0.92
    assert clamp_y(0.75) == 0.75

def test_clean_plan_no_repairs(base_plan):
    validator = PlanValidator()
    plan, repairs = validator.validate_and_repair(base_plan)
    assert len(repairs) == 0

def test_unknown_character_in_cast(base_plan):
    validator = PlanValidator()
    base_plan.cast[0].character_id = "alien_monster"
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.cast[0].character_id == "pip_owl"
    assert any("alien_monster" in r for r in repairs)

def test_unknown_background_repaired(base_plan):
    validator = PlanValidator()
    base_plan.scenes[0].background_id = "cyberpunk_city"
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].background_id == "forest_day"
    assert any("cyberpunk_city" in r for r in repairs)

def test_dangling_start_scene(base_plan):
    validator = PlanValidator()
    base_plan.start_scene = "non_existent_scene"
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.start_scene == "sc1"
    assert any("start_scene" in r for r in repairs)

def test_dangling_next_scene(base_plan):
    validator = PlanValidator()
    base_plan.scenes[0].next_scene = "sc_ghost"
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].next_scene is None
    assert any("sc_ghost" in r for r in repairs)

def test_empty_scenes_list(base_plan):
    validator = PlanValidator()
    base_plan.scenes = []
    plan, repairs = validator.validate_and_repair(base_plan)
    assert len(plan.scenes) == 1
    assert plan.scenes[0].scene_id == "sc1"

def test_move_to_clamped_coordinates(base_plan):
    validator = PlanValidator()
    act = ActionMoveTo(type="MOVE_TO", character_id="pip_owl", to=(-0.2, 0.1), duration=1.0)
    base_plan.scenes[0].beats[0].actions = [act]
    plan, repairs = validator.validate_and_repair(base_plan)
    repaired_act = plan.scenes[0].beats[0].actions[0]
    assert repaired_act.to == (0.05, 0.62)

def test_action_negative_duration(base_plan):
    validator = PlanValidator()
    act = ActionMoveTo(type="MOVE_TO", character_id="pip_owl", to=(0.5, 0.75), duration=-5.0)
    base_plan.scenes[0].beats[0].actions = [act]
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].beats[0].actions[0].duration == 1.0
    assert any("non-positive duration" in r for r in repairs)

def test_unknown_prop_in_action(base_plan):
    validator = PlanValidator()
    act = ActionAttachProp(type="ATTACH_PROP", prop_id="laser_gun", character_id="pip_owl")
    base_plan.scenes[0].beats[0].actions = [act]
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].beats[0].actions[0].prop_id == "flower"

def test_unknown_sfx_in_action(base_plan):
    validator = PlanValidator()
    act = ActionPlaySfx(type="PLAY_SFX", sfx_id="sfx_explosion")
    base_plan.scenes[0].beats[0].actions = [act]
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].beats[0].actions[0].sfx_id == "sfx_pop"

def test_unknown_music_in_action(base_plan):
    validator = PlanValidator()
    act = ActionPlayMusic(type="PLAY_MUSIC", music_id="techno_beat")
    base_plan.scenes[0].beats[0].actions = [act]
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].beats[0].actions[0].music_id == "music_calm"

def test_choice_beat_moved_to_end(base_plan):
    validator = PlanValidator()
    choice_beat = Beat(
        beat_id="b_choice",
        choice=Choice(
            options=[ChoiceOption(id="a", label="A", next_scene="sc1")],
            default="a"
        )
    )
    normal_beat = Beat(beat_id="b_after", speech=Speech(type="NARRATE", text="Normal text"))
    base_plan.scenes[0].beats = [choice_beat, normal_beat]
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].beats[-1].beat_id == "b_choice"
    assert any("Choice was beat" in r for r in repairs)

def test_uncast_character_in_action_injected(base_plan):
    validator = PlanValidator()
    act = ActionMoveTo(type="MOVE_TO", character_id="rusty_fox", to=(0.5, 0.75), duration=1.0)
    base_plan.scenes[0].beats[0].actions = [act]
    plan, repairs = validator.validate_and_repair(base_plan)
    cast_ids = [c.character_id for c in plan.cast]
    assert "rusty_fox" in cast_ids
    assert any("Character 'rusty_fox' used in action but missing from cast" in r for r in repairs)

def test_speech_excess_words_trimmed(base_plan):
    validator = PlanValidator()
    long_text = "word " * 30
    base_plan.scenes[0].beats[0].speech.text = long_text.strip()
    plan, repairs = validator.validate_and_repair(base_plan)
    words = plan.scenes[0].beats[0].speech.text.split()
    assert len(words) <= 25
    assert any("trimmed to 24 words" in r for r in repairs)

def test_unknown_speaker_in_speech(base_plan):
    validator = PlanValidator()
    base_plan.scenes[0].beats[0].speech.character_id = "dragon"
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].beats[0].speech.character_id == "pip_owl"

def test_initial_character_placement_clamped(base_plan):
    validator = PlanValidator()
    from backend.app.models.episode_plan import PlacedCharacter
    base_plan.scenes[0].characters = [PlacedCharacter(character_id="pip_owl", position=(-0.5, 0.2))]
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].characters[0].position == (0.05, 0.62)

def test_initial_prop_placement_clamped(base_plan):
    validator = PlanValidator()
    from backend.app.models.episode_plan import PlacedProp
    base_plan.scenes[0].props = [PlacedProp(prop_id="flower", position=(1.5, 1.2))]
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].props[0].position == (0.95, 0.92)

def test_initial_unknown_prop_resolved(base_plan):
    validator = PlanValidator()
    from backend.app.models.episode_plan import PlacedProp
    base_plan.scenes[0].props = [PlacedProp(prop_id="unknown_sword", position=(0.5, 0.75))]
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].props[0].prop_id == "flower"

def test_resolver_asset_defaults():
    resolver = AssetResolver()
    assert resolver.resolve_character("dragon")[0] == "pip_owl"
    assert resolver.resolve_background("space_station")[0] == "forest_day"
    assert resolver.resolve_prop("hoverboard")[0] == "flower"
    assert resolver.resolve_sfx("sfx_bazooka")[0] == "sfx_pop"
    assert resolver.resolve_music("heavy_metal")[0] == "music_calm"

def test_resolver_existing_assets():
    resolver = AssetResolver()
    assert resolver.resolve_character("rusty_fox")[0] == "rusty_fox"
    assert resolver.resolve_background("meadow_day")[0] == "meadow_day"
    assert resolver.resolve_prop("key")[0] == "key"
    assert resolver.resolve_sfx("sfx_sparkle")[0] == "sfx_sparkle"
    assert resolver.resolve_music("music_cheerful")[0] == "music_cheerful"

def test_action_zero_duration_repaired(base_plan):
    validator = PlanValidator()
    act = ActionMoveTo(type="MOVE_TO", character_id="pip_owl", to=(0.5, 0.75), duration=0.0)
    base_plan.scenes[0].beats[0].actions = [act]
    plan, repairs = validator.validate_and_repair(base_plan)
    assert plan.scenes[0].beats[0].actions[0].duration == 1.0

def test_validate_fixtures_with_validator():
    import json
    from pathlib import Path
    fixtures_dir = Path(__file__).resolve().parent.parent.parent / "fixtures"
    for f in ["episode_quick_demo.json", "episode_live_demo.json"]:
        with open(fixtures_dir / f, "r", encoding="utf-8") as fp:
            data = json.load(fp)
        plan = EpisodePlan.model_validate(data)
        validator = PlanValidator()
        repaired_plan, repairs = validator.validate_and_repair(plan)
        assert len(repairs) == 0 # Fixtures must have zero repairs
