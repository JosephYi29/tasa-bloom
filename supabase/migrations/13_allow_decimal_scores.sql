-- /supabase/migrations/13_allow_decimal_scores.sql

-- Change the score column from INT to NUMERIC(4,2) to allow decimals up to 10.00
-- Also update the CHECK constraint to ensure it remains between 1 and 10

ALTER TABLE public.rating_scores
  ALTER COLUMN score TYPE NUMERIC(4,2) USING score::numeric;

-- Drop the existing check constraint related to score if it has a specific name, 
-- or we can just drop constraints generically if they were unnamed.
-- Since the previous one was defined directly in the CREATE TABLE without a name (e.g. `score INT NOT NULL CHECK (score BETWEEN 1 AND 10)`),
-- PostgreSQL auto-generates a name like `rating_scores_score_check`. We will drop it and replace it.

ALTER TABLE public.rating_scores
  DROP CONSTRAINT IF EXISTS rating_scores_score_check;

ALTER TABLE public.rating_scores
  ADD CONSTRAINT rating_scores_score_check CHECK (score BETWEEN 1 AND 10);
