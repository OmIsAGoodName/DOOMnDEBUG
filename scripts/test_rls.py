import os
import sys
import uuid
from pathlib import Path
from dotenv import dotenv_values

def main():
    root = Path(__file__).resolve().parent.parent
    backend_env = dotenv_values(root / "backend" / ".env")
    frontend_env = dotenv_values(root / "frontend" / ".env")

    supabase_url = backend_env.get("SUPABASE_URL") or frontend_env.get("VITE_SUPABASE_URL")
    secret_key = backend_env.get("SUPABASE_SECRET_KEY")
    publishable_key = (
        frontend_env.get("VITE_SUPABASE_PUBLISHABLE_KEY")
        or backend_env.get("SUPABASE_PUBLISHABLE_KEY")
    )

    if not supabase_url or not secret_key:
        print("[FAIL] Missing SUPABASE_URL or SUPABASE_SECRET_KEY in backend/.env")
        print("Please configure backend/.env before running this test.")
        sys.exit(1)

    if not publishable_key:
        print("[FAIL] Missing VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env")
        print("Please configure frontend/.env before running this test.")
        sys.exit(1)

    try:
        from supabase import create_client, Client
    except ImportError:
        print("[FAIL] 'supabase' package is not installed. Run: pip install supabase")
        sys.exit(1)

    print("Connecting to Supabase (URL configured, keys hidden)...")

    # 1. Admin client with secret key
    admin_client: Client = create_client(supabase_url, secret_key)

    # 2. Test user credentials
    tag = uuid.uuid4().hex[:8]
    email_a = f"rls_test_a_{tag}@voxfable.test"
    email_b = f"rls_test_b_{tag}@voxfable.test"
    password = f"TestPass!_{uuid.uuid4().hex[:12]}"

    print("Registering Test User A and Test User B...")
    user_a_res = admin_client.auth.admin.create_user({
        "email": email_a,
        "password": password,
        "email_confirm": True,
        "user_metadata": {"display_name": "Test User A", "account_type": "parent"}
    })
    user_a_id = user_a_res.user.id

    user_b_res = admin_client.auth.admin.create_user({
        "email": email_b,
        "password": password,
        "email_confirm": True,
        "user_metadata": {"display_name": "Test User B", "account_type": "parent"}
    })
    user_b_id = user_b_res.user.id

    try:
        # Client for User A
        client_a = create_client(supabase_url, publishable_key)
        auth_a = client_a.auth.sign_in_with_password({"email": email_a, "password": password})
        token_a = auth_a.session.access_token

        # Client for User B
        client_b = create_client(supabase_url, publishable_key)
        auth_b = client_b.auth.sign_in_with_password({"email": email_b, "password": password})
        token_b = auth_b.session.access_token

        print(f"User A authenticated. Inserting a test series...")
        series_data = {
            "owner_id": user_a_id,
            "title": f"User A Secret Series {tag}",
            "tone": "playful",
            "age_band": "4-6",
            "world": {"setting": "magical woods"}
        }
        res_insert = client_a.table("series").insert(series_data).execute()
        if not res_insert.data:
            raise RuntimeError(f"User A failed to insert series: {res_insert}")
        series_id = res_insert.data[0]["id"]
        print(f"Series created with id {series_id}.")

        # User B attempts to read User A's series
        print("Testing User B access isolation...")
        res_read_b = client_b.table("series").select("*").eq("id", series_id).execute()
        if len(res_read_b.data) != 0:
            raise AssertionError(f"SECURITY BREACH: User B could SELECT User A's series! Data: {res_read_b.data}")

        # User B attempts to update User A's series
        res_update_b = client_b.table("series").update({"title": "Hacked Title"}).eq("id", series_id).execute()
        if len(res_update_b.data) != 0:
            raise AssertionError("SECURITY BREACH: User B could UPDATE User A's series!")

        # User B attempts to delete User A's series
        res_delete_b = client_b.table("series").delete().eq("id", series_id).execute()
        if len(res_delete_b.data) != 0:
            raise AssertionError("SECURITY BREACH: User B could DELETE User A's series!")

        print("Confirmed: User B cannot select, update, or delete User A's data.")

        # Backend admin read
        print("Testing backend secret client access...")
        res_admin = admin_client.table("series").select("*").eq("id", series_id).execute()
        if len(res_admin.data) != 1 or res_admin.data[0]["id"] != series_id:
            raise AssertionError("Backend admin client failed to read series with secret key.")
        print("Confirmed: Backend secret key can access all records.")

        # Clean up
        admin_client.table("series").delete().eq("id", series_id).execute()
        print("[PASS] Row Level Security (RLS) verified successfully.")

    finally:
        print("Cleaning up test users...")
        try:
            admin_client.auth.admin.delete_user(user_a_id)
            admin_client.auth.admin.delete_user(user_b_id)
        except Exception as e:
            print(f"Warning: could not delete test users: {e}")

if __name__ == "__main__":
    main()
