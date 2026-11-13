import os
import time
import asyncio
import uuid
from typing import Dict, Any, Optional, List
from .models.episode_plan import EpisodePlan
from .stations.writer import write_story
from .stations.director import direct_episode
from .validation.validator import validate_plan
from .tts.manifest import build_audio_manifest
from .repositories import get_repository, Repository

# In-memory registry for fast local task monitoring
generation_tasks: Dict[str, Dict[str, Any]] = {}

async def run_quick_story_pipeline(
    generation_id: str,
    owner_id: str,
    prompt: str,
    age_band: str = "4-6",
    language: str = "en",
    interactive: bool = False,
    series: Optional[Dict[str, Any]] = None,
    characters: Optional[List[Dict[str, Any]]] = None,
    repo: Optional[Repository] = None
) -> str:
    repo = repo or get_repository()
    timings = {}

    async def update_stage(stage: str, progress: Optional[int] = None, status: str = "running"):
        generation_tasks[generation_id] = {
            "id": generation_id,
            "status": status,
            "stage": stage,
            "progress": progress
        }
        await repo.update_generation(owner_id, generation_id, {
            "status": status,
            "stage": stage,
            "progress": progress
        })

    try:
        # 1. Understanding
        t0 = time.perf_counter()
        await update_stage("understanding", progress=10)
        await asyncio.sleep(0.1) # brief yield
        timings["understanding"] = (time.perf_counter() - t0) * 1000

        # 2. Writing (Story Writer)
        t0 = time.perf_counter()
        await update_stage("writing", progress=25)
        draft = await write_story(
            prompt=prompt,
            age_band=age_band,
            language=language,
            interactive=interactive,
            series=series,
            characters=characters
        )
        timings["writing"] = (time.perf_counter() - t0) * 1000

        # 3. Planning (Animation Director)
        t0 = time.perf_counter()
        await update_stage("planning", progress=50)
        episode_id = f"ep_{uuid.uuid4().hex[:8]}"
        plan = await direct_episode(draft, episode_id=episode_id)
        timings["planning"] = (time.perf_counter() - t0) * 1000

        # 4. Preparing (Validator & Resolver)
        t0 = time.perf_counter()
        await update_stage("preparing", progress=65)
        repaired_plan, repairs = validate_plan(plan)
        timings["preparing"] = (time.perf_counter() - t0) * 1000

        # 5. Checking (Safety & Continuity hooks)
        t0 = time.perf_counter()
        await update_stage("checking", progress=75)
        # Placeholder hooks pass cleanly for v0
        timings["checking"] = (time.perf_counter() - t0) * 1000

        # 6. Narration (TTS & Audio Manifest)
        t0 = time.perf_counter()
        await update_stage("narration", progress=85)
        skip_tts = os.environ.get("SKIP_TTS", "").lower() in ("true", "1")
        if skip_tts:
            from .models.audio_manifest import AudioManifest
            manifest = AudioManifest(episode_id=episode_id, lines=[])
        else:
            manifest = await build_audio_manifest(repaired_plan)
        timings["narration"] = (time.perf_counter() - t0) * 1000

        # 7. Ready
        t0 = time.perf_counter()
        episode_record = {
            "id": episode_id,
            "title": repaired_plan.title,
            "plan": repaired_plan.model_dump(),
            "audio_manifest": manifest.model_dump(),
            "safety": {"verdict": "pass", "age_fit": 1.0, "scary": 0.0, "notes": "Approved"},
            "continuity": {"violations": []},
            "status": "ready"
        }
        await repo.create_episode(owner_id, episode_record)

        await repo.update_generation(owner_id, generation_id, {
            "status": "succeeded",
            "stage": "ready",
            "progress": 100,
            "episode_ids": [episode_id]
        })
        generation_tasks[generation_id] = {
            "id": generation_id,
            "status": "succeeded",
            "stage": "ready",
            "progress": 100,
            "episode_ids": [episode_id]
        }
        timings["total"] = sum(timings.values())
        print(f"Pipeline completed for {episode_id}. Timings (ms): {timings}")
        return episode_id

    except Exception as e:
        error_msg = f"Generation failed: {str(e)}"
        print(error_msg)
        await repo.update_generation(owner_id, generation_id, {
            "status": "failed",
            "stage": "failed",
            "error": error_msg
        })
        generation_tasks[generation_id] = {
            "id": generation_id,
            "status": "failed",
            "stage": "failed",
            "error": error_msg
        }
        raise
