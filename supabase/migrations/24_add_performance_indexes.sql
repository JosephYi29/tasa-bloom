-- Add performance indexes for foreign keys frequently used in filtering and joins
-- These will speed up the admin dashboard, results aggregation, and candidate fetching

-- 1. Index on ratings to speed up filtering by cohort and candidate (used heavily in results/scoring)
CREATE INDEX IF NOT EXISTS idx_ratings_cohort_id ON public.ratings(cohort_id);
CREATE INDEX IF NOT EXISTS idx_ratings_candidate_id ON public.ratings(candidate_id);

-- 2. Index on candidates to speed up fetching active candidates per cohort
CREATE INDEX IF NOT EXISTS idx_candidates_cohort_active ON public.candidates(cohort_id, is_active);

-- 3. Index on character traits to speed up fetching traits per cohort
CREATE INDEX IF NOT EXISTS idx_character_traits_cohort_id ON public.character_traits(cohort_id);

-- 4. Index on board_memberships to speed up permission checks and dashboard member lists
CREATE INDEX IF NOT EXISTS idx_board_memberships_cohort_user ON public.board_memberships(cohort_id, user_id);

-- 5. Index on rating_scores to speed up joining scores to ratings
CREATE INDEX IF NOT EXISTS idx_rating_scores_rating_id ON public.rating_scores(rating_id);

-- 6. Index on application_responses to speed up fetching responses per candidate
CREATE INDEX IF NOT EXISTS idx_application_responses_candidate_id ON public.application_responses(candidate_id);
