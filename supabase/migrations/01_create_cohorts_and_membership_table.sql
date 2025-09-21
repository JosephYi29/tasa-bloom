-- /supabase/migrations/YYYYMMDDHHMMSS_create_cohorts_and_memberships.sql

-- Create the cohorts table
CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  year INT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add a unique constraint to prevent duplicate cohorts (e.g., two "Fall 2025")
ALTER TABLE public.cohorts ADD CONSTRAINT unique_cohort UNIQUE (term, year);

-- Create the board_memberships table
CREATE TABLE public.board_memberships (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MEMBER')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, cohort_id) -- Ensures a user has only one role per cohort
);

-- Enable Row Level Security (RLS) for the new tables
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_memberships ENABLE ROW LEVEL SECURITY;

-- Define security policies: Authenticated users can read cohort and membership info
CREATE POLICY "Allow authenticated users to read cohorts" ON public.cohorts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read their own membership" ON public.board_memberships
  FOR SELECT USING (auth.uid() = user_id);
