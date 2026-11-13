import asyncio
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.app.models.episode_plan import EpisodePlan, Scene, Beat, CastMember, Palette, VoiceConfig, Speech
from backend.app.stations.safety import evaluate_plan_safety

async def main():
    print("=== VoxFable Safety Gate Demonstration ===")

    test_cases = [
        ("Violent/Forbidden Keywords", "The pirate drew a bloody sword and began to fight!"),
        ("Scary/Monster Elements", "A scary dark monster lurked in the shadow ready to bite!"),
        ("Wholesome Child Content", "Pip and Rusty planted sunflowers together in the sunny meadow.")
    ]

    for title, text in test_cases:
        plan = EpisodePlan(
            schema_version="1.0",
            episode_id="ep_safety_test",
            title=title,
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
                    beats=[Beat(beat_id="b1", speech=Speech(type="NARRATE", text=text))]
                )
            ]
        )

        verdict = await evaluate_plan_safety(plan)
        print(f"\nTest: [{title}]")
        print(f"  Text: \"{text}\"")
        print(f"  Verdict: {verdict.verdict.upper()}")
        print(f"  Scores: scary={verdict.scary:.2f}, age_fit={verdict.age_fit:.2f}")
        print(f"  Notes: {verdict.notes}")

if __name__ == "__main__":
    asyncio.run(main())
