-- /supabase/migrations/20_add_position_and_member_toggles.sql
-- Add is_active to board_positions (for toggling positions on/off)
-- Add is_available to board_memberships (for toggling member participation)

ALTER TABLE public.board_positions
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE public.board_memberships
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
