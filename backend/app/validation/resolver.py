from typing import Dict, Any, List, Optional, Tuple
from ..stations.writer import load_metadata

class AssetResolver:
    def __init__(self, metadata: Optional[Dict[str, Any]] = None):
        self.metadata = metadata or load_metadata()
        self.char_ids = {c["id"] for c in self.metadata.get("characters", [])}
        self.bg_ids = {b["id"] for b in self.metadata.get("backgrounds", [])}
        self.prop_ids = {p["id"] for p in self.metadata.get("props", [])}
        self.sfx_ids = {s["id"] for s in self.metadata.get("sfx", [])}
        self.music_ids = {m["id"] for m in self.metadata.get("music", [])}

        self.default_char = "pip_owl"
        self.default_bg = "forest_day"
        self.default_prop = "flower"
        self.default_sfx = "sfx_pop"
        self.default_music = "music_calm"

    def resolve_character(self, char_id: str) -> Tuple[str, Optional[str]]:
        if char_id in self.char_ids:
            return char_id, None
        return self.default_char, f"Repaired unknown character '{char_id}' -> '{self.default_char}'"

    def resolve_background(self, bg_id: str) -> Tuple[str, Optional[str]]:
        if bg_id in self.bg_ids:
            return bg_id, None
        return self.default_bg, f"Repaired unknown background '{bg_id}' -> '{self.default_bg}'"

    def resolve_prop(self, prop_id: str) -> Tuple[str, Optional[str]]:
        if prop_id in self.prop_ids:
            return prop_id, None
        return self.default_prop, f"Repaired unknown prop '{prop_id}' -> '{self.default_prop}'"

    def resolve_sfx(self, sfx_id: str) -> Tuple[str, Optional[str]]:
        if sfx_id in self.sfx_ids:
            return sfx_id, None
        return self.default_sfx, f"Repaired unknown SFX '{sfx_id}' -> '{self.default_sfx}'"

    def resolve_music(self, music_id: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
        if not music_id or music_id in self.music_ids:
            return music_id, None
        return self.default_music, f"Repaired unknown Music '{music_id}' -> '{self.default_music}'"
