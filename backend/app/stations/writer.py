import json
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
    generate_characters: bool = False
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

    user_prompt = f"""
STORY REQUEST:
- User Premise: "{prompt}"
- Target Age Band: {age_band}
- Language: {language}
- Target Duration Requirement:
{duration_req}

- Interactive: {"YES (2 choice points with reconverging branch)" if interactive else "NO (linear)"}
{"- Character Creation: Try generating original, creative character designs suited to this story premise and include them in the cast list." if generate_characters else ""}

STORYTELLING & PACING RULES:
1. Multi-Beat Scenes: Do NOT write single-beat scenes! Every scene must have 2 to 4 beats so characters interact and dialogue flows naturally.
2. Character Dialogue: Feature at least 2 characters having lively, sweet conversations (use type: "SPEAK" with character_id).
3. Sensory Detail & Warmth: Include evocative, child-friendly details (glowing fireflies, crunchy clover, fluffy clouds, warm cups of tea).
4. Speech Length: Each beat must be between 14 and 24 words (< 25 words) to ensure proper cartoon timing and runtime.

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
        generate_characters=generate_characters
    )

    data = await llm_fn(
        system=system_prompt,
        user=user_prompt,
        schema=StoryDraft,
        temperature=0.7
    )
    return StoryDraft.model_validate(data)
