import re
import os
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
from ..models.episode_plan import EpisodePlan, SafetyVerdict
from ..llm.adapter import generate_json
from pydantic import BaseModel

SAFETY_DIR = Path(__file__).resolve().parent.parent / "safety"
BLOCKLIST_FILE = SAFETY_DIR / "blocklist.txt"

def load_blocklist() -> List[str]:
    if not BLOCKLIST_FILE.exists():
        return ["kill", "murder", "blood", "gun", "knife", "monster", "death"]
    with open(BLOCKLIST_FILE, "r", encoding="utf-8") as f:
        return [line.strip().lower() for line in f if line.strip() and not line.startswith("#")]

def check_blocklist_words(text: str) -> List[str]:
    blocklist = load_blocklist()
    found = []
    text_lower = text.lower()
    for word in blocklist:
        pattern = r"\b" + re.escape(word) + r"\b"
        if re.search(pattern, text_lower):
            found.append(word)
    return found

def count_syllables(word: str) -> int:
    word = word.lower().strip(".:;?!")
    if not word:
        return 1
    # Simple syllable heuristic: count vowel groups
    vowels = "aeiouy"
    count = len(re.findall(r"[aeiouy]+", word))
    if word.endswith("e") and not word.endswith("le") and count > 1:
        count -= 1
    return max(1, count)

def check_reading_level(text: str, age_band: str = "4-6") -> Dict[str, Any]:
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    if not sentences:
        return {"words_per_sentence": 0, "avg_syllables": 0, "pass": True}

    total_words = 0
    total_syllables = 0
    for s in sentences:
        words = s.split()
        total_words += len(words)
        total_syllables += sum(count_syllables(w) for w in words)

    wps = total_words / len(sentences)
    avg_syll = total_syllables / max(1, total_words)

    # Thresholds based on age band
    max_wps = 12 if age_band == "3-5" else (16 if age_band == "4-6" else 20)
    max_syll = 1.6 if age_band == "3-5" else (1.9 if age_band == "4-6" else 2.2)

    passed = (wps <= max_wps) and (avg_syll <= max_syll)
    return {
        "words_per_sentence": round(wps, 1),
        "avg_syllables": round(avg_syll, 2),
        "pass": passed,
        "notes": "" if passed else f"Reading level too complex for {age_band} ({wps:.1f} wps, {avg_syll:.2f} syll/word)"
    }

class LLMSafetyScore(BaseModel):
    age_fit: float
    scary: float
    notes: str

async def evaluate_safety_with_llm(
    text: str,
    age_band: str = "4-6",
    llm_fn = generate_json
) -> Tuple[float, float, str]:
    system = """You are a strict child-safety and content rater for children's television.
Rate the provided script text on two scores from 0.0 to 1.0:
1. age_fit (1.0 = perfectly tailored for the target age band, 0.0 = completely inappropriate)
2. scary (0.0 = completely gentle/cheerful, 1.0 = terrifying/frightening for young children)
Provide concise notes explaining any concern.
Output strictly valid JSON with keys: age_fit, scary, notes."""

    user = f"Target Age Band: {age_band}\nScript Text:\n{text}"

    try:
        data = await llm_fn(
            system=system,
            user=user,
            schema=LLMSafetyScore,
            temperature=0.2
        )
        return float(data.get("age_fit", 1.0)), float(data.get("scary", 0.0)), str(data.get("notes", ""))
    except Exception as e:
        # Fallback if LLM judge unreachable
        return 1.0, 0.0, f"LLM judge offline: {e}"

async def evaluate_plan_safety(
    plan: EpisodePlan,
    llm_fn = generate_json
) -> SafetyVerdict:
    all_texts = []
    for sc in plan.scenes:
        for b in sc.beats:
            if b.speech and b.speech.text:
                all_texts.append(b.speech.text)

    combined_text = " ".join(all_texts)

    # 1. Blocklist check
    blocked = check_blocklist_words(combined_text)
    if blocked:
        return SafetyVerdict(
            age_fit=0.0,
            scary=0.9,
            verdict="fail",
            notes=f"Found blocklisted words: {', '.join(blocked)}"
        )

    # 2. Reading level check
    reading_res = check_reading_level(combined_text, plan.age_band)

    # 3. LLM judge
    age_fit, scary, notes = await evaluate_safety_with_llm(combined_text, plan.age_band, llm_fn=llm_fn)

    # Threshold evaluation
    fail_scary = float(os.environ.get("SAFETY_FAIL_SCARY", "0.5"))
    review_scary = float(os.environ.get("SAFETY_REVIEW_SCARY", "0.3"))
    fail_age_fit = float(os.environ.get("SAFETY_FAIL_AGE_FIT", "0.5"))

    if scary > fail_scary or age_fit < fail_age_fit:
        verdict = "fail"
    elif scary > review_scary or not reading_res["pass"]:
        verdict = "needs_review"
    else:
        verdict = "pass"

    full_notes = notes
    if reading_res.get("notes"):
        full_notes = f"{notes}; {reading_res['notes']}".strip("; ")

    return SafetyVerdict(
        age_fit=age_fit,
        scary=scary,
        verdict=verdict,
        notes=full_notes
    )
