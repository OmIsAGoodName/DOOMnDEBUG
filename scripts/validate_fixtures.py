import json
import os
import sys
from pathlib import Path
import jsonschema

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    root = Path(__file__).resolve().parent.parent
    fixtures_dir = root / "fixtures"
    contracts_dir = root / "contracts"
    metadata_dir = root / "assets" / "metadata"

    plan_schema = load_json(contracts_dir / "episode_plan.schema.json")
    audio_schema = load_json(contracts_dir / "audio_manifest.schema.json")

    # Load metadata if present for ID validation
    metadata = {}
    if metadata_dir.exists():
        for meta_file in metadata_dir.glob("*.json"):
            key = meta_file.stem
            try:
                data = load_json(meta_file)
                if isinstance(data, list):
                    metadata[key] = {item.get("id") for item in data if isinstance(item, dict) and "id" in item}
                elif isinstance(data, dict):
                    metadata[key] = set(data.keys())
            except Exception:
                pass

    all_passed = True
    fixture_files = list(fixtures_dir.glob("*.json"))

    if not fixture_files:
        print("No fixtures found to validate.")
        return 0

    print(f"Validating {len(fixture_files)} fixture(s)...")

    for fpath in fixture_files:
        rel_path = fpath.relative_to(root)
        try:
            data = load_json(fpath)
            # Determine schema
            if "start_scene" in data:
                jsonschema.validate(instance=data, schema=plan_schema)
                # Verify IDs against metadata if metadata loaded
                if metadata:
                    # check characters
                    chars = {c["character_id"] for c in data.get("cast", [])}
                    if "characters" in metadata:
                        unknown_chars = chars - metadata["characters"]
                        if unknown_chars:
                            raise ValueError(f"Unknown characters: {unknown_chars}")
                    # check scenes
                    for scene in data.get("scenes", []):
                        bg = scene.get("background_id")
                        if "backgrounds" in metadata and bg not in metadata["backgrounds"]:
                            raise ValueError(f"Unknown background: {bg}")
                        for p in scene.get("props", []):
                            pid = p.get("prop_id")
                            if "props" in metadata and pid not in metadata["props"]:
                                raise ValueError(f"Unknown prop: {pid}")
                        for beat in scene.get("beats", []):
                            for action in beat.get("actions", []):
                                if action.get("type") == "PLAY_SFX":
                                    sfx_id = action.get("sfx_id")
                                    if "sfx" in metadata and sfx_id not in metadata["sfx"]:
                                        raise ValueError(f"Unknown SFX: {sfx_id}")
                                elif action.get("type") == "PLAY_MUSIC":
                                    music_id = action.get("music_id")
                                    if music_id and "music" in metadata and music_id not in metadata["music"]:
                                        raise ValueError(f"Unknown Music: {music_id}")
                print(f"[PASS] {rel_path} (EpisodePlan)")

            elif "lines" in data and "episode_id" in data:
                jsonschema.validate(instance=data, schema=audio_schema)
                print(f"[PASS] {rel_path} (AudioManifest)")
            else:
                print(f"[SKIP] {rel_path} (Unknown schema type)")
        except Exception as e:
            print(f"[FAIL] {rel_path}: {e}")
            all_passed = False

    if not all_passed:
        sys.exit(1)
    print("All fixtures passed validation successfully.")

if __name__ == "__main__":
    main()

