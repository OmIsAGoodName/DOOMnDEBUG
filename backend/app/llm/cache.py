import hashlib
import json
from pathlib import Path
from typing import Optional, Dict, Any
from ..config import settings

class LLMCache:
    def __init__(self, cache_dir: Optional[str] = None):
        self.dir = Path(cache_dir or settings.MEDIA_DIR) / "cache"
        self.dir.mkdir(parents=True, exist_ok=True)

    def _make_key(self, system: str, user: str, schema_name: str, temperature: float) -> str:
        content = f"{system}|||{user}|||{schema_name}|||{temperature:.2f}"
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def get(self, system: str, user: str, schema_name: str, temperature: float) -> Optional[Dict[str, Any]]:
        key = self._make_key(system, user, schema_name, temperature)
        path = self.dir / f"{key}.json"
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return None
        return None

    def set(self, system: str, user: str, schema_name: str, temperature: float, data: Dict[str, Any]):
        key = self._make_key(system, user, schema_name, temperature)
        path = self.dir / f"{key}.json"
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass

    def clear(self):
        """Clears all cached LLM JSON files so switching providers generates fresh output."""
        try:
            for p in self.dir.glob("*.json"):
                try:
                    p.unlink()
                except Exception:
                    pass
        except Exception:
            pass

cache = LLMCache()
