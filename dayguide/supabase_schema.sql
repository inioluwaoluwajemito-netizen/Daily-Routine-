-- ==============================================================================
-- DayGuide Supabase Database Schema
-- Tables: profiles, routines, habits, completions, goals, milestones
-- Features: Row Level Security (RLS), CASCADE foreign keys, Performance Indices
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  wake_time TEXT NOT NULL DEFAULT '05:30',
  sleep_time TEXT NOT NULL DEFAULT '22:30',
  archetype TEXT NOT NULL DEFAULT 'prayer',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_lead_minutes INTEGER NOT NULL DEFAULT 10,
  is_onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Routines (Time Blocks) Table
CREATE TABLE IF NOT EXISTS public.routines (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  days_of_week JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'P1',
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'custom',
  reminders JSONB NOT NULL DEFAULT '[30, 20, 10, 5]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  target_frequency INTEGER NOT NULL DEFAULT 7,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Completions (Block Execution Logs) Table
CREATE TABLE IF NOT EXISTS public.completions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  log_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('done', 'skipped', 'snoozed', 'pending', 'in_progress')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  month TEXT NOT NULL,
  target_metric_value REAL NOT NULL DEFAULT 0,
  current_metric_value REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'units',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Milestones Table
CREATE TABLE IF NOT EXISTS public.milestones (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for Fast Queries
CREATE INDEX IF NOT EXISTS idx_routines_user_start ON public.routines(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON public.completions(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_month ON public.goals(user_id, month);
CREATE INDEX IF NOT EXISTS idx_milestones_goal ON public.milestones(goal_id);

-- ==============================================================================
-- Row Level Security (RLS) - Users only access their own rows
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Routines Policies
DROP POLICY IF EXISTS "Users can manage own routines" ON public.routines;
CREATE POLICY "Users can manage own routines" ON public.routines
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Habits Policies
DROP POLICY IF EXISTS "Users can manage own habits" ON public.habits;
CREATE POLICY "Users can manage own habits" ON public.habits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Completions Policies
DROP POLICY IF EXISTS "Users can manage own completions" ON public.completions;
CREATE POLICY "Users can manage own completions" ON public.completions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goals Policies
DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Milestones Policies
DROP POLICY IF EXISTS "Users can manage own milestones" ON public.milestones;
CREATE POLICY "Users can manage own milestones" ON public.milestones
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, wake_time, sleep_time, archetype, is_onboarded)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    '05:30',
    '22:30',
    'prayer',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

