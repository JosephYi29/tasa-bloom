-- /supabase/migrations/19_update_board_positions.sql
-- Update board_positions to reflect the current TASA board structure.
-- Uses ON CONFLICT to safely upsert positions that may already exist.
-- Renames "Cultural Chair" → "Culture Chair" to match current naming.

-- Rename "Cultural Chair" to "Culture Chair" if it exists
UPDATE public.board_positions
SET name = 'Culture Chair'
WHERE name = 'Cultural Chair';

-- Upsert all current positions (inserts new ones, updates existing ones)
INSERT INTO public.board_positions (name, is_admin) VALUES
  ('President', true),
  ('Secretary', true),
  ('Internal Vice President', false),
  ('External Vice President', false),
  ('Treasurer', false),
  ('Public Relations', false),
  ('Graphic Designer', false),
  ('Night Market Director', false),
  ('Culture Chair', false),
  ('Historian', false),
  ('Videographer', false),
  ('Social Chair', false),
  ('Outreach Chair', false),
  ('Fundraising Chair', false),
  ('Senior Advisor', false),
  ('Alumni Advisor', false)
ON CONFLICT (name) DO UPDATE SET is_admin = EXCLUDED.is_admin;
