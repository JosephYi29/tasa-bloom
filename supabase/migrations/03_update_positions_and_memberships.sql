-- /supabase/migrations/YYYYMMDDHHMMSS_update_positions_and_memberships.sql

-- Add the 'has_admin_privileges' column to the board_positions table
ALTER TABLE public.board_positions
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Remove the 'role' column from the board_memberships table
ALTER TABLE public.board_memberships
DROP COLUMN role;

-- Add a policy to allow authenticated users to read the new column
CREATE POLICY "Allow authenticated users to read board positions with privileges" ON public.board_positions
FOR SELECT USING (auth.role() = 'authenticated');