-- /supabase/migrations/YYYYMMDDHHMMSS_add_profiles_and_positions.sql

-- Create a new 'profiles' table to store additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  grad_year INT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read and update their own profiles
CREATE POLICY "Allow authenticated users to read their own profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create a 'board_positions' lookup table
CREATE TABLE public.board_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- Enable RLS for the board_positions table
ALTER TABLE public.board_positions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read the list of positions
CREATE POLICY "Allow authenticated users to read board positions" ON public.board_positions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add the 'position_id' column to the 'board_memberships' table
ALTER TABLE public.board_memberships ADD COLUMN position_id UUID REFERENCES public.board_positions(id);