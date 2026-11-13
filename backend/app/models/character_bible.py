from typing import List, Optional
from pydantic import BaseModel, Field
from .episode_plan import Palette, VoiceConfig

class CharacterLook(BaseModel):
    palette: Palette
    accessories: List[str] = Field(default_factory=list)

class CharacterBible(BaseModel):
    id: str
    name: str
    species: str
    personality: List[str] = Field(default_factory=list)
    catchphrases: List[str] = Field(default_factory=list)
    voice: VoiceConfig
    look: CharacterLook
    rules: List[str] = Field(default_factory=list)
    animations: List[str] = Field(default_factory=list)
    expressions: List[str] = Field(default_factory=list)
