import json
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..models.story_draft import StoryDraft
from ..llm.adapter import generate_json

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
METADATA_DIR = BASE_DIR / "assets" / "metadata"
PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

def load_metadata() -> Dict[str, List[Dict[str, Any]]]:
    result = {
        "characters": [],
        "backgrounds": [],
        "props": [],
        "animations": [],
        "sfx": [],
        "music": []
    }
    if not METADATA_DIR.exists():
        return result
    for key in result.keys():
        path = METADATA_DIR / f"{key}.json"
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    result[key] = json.load(f)
            except Exception:
                pass

    # Merge custom user-created assets from media/data
    data_dir = BASE_DIR / "media" / "data"

    custom_chars_path = data_dir / "custom_characters.json"
    if custom_chars_path.exists():
        try:
            with open(custom_chars_path, "r", encoding="utf-8") as f:
                custom_list = json.load(f)
                if isinstance(custom_list, list):
                    result["characters"].extend(custom_list)
        except Exception:
            pass

    custom_bgs_path = data_dir / "custom_backgrounds.json"
    if custom_bgs_path.exists():
        try:
            with open(custom_bgs_path, "r", encoding="utf-8") as f:
                custom_bgs = json.load(f)
                if isinstance(custom_bgs, list):
                    result["backgrounds"].extend(custom_bgs)
        except Exception:
            pass

    custom_props_path = data_dir / "custom_props.json"
    if custom_props_path.exists():
        try:
            with open(custom_props_path, "r", encoding="utf-8") as f:
                custom_props = json.load(f)
                if isinstance(custom_props, list):
                    result["props"].extend(custom_props)
        except Exception:
            pass

    custom_audio_path = data_dir / "custom_audio.json"
    if custom_audio_path.exists():
        try:
            with open(custom_audio_path, "r", encoding="utf-8") as f:
                custom_audio = json.load(f)
                if isinstance(custom_audio, dict):
                    result["music"].extend(custom_audio.get("music", []))
                    result["sfx"].extend(custom_audio.get("sfx", []))
                elif isinstance(custom_audio, list):
                    for a in custom_audio:
                        if a.get("type") == "sfx":
                            result["sfx"].append(a)
                        else:
                            result["music"].append(a)
        except Exception:
            pass

    return result

def load_system_prompt() -> str:
    path = PROMPTS_DIR / "writer.md"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return "You are the Story Writer for VoxFable. Output valid StoryDraft JSON."

