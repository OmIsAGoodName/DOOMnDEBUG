import copy
from typing import Tuple, List, Dict, Any, Set, Optional
from ..models.episode_plan import EpisodePlan, Scene, Beat, Action, CastMember, Palette, VoiceConfig
from .resolver import AssetResolver

def clamp_x(x: float) -> float:
    return max(0.05, min(0.95, round(float(x), 3)))

def clamp_y(y: float) -> float:
    return max(0.62, min(0.92, round(float(y), 3)))

def extract_pos(item: Any, default: Tuple[float, float] = (0.5, 0.76)) -> Tuple[float, float]:
    """Safely extracts (x, y) coordinates from an object or dictionary in any format."""
    raw = getattr(item, "position", None) if not isinstance(item, dict) else item.get("position")
    if raw is None:
        return default
    if isinstance(raw, dict):
        x = raw.get("x", raw.get("left", default[0]))
        y = raw.get("y", raw.get("top", default[1]))
        try:
            return (float(x), float(y))
        except (ValueError, TypeError):
            return default
    if isinstance(raw, (list, tuple)) and len(raw) >= 2:
        try:
            return (float(raw[0]), float(raw[1]))
        except (ValueError, TypeError):
            return default
    return default

def update_pos(item: Any, new_pos: Tuple[float, float]):
    """Safely sets position tuple on either a model instance or dictionary."""
    if isinstance(item, dict):
        item["position"] = new_pos
    elif hasattr(item, "position"):
        try:
            item.position = new_pos
        except Exception:
            pass

def extract_to(item: Any) -> Optional[Tuple[float, float]]:
    """Safely extracts target 'to' coordinate from an action model or dict."""
    raw = getattr(item, "to", None) if not isinstance(item, dict) else item.get("to")
    if raw is None:
        return None
    if isinstance(raw, dict):
        x = raw.get("x", raw.get("left", 0.5))
        y = raw.get("y", raw.get("top", 0.76))
        try:
            return (float(x), float(y))
        except (ValueError, TypeError):
            return None
    if isinstance(raw, (list, tuple)) and len(raw) >= 2:
        try:
            return (float(raw[0]), float(raw[1]))
        except (ValueError, TypeError):
            return None
    return None

def update_to(item: Any, new_to: Tuple[float, float]):
    """Safely sets 'to' tuple on either an action model or dictionary."""
    if isinstance(item, dict):
        item["to"] = new_to
    elif hasattr(item, "to"):
        try:
            item.to = new_to
        except Exception:
            pass

