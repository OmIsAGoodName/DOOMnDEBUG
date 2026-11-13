import asyncio
import json
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..models.story_draft import StoryDraft, DraftScene
from ..models.episode_plan import EpisodePlan, Scene, CastMember, Palette, VoiceConfig
from ..stations.writer import load_metadata
from ..llm.adapter import generate_json

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
CONTRACTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "contracts"

def load_director_system_prompt() -> str:
    path = PROMPTS_DIR / "director.md"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return "You are the Animation Director for VoxFable. Output valid Scene JSON."

def load_vocab() -> Dict[str, Any]:
    vocab_path = CONTRACTS_DIR / "vocab.json"
    if vocab_path.exists():
        try:
            with open(vocab_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def build_director_scene_prompt(
    draft_scene: DraftScene,
    cast_ids: List[str],
    metadata: Dict[str, Any]
) -> str:
    avail_props = [p["id"] for p in metadata.get("props", [])]
    avail_sfx = [s["id"] for s in metadata.get("sfx", [])]
    avail_music = [m["id"] for m in metadata.get("music", [])]

    return f"""
DIRECT THIS SCENE:
Draft Scene:
{json.dumps(draft_scene.model_dump(), indent=2)}

Scene Cast: {', '.join(cast_ids)}
Available Props: {', '.join(avail_props)}
Available SFX: {', '.join(avail_sfx)}
Available Music: {', '.join(avail_music)}

DIRECTING INSTRUCTIONS:
1. Direct EVERY beat in the draft scene into a rich 2D Canvas Scene JSON adhering to the Directing Rules.
2. Opening beat MUST have a SET_CAMERA action.
3. Characters must move, animate, and emote: use MOVE_TO, PLAY_ANIMATION (hop, wave, talk, nod, jump), and SET_EXPRESSION.
4. Set min_duration for each beat to 5.0 to 7.0 seconds so character speech, reactions, and sound effects have ample breathing room.
5. Add PLAY_SFX and PLAY_MUSIC to create a warm, cinematic storybook atmosphere.
"""

async def direct_scene(
    draft_scene: DraftScene,
    cast_ids: List[str],
    metadata: Dict[str, Any],
    llm_fn = generate_json
) -> Scene:
    system_prompt = load_director_system_prompt()
    user_prompt = build_director_scene_prompt(draft_scene, cast_ids, metadata)

    data = await llm_fn(
        system=system_prompt,
        user=user_prompt,
        schema=Scene,
        temperature=0.7
    )
    scene = Scene.model_validate(data)

    # Ensure beats have healthy duration breathing room
    for beat in scene.beats:
        words_count = len(beat.speech.text.split()) if beat.speech and beat.speech.text else 0
        est_speech = words_count / 2.4
        calculated_min = max(5.0, round(est_speech + 1.2, 1))
        if not beat.min_duration or beat.min_duration < calculated_min:
            beat.min_duration = calculated_min

    return scene

def assemble_cast_snapshots(cast_ids: List[str], metadata: Dict[str, Any]) -> List[CastMember]:
    char_meta_map = {c["id"]: c for c in metadata.get("characters", [])}
    cast = []
    for cid in cast_ids:
        meta = char_meta_map.get(cid, {})
        species = meta.get("species")
        if not species:
            cid_lower = cid.lower()
            if "rabbit" in cid_lower or "bunny" in cid_lower:
                species = "rabbit"
            elif "turtle" in cid_lower or "tortoise" in cid_lower:
                species = "turtle"
            elif "fox" in cid_lower:
                species = "fox"
            elif "owl" in cid_lower:
                species = "owl"
            elif "kid" in cid_lower:
                species = "kid"
            else:
                species = "friend"

        palette_raw = meta.get("default_palette")
        if not palette_raw:
            if species == "rabbit":
                palette_raw = {"primary": "#f3f4f6", "secondary": "#fbcfe8", "accent": "#60a5fa", "outline": "#1f2937"}
            elif species == "turtle":
                palette_raw = {"primary": "#15803d", "secondary": "#86efac", "accent": "#fef08a", "outline": "#14532d"}
            else:
                palette_raw = {"primary": "#8b5e3c", "secondary": "#d9b38c", "accent": "#f2a65a", "outline": "#3b2a1e"}

        voice_raw = meta.get("default_voice")
        if not voice_raw:
            if species == "rabbit":
                voice_raw = {"engine_voice": "en-US-BrianMultilingualNeural", "rate": "+6%", "pitch": "+3Hz"}
            elif species == "turtle":
                voice_raw = {"engine_voice": "en-US-ChristopherNeural", "rate": "-8%", "pitch": "-2Hz"}
            elif species == "fox":
                voice_raw = {"engine_voice": "en-US-AndrewMultilingualNeural", "rate": "+4%", "pitch": "+0Hz"}
            elif species == "owl":
                voice_raw = {"engine_voice": "en-US-EmmaNeural", "rate": "+2%", "pitch": "+1Hz"}
            elif species == "kid":
                voice_raw = {"engine_voice": "en-US-AvaMultilingualNeural", "rate": "+3%", "pitch": "+2Hz"}
            else:
                voice_raw = {"engine_voice": "en-US-AvaNeural", "rate": "+0%", "pitch": "+0Hz"}
        cast.append(CastMember(
            character_id=cid,
            name=meta.get("name", cid.replace("_", " ").title()),
            species=species,
            palette=Palette(**palette_raw),
            accessories=meta.get("accessories", []),
            voice=VoiceConfig(**voice_raw)
        ))
    return cast

async def direct_episode(
    draft: StoryDraft,
    episode_id: Optional[str] = None,
    llm_fn = generate_json
) -> EpisodePlan:
    metadata = load_metadata()
    ep_id = episode_id or f"ep_{uuid.uuid4().hex[:8]}"

    # Direct all scenes
    scenes: List[Scene] = []
    for idx, scene in enumerate(draft.scenes):
        if idx > 0:
            await asyncio.sleep(1.0)
        sc = await direct_scene(scene, draft.cast, metadata, llm_fn=llm_fn)
        scenes.append(sc)

    # Stitch next_scene links from draft if not populated
    for i, sc in enumerate(scenes):
        if not sc.next_scene and i < len(scenes) - 1:
            sc.next_scene = scenes[i + 1].scene_id

    cast_members = assemble_cast_snapshots(draft.cast, metadata)

    return EpisodePlan(
        schema_version="1.0",
        episode_id=ep_id,
        title=draft.title,
        age_band=draft.age_band,
        language=draft.language,
        start_scene=scenes[0].scene_id if scenes else "sc1",
        interactive=draft.interactive,
        cast=cast_members,
        scenes=scenes
    )
