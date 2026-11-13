from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator

class DraftSpeech(BaseModel):
    type: Literal["NARRATE", "SPEAK"]
    character_id: Optional[str] = None
    text: str
    emotion: Optional[str] = "neutral"

    @field_validator("type", mode="before")
    @classmethod
    def normalize_speech_type(cls, v):
        if isinstance(v, str) and v.upper() in ("DIALOGUE", "SAY", "TALK"):
            return "SPEAK"
        return v

class DraftChoiceOption(BaseModel):
    id: str
    label: str
    keywords: List[str] = Field(default_factory=list)
    next_scene: str

class DraftChoice(BaseModel):
    prompt: str
    options: List[DraftChoiceOption]
    default: str

class DraftBeat(BaseModel):
    beat_id: str
    speech: DraftSpeech
    choice: Optional[DraftChoice] = None

class DraftScene(BaseModel):
    scene_id: str
    background_id: str
    mood: str
    summary: str
    beats: List[DraftBeat]
    next_scene: Optional[str] = None

class StoryDraft(BaseModel):
    title: str
    synopsis: str
    cast: List[str] # character_ids from metadata or series
    age_band: Literal["3-5", "4-6", "6-8"] = "4-6"
    language: str = "en"
    interactive: bool = False
    scenes: List[DraftScene]
    main_path: List[str] = Field(default_factory=list)
