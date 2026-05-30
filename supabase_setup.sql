-- ====================================================================
-- HABITMIND SECURE DATABASE SCHEMA MIGRATION
-- Execute this script in your Supabase SQL Editor to enable 
-- Row Level Security (RLS) and enforce secure data isolation.
-- ====================================================================

-- 1. Ensure UUID-OSSP Extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Add user_id column to the 'habits' table referencing auth.users(id)
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Add user_id column to the 'completions' table referencing auth.users(id)
-- Note: Having user_id directly on completions makes RLS policies simple, fast, and secure.
ALTER TABLE public.completions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

-- 5. Drop any existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can manage their own completions" ON public.completions;

-- 6. Create Row Level Security policies for habits
-- This policy ensures authenticated users can only INSERT, SELECT, UPDATE, or DELETE
-- habits that contain their exact Supabase Auth User ID.
CREATE POLICY "Users can manage their own habits" ON public.habits
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. Create Row Level Security policies for completions
-- This policy ensures authenticated users can only INSERT, SELECT, UPDATE, or DELETE
-- completions that contain their exact Supabase Auth User ID.
CREATE POLICY "Users can manage their own completions" ON public.completions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. Verify the structural updates
-- You should see the 'user_id' column on both tables and RLS enabled.
