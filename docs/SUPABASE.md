# Supabase Setup and Configuration Guide

Owner: Om

---

## 1. Project Creation & Dashboard Setup

1. **Create Project**: Go to [Supabase Dashboard](https://database.new) and create project `voxfable`.
2. **Turn Off Email Confirmation** (Critical for smooth hackathon demo):
   * Go to **Authentication** > **Providers** > **Email**.
   * Toggle **Confirm email** to **OFF** (Disabled).
   * Save changes.
3. **Copy Keys & URLs**:
   * Go to **Project Settings** > **API**.
   * **Project URL**: e.g., `https://xyzcompany.supabase.co`
   * **Project API Keys**:
     * `anon` / `publishable`: Put in `frontend/.env` as `VITE_SUPABASE_PUBLISHABLE_KEY`.
     * `service_role` / `secret`: Put in `backend/.env` as `SUPABASE_SECRET_KEY` (Never expose to frontend!).

---

## 2. Running Migrations

### Method A: SQL Editor (Fastest)
1. In the Supabase Dashboard, click **SQL Editor** on the left navigation bar.
2. Click **New Query**.
3. Open `supabase/migrations/0001_init.sql` from this repository, copy its entire contents, and paste into the SQL Editor.
4. Click **Run**.
5. Verify in **Table Editor** that `profiles`, `series`, `characters`, `generations`, and `episodes` appear with RLS enabled (indicated by a shield/padlock icon).

---

## 3. Environment Variables Configuration

### `frontend/.env`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
VITE_API_BASE=http://localhost:8000
```

### `backend/.env`
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-service-role-or-secret-key
DEMO_MODE=false
```

---

## 4. Testing RLS (Two-Account Isolation Test)

Run the automated test script to verify that:
1. User A can sign up and insert data.
2. User B cannot select, update, or delete User A's data.
3. Backend secret client (bypassing RLS) can read all data.

```bash
python scripts/test_rls.py
```
Expected output: `[PASS] Row Level Security verified.`
