-- /supabase/migrations/09_add_candidate_fields.sql

-- Add year and phone_number to the candidates table to support the new CSV import format
ALTER TABLE public.candidates
ADD COLUMN year TEXT,
ADD COLUMN phone_number TEXT;