def build_writer_user_prompt(
    prompt: str,
    age_band: str = "4-6",
    language: str = "en",
    interactive: bool = False,
    series: Optional[Dict[str, Any]] = None,
    characters: Optional[List[Dict[str, Any]]] = None,
    duration: str = "1-2mins",
    generate_characters: bool = False,
    num_choices: int = 1,
    force_interactive_tree: bool = False
) -> str:
    metadata = load_metadata()

    # Characters and backgrounds available (compact token representation)
    if characters:
        avail_chars = ", ".join(f"{c['slug'] or c['id']} ({c.get('species', 'friend')})" for c in characters)
    else:
        avail_chars = ", ".join(f"{c['id']} ({c.get('species', 'friend')})" for c in metadata["characters"])

    avail_bgs = ", ".join(b["id"] for b in metadata["backgrounds"])

    if duration == "<1min":
        duration_req = (
            "Target length: <1min (Snack Story)\n"
            "- Exactly 3 scenes total.\n"
            "- Each scene MUST have 2 beats (6 beats total across the story).\n"
            "- Spoken runtime target: 50 to 65 seconds."
        )
    elif duration == "2-3mins":
        duration_req = (
            "Target length: 2-3mins (Extended Adventure)\n"
            "- Exactly 5 or 6 scenes total.\n"
            "- Each scene MUST have 3 to 4 beats (15 to 20 beats total across the story).\n"
            "- Spoken runtime target: 135 to 165 seconds."
        )
    else:  # "1-2mins"
        duration_req = (
            "Target length: 1-2mins (Bedtime Tale - MUST BE BETWEEN 80 AND 120 SECONDS)\n"
            "- Exactly 4 or 5 scenes total.\n"
            "- Each scene MUST have 2 to 3 beats (10 to 14 beats total across the story).\n"
            "- Spoken runtime target: 85 to 115 seconds."
        )

    if interactive:
        effective_choices = num_choices if num_choices > 1 else (2 if force_interactive_tree else 1)
        if effective_choices == 2:
            interactive_section = """- Interactive: YES (BRANCHING CHOICE TREE WITH MULTIPLE ENDINGS - 2 CONSECUTIVE CHOICE SCREENS)
  * Construct a rich, expansive 2-tier decision tree with 2 sequential choice screens giving 4 distinct branch pathways and endings!
  * Full Tree Architecture (Provide ALL 7 scenes in `scenes`):
    - Scene 1 (The Initial Choice, "sc1"):
      * Introduces the dilemma.
      * Final beat MUST have a `choice` with 2 options:
        - "opt_a" -> next_scene: "sc2a"
        - "opt_b" -> next_scene: "sc2b"
    - Tier-2 Branch A ("sc2a"):
      * First branch exploration in a unique location (different background).
      * Final beat MUST have a SECOND choice screen with 2 options:
        - "opt_a1" -> next_scene: "sc3a1"
        - "opt_a2" -> next_scene: "sc3a2"
    - Tier-2 Branch B ("sc2b"):
      * Second branch exploration in a completely different location.
      * Final beat MUST have a SECOND choice screen with 2 options:
        - "opt_b1" -> next_scene: "sc3b1"
        - "opt_b2" -> next_scene: "sc3b2"
    - 4 Unique Climax & Ending Scenes (next_scene: null for all 4 endings):
      * Ending A1 ("sc3a1"): Warm resolution for choice Path A1. next_scene: null.
      * Ending A2 ("sc3a2"): Warm resolution for choice Path A2. next_scene: null.
      * Ending B1 ("sc3b1"): Warm resolution for choice Path B1. next_scene: null.
      * Ending B2 ("sc3b2"): Warm resolution for choice Path B2. next_scene: null.
  * Each scene MUST contain 2 beats (never more than 2) to maintain fast generation and punchy pacing. Provide all scenes so any pathway can be explored!"""
        elif effective_choices >= 3:
            interactive_section = """- Interactive: YES (BRANCHING CHOICE TREE WITH MULTIPLE ENDINGS - 3 CHOICE SCREENS / EPIC QUEST)
  * Construct an expansive multi-stage interactive journey with 3 distinct decision screens across the adventure!
  * Full Tree Architecture (Provide ALL scenes in `scenes`):
    - Scene 1 (Stage 1 Choice, "sc1"):
      * Quest setup. Final beat choice leads to "sc2a" or "sc2b".
    - Stage 2 Scenes ("sc2a", "sc2b"):
      * Encountering obstacle. Final beat choice in each leads to "sc3a" or "sc3b".
    - Stage 3 Scenes ("sc3a", "sc3b"):
      * Climax decision point! Final beat choice in each leads to "sc4a" (Heroic resolution) or "sc4b" (Clever/Peaceful resolution).
    - Stage 4 Endings ("sc4a", "sc4b"):
      * Unique, heartwarming conclusions for each choice combination. next_scene: null.
  * Total scenes: Provide all branch and ending scenes in `scenes`!"""
        else:
            interactive_section = """- Interactive: YES (BRANCHING CHOICE TREE WITH MULTIPLE ENDINGS)
  * Construct a genuine branching story tree so the user's choices lead to completely DIFFERENT adventures and MULTIPLE UNIQUE ENDINGS!
  * Structure:
    - Scene 1 (Opening Dilemma, e.g. "sc1"): Establishes the quest. Its FINAL beat MUST contain a `choice` with 2 distinct options:
      * Option A (id: "opt_a", label: "...", keywords: [...], next_scene: "sc2a")
      * Option B (id: "opt_b", label: "...", keywords: [...], next_scene: "sc2b")
      * default: "opt_a"
    - Branch Scene A (e.g. "sc2a"): Explores Option A in a unique location (different background). Leads to Ending A (next_scene: "sc3a").
    - Branch Scene B (e.g. "sc2b"): Explores Option B in a completely different location. Leads to Ending B (next_scene: "sc3b").
    - Ending Scene A (e.g. "sc3a"): Unique, heartwarming climax and bedtime ending for Path A. next_scene: null.
    - Ending Scene B (e.g. "sc3b"): Completely distinct, heartwarming climax and bedtime ending for Path B. next_scene: null.
  * Total scenes: Provide all 5 scenes (sc1, sc2a, sc2b, sc3a, sc3b) in `scenes` so any branch can be traversed according to the user's choice!"""
    else:
        interactive_section = "- Interactive: NO (linear single-path story)"

    user_prompt = f"""
STORY REQUEST:
- User Premise: "{prompt}"
- Fresh Creative Seed: {uuid.uuid4().hex[:6]} (Ensure a fresh, dynamic, original story progression)
- Target Age Band: {age_band}
- Language: {language}
- Target Duration Requirement:
{duration_req}

{interactive_section}
{"- Character Creation: Try generating original, creative character designs suited to this story premise and include them in the cast list." if generate_characters else ""}

STORYTELLING & PACING RULES:
1. Multi-Beat Scenes: Do NOT write single-beat scenes! Every scene must have 2 to 4 beats so characters interact and dialogue flows naturally.
2. Character Dialogue: Feature at least 2 characters having lively, sweet conversations (use type: "SPEAK" with character_id).
3. Sensory Detail & Warmth: Include evocative, child-friendly details (glowing fireflies, crunchy clover, fluffy clouds, warm cups of tea).
4. Speech Length: Each beat must be between 14 and 24 words (< 25 words) to ensure proper cartoon timing and runtime.
5. Visual Scene Progression: Every scene MUST use a DIFFERENT background from the Available Backgrounds list to show journey and location changes (e.g. sc1: village_street, sc2: library_day, sc3: meadow_day, sc4: forest_day). NEVER repeat the same background across multiple scenes!

AVAILABLE ASSETS:
- Cast Candidates: {avail_chars}
- Backgrounds: {avail_bgs}

Write a heartwarming, engaging StoryDraft JSON for this story.
Ensure speech lines are concise (< 25 words).
"""
    if series:
        user_prompt += f"\nSeries Setting & Rules: {json.dumps(series.get('world', {}))}\n"

    return user_prompt.strip()

