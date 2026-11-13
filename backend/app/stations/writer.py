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
    characters: Optional[List[Dict[str, Any]]] = None
) -> str:
    metadata = load_metadata()

    # Characters available
    if characters:
        avail_chars = [f"- {c['slug'] or c['id']}: {c['name']} ({c.get('species', 'friend')})" for c in characters]
    else:
        avail_chars = [f"- {c['id']}: {c['name']} ({c['species']}) - {', '.join(c.get('tags', []))}" for c in metadata["characters"]]

    avail_bgs = [f"- {b['id']}: {b['name']} (hint: {b.get('mood_hint', 'day')})" for b in metadata["backgrounds"]]

    user_prompt = f"""
STORY REQUEST:
- User Premise: "{prompt}"
- Target Age Band: {age_band}
- Language: {language}
- Interactive: {"YES (2 choice points with reconverging branch)" if interactive else "NO (linear)"}

AVAILABLE ASSETS:
Available Characters:
{chr(10).join(avail_chars)}

Available Backgrounds:
{chr(10).join(avail_bgs)}

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
    llm_fn = generate_json
) -> StoryDraft:
    system_prompt = load_system_prompt()
    user_prompt = build_writer_user_prompt(
        prompt=prompt,
        age_band=age_band,
        language=language,
        interactive=interactive,
        series=series,
        characters=characters
    )

    data = await llm_fn(
        system=system_prompt,
        user=user_prompt,
        schema=StoryDraft,
        temperature=0.7
    )
    return StoryDraft.model_validate(data)
