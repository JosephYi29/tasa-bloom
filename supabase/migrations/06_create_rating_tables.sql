-- /supabase/migrations/06_create_rating_tables.sql
-- Create tables for the voting and rating system.

-- ============================================================
-- CHARACTER TRAITS (Configurable per cohort)
-- ============================================================
CREATE TABLE public.character_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  trait_name TEXT NOT NULL,
  trait_order INT NOT NULL DEFAULT 0,
  UNIQUE (cohort_id, trait_name)
);

ALTER TABLE public.character_traits ENABLE ROW LEVEL SECURITY;

-- Everyone can read traits for the active cohort
CREATE POLICY "Board members can read character traits" ON public.character_traits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.cohorts c ON c.id = bm.cohort_id
      WHERE bm.user_id = auth.uid()
        AND c.is_active = true
        AND bm.cohort_id = character_traits.cohort_id
    )
  );

-- Admins can manage traits
CREATE POLICY "Admins can manage character traits" ON public.character_traits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.board_positions bp ON bp.id = bm.position_id
      JOIN public.cohorts c ON c.id = bm.cohort_id
      WHERE bm.user_id = auth.uid()
        AND bp.is_admin = true
        AND c.is_active = true
    )
  );

-- ============================================================
-- RATINGS (The overall container for a voter's submission on a candidate)
-- ============================================================
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  rating_type TEXT NOT NULL CHECK (rating_type IN ('application', 'interview', 'character')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (candidate_id, voter_id, cohort_id, rating_type)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Voters can read their own ratings
CREATE POLICY "Users can view their own ratings" ON public.ratings
  FOR SELECT USING (voter_id = auth.uid());

-- Voters can insert/update their own ratings
CREATE POLICY "Users can insert their own ratings" ON public.ratings
  FOR INSERT WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Users can update their own ratings" ON public.ratings
  FOR UPDATE USING (voter_id = auth.uid());

-- Admins can read ALL ratings
CREATE POLICY "Admins can view all ratings" ON public.ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.board_positions bp ON bp.id = bm.position_id
      JOIN public.cohorts c ON c.id = bm.cohort_id
      WHERE bm.user_id = auth.uid()
        AND bp.is_admin = true
        AND c.is_active = true
        AND bm.cohort_id = ratings.cohort_id
    )
  );

-- ============================================================
-- RATING SCORES (The actual 1-10 scores and comments)
-- ============================================================
CREATE TABLE public.rating_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.application_questions(id) ON DELETE CASCADE,
  trait_id UUID REFERENCES public.character_traits(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 10),
  comment TEXT,
  -- One of question_id or trait_id must be provided
  CHECK (
    (question_id IS NOT NULL AND trait_id IS NULL) OR 
    (trait_id IS NOT NULL AND question_id IS NULL)
  )
);

ALTER TABLE public.rating_scores ENABLE ROW LEVEL SECURITY;

-- Voters can read their own scores
CREATE POLICY "Users can view their own rating scores" ON public.rating_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ratings r
      WHERE r.id = rating_scores.rating_id
        AND r.voter_id = auth.uid()
    )
  );

-- Voters can insert/update/delete their own scores
CREATE POLICY "Users can manage their own rating scores" ON public.rating_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ratings r
      WHERE r.id = rating_scores.rating_id
        AND r.voter_id = auth.uid()
    )
  );

-- Admins can read ALL rating scores
CREATE POLICY "Admins can view all rating scores" ON public.rating_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ratings r
      JOIN public.board_memberships bm ON bm.cohort_id = r.cohort_id
      JOIN public.board_positions bp ON bp.id = bm.position_id
      JOIN public.cohorts c ON c.id = bm.cohort_id
      WHERE r.id = rating_scores.rating_id
        AND bm.user_id = auth.uid()
        AND bp.is_admin = true
        AND c.is_active = true
    )
  );

-- Function to auto-update updated_at on ratings
CREATE OR REPLACE FUNCTION update_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ratings_updated_at
BEFORE UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION update_ratings_updated_at();
