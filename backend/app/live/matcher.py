import re
import string
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..llm.adapter import generate_json

class MatchOption(BaseModel):
    id: str
    label: str
    keywords: List[str] = []

class LiveMatchRequest(BaseModel):
    prompt: str
    options: List[MatchOption]
    transcript: str

class LiveMatchResult(BaseModel):
    option_id: str
    confidence: float
    method: str # "keyword" | "llm" | "default"

_match_cache: Dict[str, LiveMatchResult] = {}

def clean_word(w: str) -> str:
    w = w.lower().strip(string.punctuation)
    if w.endswith("s") and len(w) > 3:
        w = w[:-1] # simple plural stemming
    return w

def score_keywords(transcript: str, option: MatchOption) -> int:
    t_words = set(clean_word(w) for w in transcript.split())
    # Candidate words from label and keywords
    candidate_words = set()
    for kw in option.keywords:
        for w in kw.split():
            candidate_words.add(clean_word(w))
    for w in option.label.split():
        candidate_words.add(clean_word(w))

    # Calculate word intersection
    intersection = t_words.intersection(candidate_words)
    return len(intersection)

async def match_transcript(
    prompt: str,
    options: List[MatchOption],
    transcript: str,
    llm_fn = generate_json
) -> LiveMatchResult:
    if not options:
        return LiveMatchResult(option_id="", confidence=0.0, method="default")

    cache_key = f"{prompt}|||{transcript}|||{[o.id for o in options]}"
    if cache_key in _match_cache:
        return _match_cache[cache_key]

    default_option_id = options[0].id

    # Step 1: Keyword scoring
    scores = [(opt, score_keywords(transcript, opt)) for opt in options]
    scores.sort(key=lambda x: x[1], reverse=True)

    top_opt, top_score = scores[0]
    runner_up_score = scores[1][1] if len(scores) > 1 else 0

    if top_score > 0 and top_score > runner_up_score:
        result = LiveMatchResult(option_id=top_opt.id, confidence=0.95, method="keyword")
        _match_cache[cache_key] = result
        return result

    # Step 2: LLM matching with 2.5s timeout
    class LLMMatchOutput(BaseModel):
        option_id: Optional[str]
        confidence: float

    system = "You are a fast intent classifier for a children's interactive story choice."
    user = f"""The character asked: "{prompt}"
Options:
{chr(10).join(f"- {o.id}: {o.label} (keywords: {', '.join(o.keywords)})" for o in options)}

Child said: "{transcript}"
Pick the option id that matches the child's response. If completely unrelated, set option_id to null.
Strict JSON format: {{"option_id": "<id or null>", "confidence": <0.0-1.0>}}"""

    try:
        data = await asyncio.wait_for(
            llm_fn(system=system, user=user, schema=LLMMatchOutput, temperature=0.1),
            timeout=2.5
        )
        matched_id = data.get("option_id")
        conf = float(data.get("confidence", 0.7))
        if matched_id and any(o.id == matched_id for o in options):
            result = LiveMatchResult(option_id=matched_id, confidence=conf, method="llm")
            _match_cache[cache_key] = result
            return result
    except Exception:
        pass # timeout or error

    # Step 3: Default fallback
    result = LiveMatchResult(option_id=default_option_id, confidence=0.5, method="default")
    _match_cache[cache_key] = result
    return result
