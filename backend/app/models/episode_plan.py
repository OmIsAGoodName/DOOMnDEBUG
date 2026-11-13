from typing import List, Optional, Literal, Union, Tuple
from pydantic import BaseModel, Field, field_validator

class Palette(BaseModel):
    primary: str
    secondary: str
    accent: str
    outline: str

class VoiceConfig(BaseModel):
    engine_voice: str
    rate: str = "+0%"
    pitch: str = "+0Hz"

class CastMember(BaseModel):
    character_id: str
    name: str
    species: str
    palette: Palette
    accessories: List[str] = Field(default_factory=list)
    voice: VoiceConfig

class ActionBase(BaseModel):
    delay: Optional[float] = 0.0
    duration: Optional[float] = None

class ActionSpawnCharacter(ActionBase):
    type: Literal["SPAWN_CHARACTER"]
    character_id: str
    position: Tuple[float, float]
    facing: Optional[Literal["left", "right"]] = "right"
    expression: Optional[str] = "neutral"
    animation: Optional[str] = "idle"
    entrance: Optional[Literal["fade", "slide_left", "slide_right", "pop"]] = None

class ActionRemoveCharacter(ActionBase):
    type: Literal["REMOVE_CHARACTER"]
    character_id: str
    exit: Optional[Literal["fade", "slide_left", "slide_right"]] = None

class ActionMoveTo(ActionBase):
    type: Literal["MOVE_TO"]
    character_id: str
    to: Tuple[float, float]
    duration: float

class ActionPlayAnimation(ActionBase):
    type: Literal["PLAY_ANIMATION"]
    character_id: str
    animation: str
    loop: Optional[bool] = False

class ActionSetExpression(ActionBase):
    type: Literal["SET_EXPRESSION"]
    character_id: str
    expression: str

class ActionSetCamera(ActionBase):
    type: Literal["SET_CAMERA"]
    shot: Literal["wide", "medium", "close"]
    movement: Literal["static", "slow_push_in", "slow_pull_out", "pan_left", "pan_right"]
    focus_character_id: Optional[str] = None

class ActionSetMood(ActionBase):
    type: Literal["SET_MOOD"]
    mood: Literal["day", "sunset", "night", "cozy", "magical"]
    transition: Optional[float] = 0.5

class ActionAttachProp(ActionBase):
    type: Literal["ATTACH_PROP"]
    prop_id: str
    character_id: Optional[str] = None
    position: Optional[Tuple[float, float]] = None
    slot: Optional[Literal["hand", "head", "ground"]] = "hand"
    remove: Optional[bool] = False

class ActionInteract(ActionBase):
    type: Literal["INTERACT"]
    kind: Literal["wave_at", "high_five", "hand_off", "hug"]
    character_id: str
    target_id: str
    prop_id: Optional[str] = None

class ActionPlaySfx(ActionBase):
    type: Literal["PLAY_SFX"]
    sfx_id: str
    volume: Optional[float] = 1.0

class ActionPlayMusic(ActionBase):
    type: Literal["PLAY_MUSIC"]
    music_id: Optional[str] = None
    volume: Optional[float] = 0.5
    fade: Optional[float] = 1.0

class ActionWait(ActionBase):
    type: Literal["WAIT"]
    duration: float

Action = Union[
    ActionSpawnCharacter,
    ActionRemoveCharacter,
    ActionMoveTo,
    ActionPlayAnimation,
    ActionSetExpression,
    ActionSetCamera,
    ActionSetMood,
    ActionAttachProp,
    ActionInteract,
    ActionPlaySfx,
    ActionPlayMusic,
    ActionWait
]

class ChoiceOption(BaseModel):
    id: str
    label: str
    keywords: List[str] = Field(default_factory=list)
    next_scene: str

class Choice(BaseModel):
    options: List[ChoiceOption]
    default: str

class Speech(BaseModel):
    type: Literal["NARRATE", "SPEAK"]
    text: str
    character_id: Optional[str] = None
    expression: Optional[str] = None

    @field_validator("type", mode="before")
    @classmethod
    def normalize_speech_type(cls, v):
        if isinstance(v, str) and v.upper() in ("DIALOGUE", "SAY", "TALK"):
            return "SPEAK"
        return v

class Beat(BaseModel):
    beat_id: str
    speech: Optional[Speech] = None
    actions: List[Action] = Field(default_factory=list)
    choice: Optional[Choice] = None
    min_duration: Optional[float] = None

class PlacedProp(BaseModel):
    prop_id: str
    position: Tuple[float, float]

class PlacedCharacter(BaseModel):
    character_id: str
    position: Tuple[float, float]
    facing: Optional[Literal["left", "right"]] = "right"
    expression: Optional[str] = "neutral"
    animation: Optional[str] = "idle"

class Scene(BaseModel):
    scene_id: str
    background_id: str
    mood: str
    next_scene: Optional[str] = None
    props: List[PlacedProp] = Field(default_factory=list)
    characters: List[PlacedCharacter] = Field(default_factory=list)
    beats: List[Beat]

class SafetyVerdict(BaseModel):
    age_fit: float = 0.0
    scary: float = 0.0
    verdict: Literal["pass", "needs_review", "fail"] = "pass"
    notes: str = ""

class ContinuityReport(BaseModel):
    violations: List[str] = Field(default_factory=list)

class EpisodePlan(BaseModel):
    schema_version: str = "1.0"
    episode_id: str
    series_id: Optional[str] = None
    age_band: Literal["3-5", "4-6", "6-8"]
    language: str = "en"
    title: str
    start_scene: str
    interactive: bool = False
    cast: List[CastMember]
    scenes: List[Scene]
    safety: Optional[SafetyVerdict] = None
    continuity: Optional[ContinuityReport] = None

