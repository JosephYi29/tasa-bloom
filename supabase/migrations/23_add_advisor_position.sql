-- /supabase/migrations/23_add_advisor_position.sql
-- Add "Advisor" board position with admin privileges.

INSERT INTO public.board_positions (name, is_admin) VALUES
  ('Advisor', true)
ON CONFLICT (name) DO UPDATE SET is_admin = EXCLUDED.is_admin;
