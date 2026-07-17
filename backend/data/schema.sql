-- ============================================================
--  Investor AI – Supabase Database Schema
--  Phase 2
-- ============================================================
--
--  HOW TO RUN:
--  1. Go to your Supabase project dashboard:
--       https://supabase.com/dashboard/project/<your-project-ref>
--  2. Open the SQL Editor (left sidebar → "SQL Editor")
--  3. Paste this entire file and click "Run"
--  4. Verify in Table Editor that profiles, chat_sessions,
--     and chat_messages appear.
--
--  NOTE: auth.users is managed by Supabase Auth automatically.
--  You do NOT need to create it - just reference it here.
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. profiles
--    One row per registered user.  Mirrors auth.users so that
--    application queries stay within the public schema.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email       TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();


-- ──────────────────────────────────────────────────────────────
-- 2. chat_sessions
--    A conversation session between one user and one investor
--    persona (buffett | lynch | graham | munger | dalio).
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    investor_key  TEXT        NOT NULL CHECK (investor_key IN ('buffett','lynch','graham','munger','dalio')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index so "all sessions for a user" is fast
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
    ON public.chat_sessions (user_id);


-- ──────────────────────────────────────────────────────────────
-- 3. chat_messages
--    Individual turns within a session.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID        NOT NULL REFERENCES public.chat_sessions (id) ON DELETE CASCADE,
    role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index so "all messages in a session" is fast
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
    ON public.chat_messages (session_id);


-- ============================================================
--  Row-Level Security (RLS)
--  Users can ONLY see and modify their own rows.
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);


-- ── chat_sessions ─────────────────────────────────────────────
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
    ON public.chat_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
    ON public.chat_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
    ON public.chat_sessions
    FOR DELETE
    USING (auth.uid() = user_id);


-- ── chat_messages ─────────────────────────────────────────────
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own sessions"
    ON public.chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = chat_messages.session_id
              AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in own sessions"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = chat_messages.session_id
              AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in own sessions"
    ON public.chat_messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions s
            WHERE s.id = chat_messages.session_id
              AND s.user_id = auth.uid()
        )
    );


-- ============================================================
--  Done!  Verify with:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public';
-- ============================================================
