import asyncio
import json
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..models.story_draft import StoryDraft, DraftScene
from ..models.episode_plan import EpisodePlan, Scene, CastMember, Palette, VoiceConfig, PlacedCharacter, PlacedProp
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
    # Lean token representation
    avail_props = ", ".join(p["id"] for p in metadata.get("props", [])[:6])
    avail_sfx = ", ".join(s["id"] for s in metadata.get("sfx", [])[:6])
    avail_music = ", ".join(m["id"] for m in metadata.get("music", [])[:4])

    return f"""Direct scene into 2D Canvas Scene JSON:
Draft: {json.dumps(draft_scene.model_dump())}
Cast: {', '.join(cast_ids)}
Props: {avail_props} | SFX: {avail_sfx} | Music: {avail_music}
Rules: First beat MUST have SET_CAMERA. Characters on ground band (y: 0.65-0.85). Set min_duration 5.0-7.0s. Add PLAY_ANIMATION and SET_EXPRESSION."""

def direct_scene_rule_based(
    draft_scene: DraftScene,
    cast_ids: List[str]
) -> Scene:
    """Intelligent zero-token autonomous director fallback."""
    initial_chars = []
    num_chars = len(cast_ids)
    for idx, cid in enumerate(cast_ids):
        if num_chars == 1:
            x_pos = 0.50
        else:
            x_pos = round(0.18 + (idx / max(1, num_chars - 1)) * 0.64, 2)
        facing = "right" if x_pos <= 0.50 else "left"
        initial_chars.append({
            "character_id": cid,
            "position": (x_pos, 0.76),
            "facing": facing,
            "expression": "happy",
            "animation": "idle"
        })

    beats_out = []
    for b_idx, b in enumerate(draft_scene.beats):
        speaker = b.speech.character_id
        emotion = b.speech.emotion or "happy"
        words_count = len(b.speech.text.split()) if b.speech.text else 0
        est_speech = words_count / 2.4
        min_dur = max(5.0, round(est_speech + 1.2, 1))

        actions = []
        if b_idx == 0:
            actions.append({
                "type": "SET_CAMERA",
                "shot": "wide",
                "movement": "slow_push_in",
                "duration": 3.0
            })
            actions.append({
                "type": "PLAY_MUSIC",
                "music_id": "calm",
                "volume": 0.25,
                "fade": 1.0
            })

        if speaker:
            anim = "talk" if b.speech.type == "SPEAK" else "idle"
            actions.append({
                "type": "PLAY_ANIMATION",
                "character_id": speaker,
                "animation": anim,
                "duration": 2.0
            })
            actions.append({
                "type": "SET_EXPRESSION",
                "character_id": speaker,
                "expression": emotion
            })

        text_lower = (b.speech.text or "").lower()

        # 1. Flight / Flew Away
        if any(w in text_lower for w in ["flew away", "flies away", "fly away", "soared", "takes flight", "took flight", "flapped his wings", "flapped her wings", "flew"]):
            flying_char = "pip_owl" if "pip_owl" in cast_ids else (speaker or cast_ids[0])
            actions.append({
                "type": "REMOVE_CHARACTER",
                "character_id": flying_char,
                "exit": "fly_away",
                "duration": 2.5,
                "delay": max(0.5, round(est_speech * 0.4, 1))
            })
            actions.append({
                "type": "PLAY_SFX",
                "sfx_id": "sparkle",
                "volume": 0.5,
                "delay": max(0.5, round(est_speech * 0.4, 1))
            })

        # 2. Walked / Ran / Came Over / Approached
        elif any(w in text_lower for w in ["walked over", "walks over", "ran to", "runs to", "hurried", "approached", "stepped closer", "came over"]):
            moving_char = speaker or cast_ids[0]
            actions.append({
                "type": "MOVE_TO",
                "character_id": moving_char,
                "to": (0.46, 0.76),
                "duration": 2.0,
                "delay": 0.5
            })

        # 3. Waving Goodbye or Hello
        elif any(w in text_lower for w in ["waved", "waves", "goodbye", "farewell", "hello", "greeted"]):
            waving_char = speaker or cast_ids[0]
            actions.append({
                "type": "PLAY_ANIMATION",
                "character_id": waving_char,
                "animation": "wave",
                "duration": 2.5,
                "delay": 0.2
            })

        # 4. Pointing / Showing
        elif any(w in text_lower for w in ["pointed", "points", "look there", "look at", "spotted", "showed"]):
            pointing_char = speaker or cast_ids[0]
            actions.append({
                "type": "PLAY_ANIMATION",
                "character_id": pointing_char,
                "animation": "point",
                "duration": 2.5,
                "delay": 0.2
            })

        # 5. Jumping / Cheering / Laughing
        elif any(w in text_lower for w in ["jumped", "leaped", "hopped", "cheered", "celebrated", "giggled", "hooray", "gasped"]):
            react_char = speaker or cast_ids[0]
            actions.append({
                "type": "PLAY_ANIMATION",
                "character_id": react_char,
                "animation": "react",
                "duration": 2.0,
                "delay": 0.2
            })
            actions.append({
                "type": "PLAY_SFX",
                "sfx_id": "pop",
                "volume": 0.5
            })
        elif b_idx % 2 == 1:
            actions.append({
                "type": "PLAY_SFX",
                "sfx_id": "chime",
                "volume": 0.5
            })

        # 6. Props Interaction
        if any(w in text_lower for w in ["briefcase", "bag", "golden map", "map", "flower", "balloon", "lantern"]):
            prop_id = "flower"
            if "map" in text_lower:
                prop_id = "golden_map"
            elif "briefcase" in text_lower or "bag" in text_lower:
                prop_id = "backpack"
            elif "balloon" in text_lower:
                prop_id = "balloon"
            elif "lantern" in text_lower:
                prop_id = "lantern"
            prop_char = speaker or cast_ids[0]
            actions.append({
                "type": "ATTACH_PROP",
                "prop_id": prop_id,
                "character_id": prop_char,
                "slot": "hand"
            })

        beats_out.append({
            "beat_id": b.beat_id,
            "speech": b.speech.model_dump(),
            "actions": actions,
            "choice": b.choice.model_dump() if b.choice else None,
            "min_duration": min_dur
        })

    return Scene.model_validate({
        "scene_id": draft_scene.scene_id,
        "background_id": draft_scene.background_id,
        "mood": draft_scene.mood,
        "next_scene": draft_scene.next_scene,
        "props": [],
        "characters": initial_chars,
        "beats": beats_out
    })