class PlanValidator:
    def __init__(self, resolver: AssetResolver = None):
        self.resolver = resolver or AssetResolver()

    def validate_and_repair(self, plan: EpisodePlan) -> Tuple[EpisodePlan, List[str]]:
        repairs: List[str] = []
        p = copy.deepcopy(plan)

        # 1. Backgrounds & Scene IDs
        scene_ids: Set[str] = {s.scene_id for s in p.scenes}
        if not p.scenes:
            repairs.append("Empty scenes list: injected default sc1")
            p.scenes = [Scene(scene_id="sc1", background_id="forest_day", mood="day", beats=[])]
            scene_ids = {"sc1"}

        if p.start_scene not in scene_ids:
            old_start = p.start_scene
            p.start_scene = p.scenes[0].scene_id
            repairs.append(f"Dangling start_scene '{old_start}' repaired to '{p.start_scene}'")

        # 2. Characters in Cast
        cast_ids = {c.character_id for c in p.cast}
        for c in p.cast:
            resolved_id, rep = self.resolver.resolve_character(c.character_id)
            if rep:
                repairs.append(rep)
                c.character_id = resolved_id

        # 3. Inspect Scenes and Beats
        for s_idx, scene in enumerate(p.scenes):
            # Resolve background
            resolved_bg, rep = self.resolver.resolve_background(scene.background_id)
            if rep:
                repairs.append(rep)
                scene.background_id = resolved_bg

            # Verify next_scene exists
            if scene.next_scene and scene.next_scene not in scene_ids:
                repairs.append(f"Scene '{scene.scene_id}' next_scene '{scene.next_scene}' does not exist -> set to null")
                scene.next_scene = None

            # Clamp initial character placements
            for char in scene.characters:
                orig_pos = extract_pos(char, default=(0.5, 0.76))
                clamped = (clamp_x(orig_pos[0]), clamp_y(orig_pos[1]))
                update_pos(char, clamped)
                cid = char.get("character_id", "unknown") if isinstance(char, dict) else getattr(char, "character_id", "unknown")
                if clamped != orig_pos:
                    repairs.append(f"Clamped character {cid} pos {orig_pos} -> {clamped}")

            # Clamp initial props
            for prop in scene.props:
                orig_pos = extract_pos(prop, default=(0.5, 0.76))
                clamped = (clamp_x(orig_pos[0]), clamp_y(orig_pos[1]))
                update_pos(prop, clamped)
                pid = prop.get("prop_id", "prop") if isinstance(prop, dict) else getattr(prop, "prop_id", "prop")
                resolved_prop, rep = self.resolver.resolve_prop(pid)
                if rep:
                    repairs.append(rep)
                    if isinstance(prop, dict):
                        prop["prop_id"] = resolved_prop
                    elif hasattr(prop, "prop_id"):
                        prop.prop_id = resolved_prop

            # Ensure choice beat is last beat & validate choice options
            choice_beat_idx = -1
            for b_idx, beat in enumerate(scene.beats):
                if beat.choice:
                    choice_beat_idx = b_idx
                    # Validate that all option branch targets exist in scene_ids
                    for opt in beat.choice.options:
                        if opt.next_scene and opt.next_scene not in scene_ids:
                            fallback_sc = p.scenes[-1].scene_id
                            repairs.append(f"Option '{opt.id}' target '{opt.next_scene}' does not exist -> defaulted to '{fallback_sc}'")
                            opt.next_scene = fallback_sc

            if choice_beat_idx != -1 and choice_beat_idx != len(scene.beats) - 1:
                repairs.append(f"Scene '{scene.scene_id}': Choice was beat #{choice_beat_idx}; moved to final beat")
                choice_beat = scene.beats.pop(choice_beat_idx)
                scene.beats.append(choice_beat)

            # Validate each beat
            for beat in scene.beats:
                if beat.speech:
                    # Resolve speaker
                    if beat.speech.character_id:
                        resolved_speaker, rep = self.resolver.resolve_character(beat.speech.character_id)
                        if rep:
                            repairs.append(rep)
                            beat.speech.character_id = resolved_speaker
                    # Word limit check (< 25 words)
                    words = beat.speech.text.split()
                    if len(words) > 25:
                        repairs.append(f"Beat '{beat.beat_id}': Speech had {len(words)} words; trimmed to 24 words")
                        beat.speech.text = " ".join(words[:24]) + "..."

                # Validate Actions
                valid_actions = []
                for act in beat.actions:
                    # Numeric clamping on coordinates
                    target_to = extract_to(act)
                    if target_to:
                        update_to(act, (clamp_x(target_to[0]), clamp_y(target_to[1])))

                    target_pos = extract_pos(act, default=None)
                    if target_pos is not None:
                        update_pos(act, (clamp_x(target_pos[0]), clamp_y(target_pos[1])))

                    # Duration checks
                    if hasattr(act, "duration") and act.duration is not None and act.duration <= 0:
                        repairs.append(f"Action {act.type} non-positive duration {act.duration}s repaired to 1.0s")
                        act.duration = 1.0

                    # Resolve asset IDs in actions
                    if hasattr(act, "prop_id") and act.prop_id:
                        resolved_p, rep = self.resolver.resolve_prop(act.prop_id)
                        if rep:
                            repairs.append(rep)
                            act.prop_id = resolved_p

                    if hasattr(act, "sfx_id") and act.sfx_id:
                        resolved_s, rep = self.resolver.resolve_sfx(act.sfx_id)
                        if rep:
                            repairs.append(rep)
                            act.sfx_id = resolved_s

                    if hasattr(act, "music_id") and act.music_id:
                        resolved_m, rep = self.resolver.resolve_music(act.music_id)
                        if rep:
                            repairs.append(rep)
                            act.music_id = resolved_m

                    if hasattr(act, "character_id") and act.character_id:
                        resolved_c, rep = self.resolver.resolve_character(act.character_id)
                        if rep:
                            repairs.append(rep)
                            act.character_id = resolved_c
                        # Ensure character is in cast
                        if resolved_c not in cast_ids:
                            repairs.append(f"Character '{resolved_c}' used in action but missing from cast; added to cast")
                            p.cast.append(CastMember(
                                character_id=resolved_c,
                                name=resolved_c.capitalize(),
                                species="friend",
                                palette=Palette(primary="#8b5e3c", secondary="#d9b38c", accent="#f2a65a", outline="#3b2a1e"),
                                voice=VoiceConfig(engine_voice="en-US-AnaNeural")
                            ))
                            cast_ids.add(resolved_c)

                    valid_actions.append(act)

                beat.actions = valid_actions

        return p, repairs

validator = PlanValidator()

def validate_plan(plan: EpisodePlan) -> Tuple[EpisodePlan, List[str]]:
    return validator.validate_and_repair(plan)
