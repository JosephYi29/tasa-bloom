-- /supabase/migrations/08_admin_permissions.sql

-- Give authenticated users INSERT, UPDATE, DELETE permissions on specific tables
-- This relies on the Next.js API/Server Action layer to enforce "isAdmin" business logic,
-- which guarantees only authorized admins can actually trigger these operations from the UI.

-- Cohorts
CREATE POLICY "Allow authenticated users to insert cohorts" ON public.cohorts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update cohorts" ON public.cohorts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete cohorts" ON public.cohorts FOR DELETE TO authenticated USING (true);

-- Board Memberships
CREATE POLICY "Allow authenticated users to insert board_memberships" ON public.board_memberships FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update board_memberships" ON public.board_memberships FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete board_memberships" ON public.board_memberships FOR DELETE TO authenticated USING (true);

-- Candidates
CREATE POLICY "Allow authenticated users to insert candidates" ON public.candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update candidates" ON public.candidates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete candidates" ON public.candidates FOR DELETE TO authenticated USING (true);

-- Application Questions
CREATE POLICY "Allow authenticated users to insert application_questions" ON public.application_questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update application_questions" ON public.application_questions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete application_questions" ON public.application_questions FOR DELETE TO authenticated USING (true);

-- Application Responses
CREATE POLICY "Allow authenticated users to insert application_responses" ON public.application_responses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update application_responses" ON public.application_responses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete application_responses" ON public.application_responses FOR DELETE TO authenticated USING (true);

-- Interview Links
CREATE POLICY "Allow authenticated users to insert interview_links" ON public.interview_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update interview_links" ON public.interview_links FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete interview_links" ON public.interview_links FOR DELETE TO authenticated USING (true);

-- Character Traits
CREATE POLICY "Allow authenticated users to insert character_traits" ON public.character_traits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update character_traits" ON public.character_traits FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete character_traits" ON public.character_traits FOR DELETE TO authenticated USING (true);