async def direct_scene(
    draft_scene: DraftScene,
    cast_ids: List[str],
    metadata: Dict[str, Any],
    llm_fn = generate_json
) -> Scene:
    system_prompt = load_director_system_prompt()
    user_prompt = build_director_scene_prompt(draft_scene, cast_ids, metadata)

    try:
        data = await llm_fn(
            system=system_prompt,
            user=user_prompt,
            schema=Scene,
            temperature=0.7
        )
        scene = Scene.model_validate(data)
    except Exception as e:
        print(f"[Director] Falling back to zero-token autonomous director for {draft_scene.scene_id}: {e}")
        return direct_scene_rule_based(draft_scene, cast_ids)

    # Ensure all cast members are represented on stage
    existing_cids = {c.character_id for c in scene.characters}
    missing_cids = [cid for cid in cast_ids if cid not in existing_cids]
    if missing_cids:
        total_chars = len(cast_ids)
        for m_idx, m_cid in enumerate(missing_cids):
            slot = len(existing_cids) + m_idx
            x_pos = round(0.18 + (slot / max(1, total_chars - 1)) * 0.64, 2)
            scene.characters.append(PlacedCharacter(
                character_id=m_cid,
                position=(min(0.88, x_pos), 0.76),
                facing="left" if x_pos > 0.50 else "right",
                expression="happy",
                animation="idle"
            ))

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
