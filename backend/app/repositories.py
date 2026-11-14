import json
import uuid
from datetime import datetime, timezone
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional, Dict, Any
from .config import settings

class Repository(ABC):
    @abstractmethod
    async def create_episode(self, owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_episode(self, owner_id: str, episode_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def list_episodes(self, owner_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_episode(self, owner_id: str, episode_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete_episode(self, owner_id: str, episode_id: str) -> bool:
        pass

    @abstractmethod
    async def clear_episodes(self, owner_id: str) -> int:
        pass

    @abstractmethod
    async def create_generation(self, owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_generation(self, owner_id: str, generation_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_generation(self, owner_id: str, generation_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass


class LocalFileRepository(Repository):
    def __init__(self, data_dir: Optional[str] = None):
        base = Path(data_dir or settings.MEDIA_DIR) / "data"
        self.episodes_file = base / "episodes.json"
        self.generations_file = base / "generations.json"
        base.mkdir(parents=True, exist_ok=True)
        self._init_files()

    def _init_files(self):
        for f in [self.episodes_file, self.generations_file]:
            if not f.exists():
                with open(f, "w", encoding="utf-8") as fp:
                    json.dump({}, fp)

    def _read_data(self, file_path: Path) -> Dict[str, Any]:
        try:
            with open(file_path, "r", encoding="utf-8") as fp:
                return json.load(fp)
        except Exception:
            return {}

    def _write_data(self, file_path: Path, data: Dict[str, Any]):
        with open(file_path, "w", encoding="utf-8") as fp:
            json.dump(data, fp, indent=2)

    async def create_episode(self, owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        records = self._read_data(self.episodes_file)
        ep_id = data.get("id") or str(uuid.uuid4())
        created_at = data.get("created_at") or datetime.now(timezone.utc).isoformat()
        record = {**data, "id": ep_id, "owner_id": owner_id, "created_at": created_at}
        records[ep_id] = record
        self._write_data(self.episodes_file, records)
        return record

    async def get_episode(self, owner_id: str, episode_id: str) -> Optional[Dict[str, Any]]:
        records = self._read_data(self.episodes_file)
        record = records.get(episode_id)
        if record and (record.get("owner_id") == owner_id or owner_id == "demo"):
            return record
        return None

    async def list_episodes(self, owner_id: str) -> List[Dict[str, Any]]:
        records = self._read_data(self.episodes_file)
        matching = [r for r in records.values() if r.get("owner_id") == owner_id or owner_id == "demo"]
        # Return newest first (reverse chronological order)
        return list(reversed(matching))

    async def update_episode(self, owner_id: str, episode_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        records = self._read_data(self.episodes_file)
        record = records.get(episode_id)
        if not record or (record.get("owner_id") != owner_id and owner_id != "demo"):
            return None
        record.update(data)
        records[episode_id] = record
        self._write_data(self.episodes_file, records)
        return record

    async def delete_episode(self, owner_id: str, episode_id: str) -> bool:
        records = self._read_data(self.episodes_file)
        if episode_id in records:
            del records[episode_id]
            self._write_data(self.episodes_file, records)
            return True
        return False

    async def clear_episodes(self, owner_id: str) -> int:
        records = self._read_data(self.episodes_file)
        count = len(records)
        self._write_data(self.episodes_file, {})
        return count

    async def create_generation(self, owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        records = self._read_data(self.generations_file)
        gen_id = data.get("id") or str(uuid.uuid4())
        record = {**data, "id": gen_id, "owner_id": owner_id}
        records[gen_id] = record
        self._write_data(self.generations_file, records)
        return record

    async def get_generation(self, owner_id: str, generation_id: str) -> Optional[Dict[str, Any]]:
        records = self._read_data(self.generations_file)
        record = records.get(generation_id)
        if record and (record.get("owner_id") == owner_id or owner_id == "demo"):
            return record
        return None

    async def update_generation(self, owner_id: str, generation_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        records = self._read_data(self.generations_file)
        record = records.get(generation_id)
        if not record or (record.get("owner_id") != owner_id and owner_id != "demo"):
            return None
        record.update(data)
        records[generation_id] = record
        self._write_data(self.generations_file, records)
        return record


class SupabaseRepository(Repository):
    def __init__(self, supabase_url: str, secret_key: str):
        from supabase import create_client
        self.client = create_client(supabase_url, secret_key)

    async def create_episode(self, owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        payload = {**data, "owner_id": owner_id}
        res = self.client.table("episodes").insert(payload).execute()
        return res.data[0] if res.data else payload

    async def get_episode(self, owner_id: str, episode_id: str) -> Optional[Dict[str, Any]]:
        res = self.client.table("episodes").select("*").eq("id", episode_id).eq("owner_id", owner_id).execute()
        return res.data[0] if res.data else None

    async def list_episodes(self, owner_id: str) -> List[Dict[str, Any]]:
        res = self.client.table("episodes").select("*").eq("owner_id", owner_id).order("created_at", desc=True).execute()
        return res.data or []

    async def update_episode(self, owner_id: str, episode_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = self.client.table("episodes").update(data).eq("id", episode_id).eq("owner_id", owner_id).execute()
        return res.data[0] if res.data else None

    async def delete_episode(self, owner_id: str, episode_id: str) -> bool:
        self.client.table("episodes").delete().eq("id", episode_id).eq("owner_id", owner_id).execute()
        return True

    async def clear_episodes(self, owner_id: str) -> int:
        res = self.client.table("episodes").delete().eq("owner_id", owner_id).execute()
        return len(res.data) if res.data else 0

    async def create_generation(self, owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        payload = {**data, "owner_id": owner_id}
        res = self.client.table("generations").insert(payload).execute()
        return res.data[0] if res.data else payload

    async def get_generation(self, owner_id: str, generation_id: str) -> Optional[Dict[str, Any]]:
        res = self.client.table("generations").select("*").eq("id", generation_id).eq("owner_id", owner_id).execute()
        return res.data[0] if res.data else None

    async def update_generation(self, owner_id: str, generation_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = self.client.table("generations").update(data).eq("id", generation_id).eq("owner_id", owner_id).execute()
        return res.data[0] if res.data else None


def get_repository() -> Repository:
    if (
        settings.DEMO_MODE
        or not settings.SUPABASE_URL
        or not settings.SUPABASE_SECRET_KEY
        or "your-project" in settings.SUPABASE_URL
    ):
        return LocalFileRepository()
    try:
        return SupabaseRepository(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
    except Exception:
        return LocalFileRepository()
