import copy
from typing import Tuple, List, Dict, Any, Set
from ..models.episode_plan import EpisodePlan, Scene, Beat, Action, CastMember, Palette, VoiceConfig
from .resolver import AssetResolver

def clamp_x(x: float) -> float:
    return max(0.05, min(0.95, round(x, 3)))

def clamp_y(y: float) -> float:
    return max(0.62, min(0.92, round(y, 3)))

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
                orig_pos = char.position
                char.position = (clamp_x(char.position[0]), clamp_y(char.position[1]))
                if char.position != orig_pos:
                    repairs.append(f"Clamped character {char.character_id} pos {orig_pos} -> {char.position}")

            # Clamp initial props
            for prop in scene.props:
                orig_pos = prop.position
                prop.position = (clamp_x(prop.position[0]), clamp_y(prop.position[1]))
                resolved_prop, rep = self.resolver.resolve_prop(prop.prop_id)
                if rep:
                    repairs.append(rep)
                    prop.prop_id = resolved_prop

            # Ensure choice beat is last beat
            choice_beat_idx = -1
            for b_idx, beat in enumerate(scene.beats):
                if beat.choice:
                    choice_beat_idx = b_idx

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
                    if hasattr(act, "to") and act.to:
                        act.to = (clamp_x(act.to[0]), clamp_y(act.to[1]))
                    if hasattr(act, "position") and act.position:
                        act.position = (clamp_x(act.position[0]), clamp_y(act.position[1]))

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
