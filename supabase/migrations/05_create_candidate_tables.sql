-- /supabase/migrations/05_create_candidate_tables.sql
-- Create tables for candidates, application questions, responses, and interview links.

-- ============================================================
-- CANDIDATES
-- ============================================================
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  candidate_number INT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cohort_id, candidate_number)
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Board members in the active cohort can read candidates
CREATE POLICY "Board members can read candidates" ON public.candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.cohorts c ON c.id = bm.cohort_id
      WHERE bm.user_id = auth.uid()
        AND c.is_active = true
        AND bm.cohort_id = candidates.cohort_id
    )
  );

-- Admins can insert/update/delete candidates
CREATE POLICY "Admins can manage candidates" ON public.candidates
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
-- APPLICATION QUESTIONS
-- ============================================================
CREATE TABLE public.application_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INT NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'application' CHECK (category IN ('application', 'interview'))
);

ALTER TABLE public.application_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can read questions" ON public.application_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.cohorts c ON c.id = bm.cohort_id
      WHERE bm.user_id = auth.uid()
        AND c.is_active = true
        AND bm.cohort_id = application_questions.cohort_id
    )
  );

CREATE POLICY "Admins can manage questions" ON public.application_questions
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
-- APPLICATION RESPONSES (candidate answers)
-- ============================================================
CREATE TABLE public.application_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.application_questions(id) ON DELETE CASCADE,
  response_text TEXT,
  UNIQUE (candidate_id, question_id)
);

ALTER TABLE public.application_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can read responses" ON public.application_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.candidates cand
      JOIN public.board_memberships bm ON bm.cohort_id = cand.cohort_id
      JOIN public.cohorts c ON c.id = cand.cohort_id
      WHERE cand.id = application_responses.candidate_id
        AND bm.user_id = auth.uid()
        AND c.is_active = true
    )
  );

CREATE POLICY "Admins can manage responses" ON public.application_responses
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
-- INTERVIEW LINKS
-- ============================================================
CREATE TABLE public.interview_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  notes TEXT,
  UNIQUE (candidate_id)
);

ALTER TABLE public.interview_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can read interview links" ON public.interview_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.candidates cand
      JOIN public.board_memberships bm ON bm.cohort_id = cand.cohort_id
      JOIN public.cohorts c ON c.id = cand.cohort_id
      WHERE cand.id = interview_links.candidate_id
        AND bm.user_id = auth.uid()
        AND c.is_active = true
    )
  );

CREATE POLICY "Admins can manage interview links" ON public.interview_links
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
