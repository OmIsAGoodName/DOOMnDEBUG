from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
from .config import settings

def is_supabase_configured() -> bool:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SECRET_KEY:
        return False
    if "your-project" in settings.SUPABASE_URL or "your-secret" in settings.SUPABASE_SECRET_KEY:
        return False
    return True

def get_supabase_admin_client():
    if not is_supabase_configured():
        return None
    try:
        from supabase import create_client
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
    except Exception:
        return None

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    client = get_supabase_admin_client()
    # In local development without configured Supabase credentials or when unauthenticated
    if not client or settings.DEMO_MODE or not authorization or not authorization.startswith("Bearer "):
        return {"user_id": "demo", "email": "demo@voxfable.local"}

    token = authorization.split("Bearer ", 1)[1].strip()
    try:
        user_res = client.auth.get_user(token)
        if not user_res or not user_res.user:
            return {"user_id": "demo", "email": "demo@voxfable.local"}
        return {"user_id": str(user_res.user.id), "email": user_res.user.email}
    except Exception:
        return {"user_id": "demo", "email": "demo@voxfable.local"}
