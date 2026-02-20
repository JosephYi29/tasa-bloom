-- /supabase/migrations/04_seed_board_positions.sql
-- Seed the board_positions table with standard positions.
-- President and Secretary have admin privileges.

INSERT INTO public.board_positions (name, is_admin) VALUES
  ('President', true),
  ('Secretary', true),
  ('Internal Vice President', false),
  ('External Vice President', false),
  ('Treasurer', false),
  ('Social Chair', false),
  ('Cultural Chair', false),
  ('Public Relations', false),
  ('Historian', false),
  ('Webmaster', false)
ON CONFLICT (name) DO UPDATE SET is_admin = EXCLUDED.is_admin;
