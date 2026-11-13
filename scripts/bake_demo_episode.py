"""
Bake Demo Episode Script for VoxFable.
Runs the generation pipeline (or reads fixtures) and produces offline bundles
under frontend/public/demo/episodes/<id>/, updating index.json.
"""

import sys
import os
import json
import shutil
import asyncio
import argparse
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.pipeline import run_quick_story_pipeline
from backend.app.repositories import get_repository
from backend.app.models.episode_plan import EpisodePlan
from backend.app.tts.manifest import build_audio_manifest
import urllib.request

async def bake_episode(prompt: str, episode_id: str, is_interactive: bool = False, title: str = None):
    print(f"\n==========================================")
    print(f" Baking episode: {episode_id} ({'Interactive' if is_interactive else 'Linear'})")
    print(f" Prompt: {prompt}")
    print(f"==========================================")

    output_dir = ROOT_DIR / "frontend" / "public" / "demo" / "episodes" / episode_id
    output_dir.mkdir(parents=True, exist_ok=True)
    audio_out_dir = output_dir / "audio"
    audio_out_dir.mkdir(parents=True, exist_ok=True)

    repo = get_repository()
    gen_id = f"gen_bake_{episode_id}"
    await repo.create_generation("demo", {"id": gen_id, "prompt": prompt})

    # Try running the live LLM pipeline first; if no API key is set, fall back to robust demo fixtures
    plan_dict = None
    try:
        actual_ep_id = await run_quick_story_pipeline(
            generation_id=gen_id,
            owner_id="demo",
            prompt=prompt,
            age_band="6-8",
            language="en",
            interactive=is_interactive,
            repo=repo
        )
        ep_record = await repo.get_episode("demo", actual_ep_id)
        plan_dict = ep_record["plan"]
    except Exception as e:
        print(f"[NOTE] Live LLM pipeline unavailable ({e}). Using high-fidelity fixture template.")
        fixture_path = ROOT_DIR / "fixtures" / ("episode_live_demo.json" if is_interactive else "episode_quick_demo.json")
        with open(fixture_path, "r", encoding="utf-8") as f:
            plan_dict = json.load(f)

    actual_title = title or plan_dict.get("title", f"Episode {episode_id}")
    plan_dict["title"] = actual_title
    plan_dict["episode_id"] = episode_id

    # Build audio manifest with relative demo path
    parsed_plan = EpisodePlan.model_validate(plan_dict)
    manifest = await build_audio_manifest(parsed_plan, base_url=f"/demo/episodes/{episode_id}/audio")

    # Copy generated audio files from media/audio into frontend/public/demo/episodes/<id>/audio/
    media_audio = ROOT_DIR / "media" / "audio"
    for line in manifest.lines:
        filename = Path(line.url).name
        src = media_audio / filename
        dest = audio_out_dir / filename
        if src.exists():
            shutil.copy2(src, dest)
        elif not dest.exists():
            # Create a tiny silent mp3 if missing
            with open(dest, "wb") as f:
                f.write(b"\xff\xfb\x90\x00" * 20)

    # 4. Save plan.json and audio_manifest.json
    plan_file = output_dir / "plan.json"
    manifest_file = output_dir / "audio_manifest.json"

    with open(plan_file, "w", encoding="utf-8") as f:
        json.dump(plan_dict, f, indent=2)

    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest.model_dump(), f, indent=2)

    print(f"[OK] Wrote plan and manifest to {output_dir}")

    # 5. Update index.json
    index_file = ROOT_DIR / "frontend" / "public" / "demo" / "episodes" / "index.json"
    episodes_list = []
    if index_file.exists():
        try:
            with open(index_file, "r", encoding="utf-8") as f:
                episodes_list = json.load(f)
        except Exception:
            episodes_list = []

    # Update or insert
    existing = next((e for e in episodes_list if e.get("id") == episode_id), None)
    entry = {
        "id": episode_id,
        "title": actual_title,
        "interactive": is_interactive,
        "has_video": False,
        "video_url": f"/demo/episodes/{episode_id}/video.mp4"
    }

    if existing:
        existing.update(entry)
    else:
        episodes_list.append(entry)

    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(episodes_list, f, indent=2)

    print(f"[OK] Updated index.json with {episode_id}")
    return entry

async def main():
    parser = argparse.ArgumentParser(description="Bake demo episode offline bundle")
    parser.add_argument("--prompt", type=str, default="A wise owl and a tiny rabbit build a treehouse in the forest.")
    parser.add_argument("--id", type=str, default="demo_owl")
    parser.add_argument("--title", type=str, default=None)
    parser.add_argument("--interactive", action="store_true")
    parser.add_argument("--all-preset", action="store_true", help="Bake the 3 default fallback demo episodes")

    args = parser.parse_args()

    if args.all_preset:
        presets = [
            ("demo_quick", "A brave little owl helps a lost rabbit find glowing berries in the enchanted forest", False, "The Glowing Berries"),
            ("demo_live", "Barnaby the Bear and Pip explore an old mysterious cave with two glowing doorways", True, "The Two Doors of Whispering Cave"),
            ("demo_studio", "Luna the Cat invents a magical soaring paper airplane for the forest festival", False, "Luna's Sky Glider")
        ]
        for ep_id, prompt, is_inter, title in presets:
            await bake_episode(prompt=prompt, episode_id=ep_id, is_interactive=is_inter, title=title)
    else:
        await bake_episode(prompt=args.prompt, episode_id=args.id, is_interactive=args.interactive, title=args.title)

if __name__ == "__main__":
    asyncio.run(main())
