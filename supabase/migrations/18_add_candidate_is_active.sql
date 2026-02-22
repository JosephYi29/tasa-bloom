-- /supabase/migrations/18_add_candidate_is_active.sql
-- Add is_active toggle to candidates table so admins can exclude candidates
-- from voting/scoring without deleting them.

ALTER TABLE public.candidates
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
