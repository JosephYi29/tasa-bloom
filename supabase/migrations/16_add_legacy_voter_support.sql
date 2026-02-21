-- /supabase/migrations/16_add_legacy_voter_support.sql

-- Drop the NOT NULL constraint on voter_id to allow string-based names
ALTER TABLE public.ratings ALTER COLUMN voter_id DROP NOT NULL;

-- Drop the previous unique constraint
ALTER TABLE public.ratings DROP CONSTRAINT ratings_candidate_id_voter_id_cohort_id_rating_type_key;

-- Add new columns for legacy import support
ALTER TABLE public.ratings ADD COLUMN legacy_voter_alias TEXT;
ALTER TABLE public.ratings ADD COLUMN imported_by UUID REFERENCES auth.users(id);

-- Enforce mutual exclusivity and requirements
ALTER TABLE public.ratings ADD CONSTRAINT voter_id_or_legacy_voter_alias CHECK (
  (voter_id IS NOT NULL AND legacy_voter_alias IS NULL) OR
  (voter_id IS NULL AND legacy_voter_alias IS NOT NULL AND imported_by IS NOT NULL)
);

-- Re-add the unique constraint, ensuring identical imports don't collide.
-- We use a combination of voter_id (for modern votes) and legacy_voter_alias (for imported votes)
CREATE UNIQUE INDEX idx_ratings_unique_modern ON public.ratings (candidate_id, voter_id, cohort_id, rating_type) WHERE voter_id IS NOT NULL;
CREATE UNIQUE INDEX idx_ratings_unique_legacy ON public.ratings (candidate_id, legacy_voter_alias, cohort_id, rating_type) WHERE legacy_voter_alias IS NOT NULL;


-- Add Admin Policies to allow INSERT/UPDATE on Ratings when voter_id is NULL (legacy import)
CREATE POLICY "Admins can insert legacy ratings" ON public.ratings
  FOR INSERT WITH CHECK (
    voter_id IS NULL AND
    legacy_voter_alias IS NOT NULL AND
    imported_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.board_positions bp ON bp.id = bm.position_id
      JOIN public.cohorts c ON c.id = bm.cohort_id
      WHERE bm.user_id = auth.uid()
        AND bp.is_admin = true
        AND c.is_active = true
    )
  );

CREATE POLICY "Admins can update legacy ratings" ON public.ratings
  FOR UPDATE USING (
    voter_id IS NULL AND
    legacy_voter_alias IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.board_memberships bm
      JOIN public.board_positions bp ON bp.id = bm.position_id
      JOIN public.cohorts c ON c.id = bm.cohort_id
      WHERE bm.user_id = auth.uid()
        AND bp.is_admin = true
        AND c.is_active = true
    )
  );

-- For rating_scores, admins need to be able to insert them if they belong to a legacy rating
CREATE POLICY "Admins can insert legacy rating scores" ON public.rating_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ratings r
      WHERE r.id = rating_scores.rating_id
        AND r.voter_id IS NULL
        AND r.legacy_voter_alias IS NOT NULL
        AND r.imported_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update legacy rating scores" ON public.rating_scores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.ratings r
      WHERE r.id = rating_scores.rating_id
        AND r.voter_id IS NULL
        AND r.legacy_voter_alias IS NOT NULL
    )
  );
