-- /supabase/migrations/17_alter_score_numeric.sql

-- Change score column to support decimal inputs for historical legacy imports.
ALTER TABLE public.rating_scores
  ALTER COLUMN score TYPE NUMERIC(4,2);
