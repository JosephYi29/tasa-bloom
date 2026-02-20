-- /supabase/migrations/11_fix_admin_read_permissions.sql

-- Drop the old restrictive SELECT policy on candidates
DROP POLICY IF EXISTS "Board members can read candidates" ON public.candidates;

-- Create a new policy: Board members can read candidates for their cohort,
-- AND Admins can read ALL candidates regardless of membership in the specific cohort.
CREATE POLICY "Board members and Admins can read candidates" ON public.candidates
  FOR SELECT USING (
    -- Condition 1: Direct board membership in the candidate's active cohort
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.cohorts c ON c.id = bm.cohort_id
      WHERE bm.user_id = auth.uid()
        AND c.is_active = true
        AND bm.cohort_id = candidates.cohort_id
    )
    OR
    -- Condition 2: Admin in ANY board
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.board_positions bp ON bp.id = bm.position_id
      WHERE bm.user_id = auth.uid()
        AND bp.is_admin = true
    )
  );
