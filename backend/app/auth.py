from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
from .config import settings

def get_supabase_admin_client():
    if not settings.SUPABASE_URL or not settings.SUPABASE_SECRET_KEY:
        return None
    try:
        from supabase import create_client
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
    except Exception:
        return None

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    client = get_supabase_admin_client()
    # In local development without configured Supabase credentials or when demo mode is active
    if not client or settings.DEMO_MODE:
        return {"user_id": "demo", "email": "demo@voxfable.local"}

    if not authorization or not authorization.startswith("Bearer "):
        return {"user_id": "demo", "email": "demo@voxfable.local"}

    token = authorization.split("Bearer ", 1)[1].strip()
    client = get_supabase_admin_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "SERVICE_UNAVAILABLE", "message": "Supabase client unconfigured on server"}
        )

    try:
        user_res = client.auth.get_user(token)
        if not user_res or not user_res.user:
            raise ValueError("No user returned")
        return {"user_id": str(user_res.user.id), "email": user_res.user.email}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": f"Authentication failed: {str(e)}"}
        )
