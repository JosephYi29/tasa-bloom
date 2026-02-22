-- Add is_scorable flag to application_questions
-- Non-scorable questions are hidden from voters but preserved for candidate data display
ALTER TABLE public.application_questions
  ADD COLUMN IF NOT EXISTS is_scorable BOOLEAN DEFAULT TRUE;
