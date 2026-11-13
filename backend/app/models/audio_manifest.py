from typing import List, Optional
from pydantic import BaseModel, Field

class WordTiming(BaseModel):
    text: str
    start_ms: int
    end_ms: int

class AudioLine(BaseModel):
    line_id: str
    scene_id: str
    beat_id: str
    speaker: str
    url: str
    duration_ms: int
    words: List[WordTiming] = Field(default_factory=list)

class MusicAsset(BaseModel):
    music_id: str
    url: str

class SfxAsset(BaseModel):
    sfx_id: str
    url: str

class AudioManifest(BaseModel):
    episode_id: str
    lines: List[AudioLine]
    music: List[MusicAsset] = Field(default_factory=list)
    sfx: List[SfxAsset] = Field(default_factory=list)

