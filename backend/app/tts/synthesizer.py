import hashlib
import asyncio
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
import edge_tts
from mutagen.mp3 import MP3
from ..config import settings
from ..models.audio_manifest import WordTiming

def get_audio_cache_dir() -> Path:
    p = Path(settings.MEDIA_DIR) / "audio"
    p.mkdir(parents=True, exist_ok=True)
    return p

def get_line_hash(text: str, voice: str, rate: str, pitch: str) -> str:
    key = f"{text}||{voice}||{rate}||{pitch}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()

async def synthesize_line(
    text: str,
    voice: str = "en-US-AnaNeural",
    rate: str = "+0%",
    pitch: str = "+0Hz",
    output_path: Optional[Path] = None
) -> Tuple[Path, int, List[WordTiming]]:
    """Synthesizes speech to MP3 with word boundary timings and duration_ms."""
    audio_dir = get_audio_cache_dir()
    file_hash = get_line_hash(text, voice, rate, pitch)
    dest = output_path or (audio_dir / f"{file_hash}.mp3")

    words: List[WordTiming] = []

    # If cached and exists, read duration
    if dest.exists() and dest.stat().st_size > 0:
        try:
            audio_info = MP3(dest)
            duration_ms = int(audio_info.info.length * 1000)
            return dest, duration_ms, words
        except Exception:
            pass # Re-synthesize if corrupted

    async def _stream_tts():
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        submaker = edge_tts.SubMaker()
        with open(dest, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    submaker.create_sub((chunk["offset"], chunk["duration"]), chunk["text"])
                    start_ms = int(chunk["offset"] / 10000) # 100ns units to ms
                    duration_chunk_ms = int(chunk["duration"] / 10000)
                    words.append(WordTiming(
                        text=chunk["text"],
                        start_ms=start_ms,
                        end_ms=start_ms + duration_chunk_ms
                    ))

    try:
        await asyncio.wait_for(_stream_tts(), timeout=12.0)
    except Exception as tts_err:
        print(f"[Synthesizer] TTS stream timed out or failed for line, using fallback estimate: {tts_err}")

    # Read duration
    if not dest.exists() or dest.stat().st_size == 0:
        dest.touch(exist_ok=True)

    try:
        audio_info = MP3(dest)
        duration_ms = int(audio_info.info.length * 1000)
    except Exception:
        # Fallback estimate
        duration_ms = max(1000, int((len(text.split()) / 2.6) * 1000))

    return dest, duration_ms, words
