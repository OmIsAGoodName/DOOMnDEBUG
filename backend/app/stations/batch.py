import asyncio
import uuid
import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from ..llm.adapter import generate_json
from ..pipeline import run_quick_story_pipeline, generation_tasks
from ..repositories import get_repository, Repository

class EpisodePremise(BaseModel):
    episode_no: int
    title: str
    logline: str
    characters_used: List[str]
    connecting_thread: str

class SeasonOutline(BaseModel):
    season_title: str
    episodes: List[EpisodePremise]

async def generate_season_outline(
    series: Dict[str, Any],
    characters: List[Dict[str, Any]],
    count: int = 3,
    age_band: str = "4-6",
    language: str = "en",
    llm_fn = generate_json
) -> SeasonOutline:
    system = """You are the Lead Showrunner for a children's animated television series.
Your task is to outline a multi-episode season with clear episodic continuity.
Each episode has an episodic premise and a connecting narrative thread with recurring characters."""

    char_names = [f"- {c['slug'] or c['id']}: {c['name']} ({c.get('species', 'friend')})" for c in characters]
    world_setting = series.get("world", {}).get("setting", "a warm friendly world")

    user = f"""Series Title: "{series.get('title', 'VoxFable Series')}"
World Setting: {world_setting}
Target Age Band: {age_band}
Episode Count: {count}

Characters in Series:
{chr(10).join(char_names)}

Generate a SeasonOutline JSON with exactly {count} episodic premises."""

    data = await llm_fn(
        system=system,
        user=user,
        schema=SeasonOutline,
        temperature=0.7
    )
    return SeasonOutline.model_validate(data)

async def run_batch_generation(
    generation_id: str,
    owner_id: str,
    series: Dict[str, Any],
    characters: List[Dict[str, Any]],
    count: int = 3,
    age_band: str = "4-6",
    language: str = "en",
    repo: Optional[Repository] = None
):
    repo = repo or get_repository()
    count = min(5, max(1, count))
    errors: List[str] = []
    generated_ep_ids: List[str] = []

    async def update_gen_progress(stage: str, progress: int, status: str = "running"):
        generation_tasks[generation_id] = {
            "id": generation_id,
            "status": status,
            "stage": stage,
            "progress": progress,
            "episode_ids": list(generated_ep_ids)
        }
        await repo.update_generation(owner_id, generation_id, {
            "status": status,
            "stage": stage,
            "progress": progress,
            "episode_ids": list(generated_ep_ids)
        })

    try:
        # Step 1: Season outline
        await update_gen_progress("planning", progress=15)
        outline = await generate_season_outline(series, characters, count=count, age_band=age_band, language=language)

        # Step 2: Generate each episode with concurrency 2
        semaphore = asyncio.Semaphore(2)

        async def generate_single_ep(premise: EpisodePremise, idx: int):
            async with semaphore:
                ep_gen_id = f"{generation_id}_ep{idx+1}"
                try:
                    ep_id = await run_quick_story_pipeline(
                        generation_id=ep_gen_id,
                        owner_id=owner_id,
                        prompt=f"{premise.title}: {premise.logline}",
                        age_band=age_band,
                        language=language,
                        interactive=False,
                        series=series,
                        characters=characters,
                        repo=repo
                    )
                    # Update episode with series_id and episode_no
                    await repo.update_episode(owner_id, ep_id, {
                        "series_id": series.get("id"),
                        "episode_no": premise.episode_no
                    })
                    generated_ep_ids.append(ep_id)
                    progress = int(20 + ((idx + 1) / count) * 75)
                    await update_gen_progress("narration", progress=progress)
                except Exception as e:
                    errors.append(f"Episode {idx+1} ({premise.title}) failed: {str(e)}")

        tasks = [generate_single_ep(ep, i) for i, ep in enumerate(outline.episodes)]
        await asyncio.gather(*tasks)

        # Mark succeeded
        final_status = "succeeded" if generated_ep_ids else "failed"
        await repo.update_generation(owner_id, generation_id, {
            "status": final_status,
            "stage": "ready",
            "progress": 100,
            "episode_ids": generated_ep_ids,
            "error": "; ".join(errors) if errors else None
        })
        generation_tasks[generation_id] = {
            "id": generation_id,
            "status": final_status,
            "stage": "ready",
            "progress": 100,
            "episode_ids": generated_ep_ids,
            "error": "; ".join(errors) if errors else None
        }

    except Exception as e:
        await repo.update_generation(owner_id, generation_id, {
            "status": "failed",
            "stage": "failed",
            "error": f"Batch generation outline failed: {str(e)}"
        })
        generation_tasks[generation_id] = {
            "id": generation_id,
            "status": "failed",
            "stage": "failed",
            "error": f"Batch generation outline failed: {str(e)}"
        }
