from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class WorldConfig(BaseModel):
    setting: str
    rules: List[str] = Field(default_factory=list)

class Series(BaseModel):
    id: str
    title: str
    world: WorldConfig
    tone: str
    age_band: Literal["3-5", "4-6", "6-8"]
    language: str = "en"
    character_ids: List[str] = Field(default_factory=list)