async def write_story(
    prompt: str,
    age_band: str = "4-6",
    language: str = "en",
    interactive: bool = False,
    series: Optional[Dict[str, Any]] = None,
    characters: Optional[List[Dict[str, Any]]] = None,
    duration: str = "1-2mins",
    generate_characters: bool = False,
    num_choices: int = 1,
    force_interactive_tree: bool = False,
    llm_fn = generate_json
) -> StoryDraft:
    system_prompt = load_system_prompt()
    user_prompt = build_writer_user_prompt(
        prompt=prompt,
        age_band=age_band,
        language=language,
        interactive=interactive,
        series=series,
        characters=characters,
        duration=duration,
        generate_characters=generate_characters,
        num_choices=num_choices,
        force_interactive_tree=force_interactive_tree
    )

    call_kwargs = {}
    varnames = getattr(getattr(llm_fn, "__code__", None), "co_varnames", ())
    if "bypass_cache" in varnames or hasattr(llm_fn, "__code__") is False:
        call_kwargs["bypass_cache"] = True
    if interactive and (num_choices > 1 or force_interactive_tree):
        # Strict requirement: deep multi-choice trees must be written by high-level Gemini model
        if "strict_provider" in varnames:
            call_kwargs["strict_provider"] = "gemini"

    data = await llm_fn(
        system=system_prompt,
        user=user_prompt,
        schema=StoryDraft,
        temperature=0.7,
        **call_kwargs
    )
    draft = StoryDraft.model_validate(data)

    # Post-process: Guarantee consecutive scenes have distinct backgrounds
    metadata = load_metadata()
    avail_bgs_list = [b["id"] for b in metadata.get("backgrounds", [])]
    for i in range(1, len(draft.scenes)):
        if draft.scenes[i].background_id == draft.scenes[i - 1].background_id:
            alternatives = [bg for bg in avail_bgs_list if bg != draft.scenes[i - 1].background_id]
            if alternatives:
                draft.scenes[i].background_id = alternatives[(i - 1) % len(alternatives)]

    return draft
