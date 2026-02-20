-- /supabase/migrations/10_fix_admin_inactive_cohort_permissions.sql

-- Drop the old restrictive policies that required the cohort to be active
DROP POLICY IF EXISTS "Admins can manage questions" ON public.application_questions;
DROP POLICY IF EXISTS "Admins can manage responses" ON public.application_responses;
DROP POLICY IF EXISTS "Admins can manage candidates" ON public.candidates;
DROP POLICY IF EXISTS "Admins can manage interview links" ON public.interview_links;

-- Create new policies that allow Admins to manage these tables regardless of if the cohort is active.
-- As long as the user is an admin in ANY active board, they should be able to prepare upcoming cohorts.
-- Or more simply, if the user has an admin role in ANY cohort, they can manage candidates across the board.

CREATE POLICY "Admins can manage questions" ON public.application_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.board_positions bp ON bp.id = bm.position_id
      WHERE bm.user_id = auth.uid()
        AND bp.is_admin = true
    )
  );

CREATE POLICY "Admins can manage responses" ON public.application_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.board_positions bp ON bp.id = bm.position_id
      WHERE bm.user_id = auth.uid()
        AND bp.is_admin = true
    )
  );

CREATE POLICY "Admins can manage candidates" ON public.candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.board_positions bp ON bp.id = bm.position_id
      WHERE bm.user_id = auth.uid()
        AND bp.is_admin = true
    )
  );

CREATE POLICY "Admins can manage interview links" ON public.interview_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.board_positions bp ON bp.id = bm.position_id
      WHERE bm.user_id = auth.uid()
        AND bp.is_admin = true
    )
  );
