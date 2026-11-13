import re
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from ..models.episode_plan import EpisodePlan, ContinuityReport
from ..llm.adapter import generate_json

class ContinuityViolation(BaseModel):
    scene_id: str
    beat_id: str
    rule: str
    suggestion: str
    fixed: bool = False

class ContinuityAnalysis(BaseModel):
    violations: List[ContinuityViolation] = Field(default_factory=list)

def check_code_continuity(
    plan: EpisodePlan,
    bibles: Dict[str, Dict[str, Any]],
    series: Optional[Dict[str, Any]] = None
) -> List[ContinuityViolation]:
    violations = []

    # 1. Series cast membership
    if series and series.get("character_ids"):
        allowed = set(series["character_ids"])
        for c in plan.cast:
            if c.character_id not in allowed:
                violations.append(ContinuityViolation(
                    scene_id="global",
                    beat_id="global",
                    rule=f"Character '{c.character_id}' is not a member of series '{series.get('title')}'",
                    suggestion=f"Replace with one of {list(allowed)}",
                    fixed=False
                ))

    # 2. Bible rules
    for c in plan.cast:
        bible = bibles.get(c.character_id, {})
        rules = bible.get("rules", [])
        for rule in rules:
            rule_lower = rule.lower()
            # Example rule: "Pip never flies at night"
            if "never flies at night" in rule_lower or "no night flying" in rule_lower:
                for sc in plan.scenes:
                    if "night" in sc.background_id.lower() or sc.mood == "night":
                        for beat in sc.beats:
                            text = (beat.speech.text if beat.speech else "").lower()
                            if "fly" in text or "flies" in text or "soar" in text:
                                violations.append(ContinuityViolation(
                                    scene_id=sc.scene_id,
                                    beat_id=beat.beat_id,
                                    rule=rule,
                                    suggestion="Pip should walk or perch on a branch instead of flying at night.",
                                    fixed=False
                                ))

    return violations

async def check_and_fix_continuity(
    plan: EpisodePlan,
    bibles: Optional[Dict[str, Dict[str, Any]]] = None,
    series: Optional[Dict[str, Any]] = None,
    llm_fn = generate_json
) -> EpisodePlan:
    bibles = bibles or {}
    code_violations = check_code_continuity(plan, bibles, series)

    # If code violations found, fix them in one pass
    fixed_logs = []
    for v in code_violations:
        # Auto-fix rule: "never flies at night"
        if "never flies at night" in v.rule.lower():
            for sc in plan.scenes:
                if sc.scene_id == v.scene_id:
                    for beat in sc.beats:
                        if beat.beat_id == v.beat_id and beat.speech:
                            beat.speech.text = beat.speech.text.replace("fly", "walk").replace("flies", "walks").replace("soar", "walk")
                            v.fixed = True
                            fixed_logs.append(f"Fixed rule '{v.rule}' in {v.scene_id}:{v.beat_id}")

    all_violations_strings = [
        f"[{'FIXED' if v.fixed else 'UNRESOLVED'}] {v.rule} ({v.scene_id}:{v.beat_id}): {v.suggestion}"
        for v in code_violations
    ]

    plan.continuity = ContinuityReport(violations=all_violations_strings)
    return plan
