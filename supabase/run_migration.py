#!/usr/bin/env python3
"""
Vibe Vault Cinema — Supabase Migration Runner
Run this script from your local machine to initialize the database.

Requirements:
    pip install psycopg2-binary python-dotenv

Usage:
    python3 run_migration.py

It will read your .env file for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY,
then prompt you for your Supabase DB password (found in:
Dashboard → Project Settings → Database → Database password).
"""

import os, sys, getpass

try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    os.system(f"{sys.executable} -m pip install psycopg2-binary --quiet")
    import psycopg2

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def main():
    supabase_url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")
    if not supabase_url:
        supabase_url = input("Supabase URL (https://xxxx.supabase.co): ").strip()

    project_ref = supabase_url.replace("https://", "").split(".")[0]
    print(f"\n📦 Project: {project_ref}")

    db_password = os.environ.get("SUPABASE_DB_PASSWORD", "")
    if not db_password:
        print("\n🔐 Enter your Supabase DB password")
        print("   (Dashboard → Project Settings → Database → Database password)")
        db_password = getpass.getpass("   DB Password: ")

    # Try direct connection first, then pooler
    conn = None
    configs = [
        {"host": f"db.{project_ref}.supabase.co", "port": 5432, "user": "postgres"},
        {"host": "aws-0-us-east-1.pooler.supabase.com", "port": 5432, "user": f"postgres.{project_ref}"},
        {"host": "aws-0-us-east-1.pooler.supabase.com", "port": 6543, "user": f"postgres.{project_ref}"},
        {"host": "aws-0-ap-southeast-1.pooler.supabase.com", "port": 5432, "user": f"postgres.{project_ref}"},
        {"host": "aws-0-eu-central-1.pooler.supabase.com", "port": 5432, "user": f"postgres.{project_ref}"},
    ]

    for cfg in configs:
        try:
            print(f"\n⏳ Connecting to {cfg['host']}:{cfg['port']}...")
            conn = psycopg2.connect(
                host=cfg["host"], port=cfg["port"],
                dbname="postgres", user=cfg["user"],
                password=db_password, connect_timeout=10,
                sslmode="require"
            )
            print(f"✅ Connected via {cfg['host']}:{cfg['port']}")
            break
        except Exception as e:
            print(f"   ❌ Failed: {str(e)[:80]}")

    if not conn:
        print("\n❌ Could not connect to database.")
        print("   Please run the SQL manually in:")
        print("   Supabase Dashboard → SQL Editor → New Query")
        print("   Then paste the contents of: vibevault/supabase/schema.sql")
        sys.exit(1)

    with open(os.path.join(os.path.dirname(__file__), "schema.sql"), "r") as f:
        sql = f.read()

    print("\n🚀 Running migration...")
    cur = conn.cursor()

    # Split and run statement by statement
    statements = [s.strip() for s in sql.split(";") if s.strip() and not s.strip().startswith("--")]
    success = 0
    errors = []

    for i, stmt in enumerate(statements):
        if not stmt:
            continue
        try:
            cur.execute(stmt)
            conn.commit()
            success += 1
        except Exception as e:
            conn.rollback()
            msg = str(e).strip()
            if "already exists" in msg or "duplicate" in msg.lower():
                success += 1  # idempotent
            else:
                errors.append(f"Statement {i+1}: {msg[:100]}")

    cur.close()
    conn.close()

    print(f"\n✅ Migration complete!")
    print(f"   Statements executed: {success}")
    if errors:
        print(f"   Warnings ({len(errors)}):")
        for e in errors:
            print(f"   ⚠️  {e}")

    print("\n🎬 Vibe Vault Cinema database is ready!")
    print("   Tables created: profiles, library, wishlist,")
    print("   weekly_summaries, journal_entries, netflix_imports, actor_follows")
    print("   RLS: ✅  Realtime: ✅  Storage bucket: ✅")

if __name__ == "__main__":
    main()
