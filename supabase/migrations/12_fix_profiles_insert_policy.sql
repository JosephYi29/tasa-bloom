-- /supabase/migrations/12_fix_profiles_insert_policy.sql

-- Allow users to insert their own profile on the first login/setup
CREATE POLICY "Allow authenticated users to insert their own profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
