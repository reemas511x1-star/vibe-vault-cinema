-- ============================================================
-- VIBE VAULT CINEMA — Full Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy search

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name     TEXT DEFAULT '',
  avatar_url       TEXT,
  language         TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar')),
  mood             TEXT DEFAULT 'Masculine Dark',
  weather          TEXT,
  is_public        BOOLEAN DEFAULT false,
  public_slug      TEXT UNIQUE,
  taste_summary    TEXT,
  netflix_connected BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. LIBRARY (core tracker)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.library (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id          INTEGER NOT NULL,
  media_type       TEXT NOT NULL CHECK (media_type IN ('movie', 'tv', 'anime')),
  title            TEXT NOT NULL,
  original_title   TEXT,
  poster_path      TEXT,
  backdrop_path    TEXT,
  year             TEXT,
  vote_average     NUMERIC(4,2),
  runtime          INTEGER,                    -- minutes (movie) or ep runtime (tv)
  genre_ids        INTEGER[] DEFAULT '{}',
  genres           TEXT[] DEFAULT '{}',
  overview         TEXT,
  status           TEXT NOT NULL DEFAULT 'planned'
                   CHECK (status IN ('watched', 'watching', 'planned')),
  rating           NUMERIC(3,1) CHECK (rating >= 0 AND rating <= 5),
  will_rewatch     BOOLEAN DEFAULT false,
  notes            TEXT,
  current_season   INTEGER DEFAULT 1,
  current_episode  INTEGER DEFAULT 1,
  total_seasons    INTEGER,
  total_episodes   INTEGER,
  date_watched     DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, media_type)
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_library_user_id ON public.library(user_id);
CREATE INDEX IF NOT EXISTS idx_library_status  ON public.library(user_id, status);
CREATE INDEX IF NOT EXISTS idx_library_type    ON public.library(user_id, media_type);
CREATE INDEX IF NOT EXISTS idx_library_created ON public.library(user_id, created_at DESC);

-- ============================================================
-- 3. WISHLIST / IMPROVEMENT IDEAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT DEFAULT 'note'
               CHECK (type IN ('note', 'feature_request', 'improvement', 'experience_rating')),
  title        TEXT NOT NULL,
  content      TEXT,
  feature_area TEXT,               -- e.g. "Search", "Stats", "Mood System"
  experience_rating INTEGER CHECK (experience_rating BETWEEN 1 AND 5),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'in_review')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);

-- ============================================================
-- 4. WEEKLY SUMMARIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start        DATE NOT NULL,
  week_end          DATE NOT NULL,
  titles_watched    JSONB DEFAULT '[]',       -- [{id, title, poster, media_type}]
  total_hours       NUMERIC(6,2) DEFAULT 0,
  new_titles_count  INTEGER DEFAULT 0,
  top_genre         TEXT,
  top_mood          TEXT,
  ai_message        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_user ON public.weekly_summaries(user_id, week_start DESC);

-- ============================================================
-- 5. NETFLIX IMPORT (CSV upload history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.netflix_imports (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename       TEXT,
  total_rows     INTEGER DEFAULT 0,
  matched_rows   INTEGER DEFAULT 0,
  failed_rows    INTEGER DEFAULT 0,
  status         TEXT DEFAULT 'processing'
                 CHECK (status IN ('processing', 'completed', 'failed')),
  imported_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_netflix_user ON public.netflix_imports(user_id);

-- ============================================================
-- 6. AI JOURNAL ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  library_id  UUID REFERENCES public.library(id) ON DELETE CASCADE,
  tmdb_id     INTEGER,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT DEFAULT 'review'
              CHECK (type IN ('review', 'mood_match', 'comparison', 'weekly')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id, created_at DESC);

-- ============================================================
-- 7. ACTOR FOLLOWS (quick-add actor's works)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.actor_follows (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id    INTEGER NOT NULL,
  name       TEXT NOT NULL,
  profile_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id)
);

-- ============================================================
-- 8. UPDATED_AT AUTO-TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_library_updated_at
    BEFORE UPDATE ON public.library
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_wishlist_updated_at
    BEFORE UPDATE ON public.wishlist
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 9. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (is_public = true);

-- library
ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "library_crud_own" ON public.library;
DROP POLICY IF EXISTS "library_select_own" ON public.library;
DROP POLICY IF EXISTS "library_insert_own" ON public.library;
DROP POLICY IF EXISTS "library_update_own" ON public.library;
DROP POLICY IF EXISTS "library_delete_own" ON public.library;

CREATE POLICY "library_select_own" ON public.library FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "library_insert_own" ON public.library FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "library_update_own" ON public.library FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "library_delete_own" ON public.library FOR DELETE  USING (auth.uid() = user_id);

-- wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishlist_select_own" ON public.wishlist;
DROP POLICY IF EXISTS "wishlist_insert_own" ON public.wishlist;
DROP POLICY IF EXISTS "wishlist_update_own" ON public.wishlist;
DROP POLICY IF EXISTS "wishlist_delete_own" ON public.wishlist;

CREATE POLICY "wishlist_select_own" ON public.wishlist FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "wishlist_insert_own" ON public.wishlist FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlist_update_own" ON public.wishlist FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "wishlist_delete_own" ON public.wishlist FOR DELETE  USING (auth.uid() = user_id);

-- weekly_summaries
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weekly_select_own" ON public.weekly_summaries;
DROP POLICY IF EXISTS "weekly_insert_own" ON public.weekly_summaries;
DROP POLICY IF EXISTS "weekly_update_own" ON public.weekly_summaries;

CREATE POLICY "weekly_select_own" ON public.weekly_summaries FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "weekly_insert_own" ON public.weekly_summaries FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_update_own" ON public.weekly_summaries FOR UPDATE  USING (auth.uid() = user_id);

-- netflix_imports
ALTER TABLE public.netflix_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "netflix_own" ON public.netflix_imports FOR ALL USING (auth.uid() = user_id);

-- journal_entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_own" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);

-- actor_follows
ALTER TABLE public.actor_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actors_own" ON public.actor_follows FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 11. REALTIME — enable for live sync
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.library;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wishlist;

-- ============================================================
-- 12. STORAGE BUCKET for avatars
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880,
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- DONE ✅
-- ============================================================
SELECT 'Vibe Vault Cinema schema created successfully! 🎬' AS status;
