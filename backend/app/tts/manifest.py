import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..models.episode_plan import EpisodePlan
from ..models.audio_manifest import AudioManifest, AudioLine, WordTiming, MusicAsset, SfxAsset
from .synthesizer import synthesize_line

semaphore = asyncio.Semaphore(3)

async def process_line(
    plan_episode_id: str,
    scene_id: str,
    beat_id: str,
    speaker: str,
    text: str,
    voice_config: Dict[str, str],
    base_url: str = "/media/audio"
) -> AudioLine:
    line_id = f"{plan_episode_id}:{scene_id}:{beat_id}"
    voice = voice_config.get("engine_voice", "en-US-AnaNeural")
    rate = voice_config.get("rate", "+0%")
    pitch = voice_config.get("pitch", "+0Hz")

    # Retry up to 2 times
    last_err = None
    for attempt in range(3):
        try:
            async with semaphore:
                dest_path, duration_ms, words = await synthesize_line(
                    text=text,
                    voice=voice,
                    rate=rate,
                    pitch=pitch
                )
            url = f"{base_url.rstrip('/')}/{dest_path.name}"
            return AudioLine(
                line_id=line_id,
                scene_id=scene_id,
                beat_id=beat_id,
                speaker=speaker,
                url=url,
                duration_ms=duration_ms,
                words=words
            )
        except Exception as e:
            last_err = e
            await asyncio.sleep(0.5 * (2 ** attempt))

    # Fallback placeholder if TTS failed
    words_count = len(text.split())
    estimated_ms = max(1500, int((words_count / 2.6) * 1000))
    return AudioLine(
        line_id=line_id,
        scene_id=scene_id,
        beat_id=beat_id,
        speaker=speaker,
        url=f"{base_url.rstrip('/')}/placeholder.mp3",
        duration_ms=estimated_ms,
        words=[]
    )

async def build_audio_manifest(
    plan: EpisodePlan,
    base_url: str = "/media/audio"
) -> AudioManifest:
    # Build cast voice map
    cast_voices: Dict[str, Dict[str, str]] = {}
    for c in plan.cast:
        cast_voices[c.character_id] = {
            "engine_voice": c.voice.engine_voice,
            "rate": c.voice.rate,
            "pitch": c.voice.pitch
        }

    tasks = []
    used_music_ids = set()
    used_sfx_ids = set()

    narrator_voice = {
        "engine_voice": "en-US-AvaNeural",
        "rate": "-4%",
        "pitch": "+0Hz"
    }

    for scene in plan.scenes:
        for beat in scene.beats:
            if beat.speech and beat.speech.text:
                speaker = beat.speech.character_id if beat.speech.type == "SPEAK" and beat.speech.character_id else "narrator"
                v_config = cast_voices.get(speaker) or (narrator_voice if speaker == "narrator" else {
                    "engine_voice": "en-US-AvaNeural",
                    "rate": "+0%",
                    "pitch": "+0Hz"
                })
                tasks.append(process_line(
                    plan_episode_id=plan.episode_id,
                    scene_id=scene.scene_id,
                    beat_id=beat.beat_id,
                    speaker=speaker,
                    text=beat.speech.text,
                    voice_config=v_config,
                    base_url=base_url
                ))

            for act in beat.actions:
                if act.type == "PLAY_MUSIC" and act.music_id:
                    used_music_ids.add(act.music_id)
                elif act.type == "PLAY_SFX" and act.sfx_id:
                    used_sfx_ids.add(act.sfx_id)

    lines: List[AudioLine] = await asyncio.gather(*tasks)

    music_assets = [
        MusicAsset(music_id=m, url=f"/assets/audio/music/{m.replace('music_', '')}.mp3")
        for m in sorted(used_music_ids)
    ]
    sfx_assets = [
        SfxAsset(sfx_id=s, url=f"/assets/audio/sfx/{s.replace('sfx_', '')}.mp3")
        for s in sorted(used_sfx_ids)
    ]

    return AudioManifest(
        episode_id=plan.episode_id,
        lines=lines,
        music=music_assets,
        sfx=sfx_assets
    )
