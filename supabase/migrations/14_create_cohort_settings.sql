CREATE TABLE IF NOT EXISTS public.cohort_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE UNIQUE,
    application_weight DECIMAL NOT NULL DEFAULT 0.40,
    interview_weight DECIMAL NOT NULL DEFAULT 0.35,
    character_weight DECIMAL NOT NULL DEFAULT 0.25,
    outlier_std_devs DECIMAL NOT NULL DEFAULT 2.0,
    top_n_display INT NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT weights_sum_check CHECK (ROUND(application_weight + interview_weight + character_weight, 2) = 1.00)
);

-- RLS
ALTER TABLE public.cohort_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are viewable by board members of the cohort" ON public.cohort_settings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM board_memberships bm
            WHERE bm.user_id = auth.uid() AND bm.cohort_id = cohort_settings.cohort_id
        )
        OR
        EXISTS (
            SELECT 1 FROM board_memberships bm
            JOIN board_positions bp ON bm.position_id = bp.id
            WHERE bm.user_id = auth.uid() AND bp.is_admin = true
        )
    );

CREATE POLICY "Admins can insert and update settings" ON public.cohort_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM board_memberships bm
            JOIN board_positions bp ON bm.position_id = bp.id
            WHERE bm.user_id = auth.uid() AND bp.is_admin = true AND bm.cohort_id = cohort_settings.cohort_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM board_memberships bm
            JOIN board_positions bp ON bm.position_id = bp.id
            WHERE bm.user_id = auth.uid() AND bp.is_admin = true AND bm.cohort_id = cohort_settings.cohort_id
        )
    );

-- Function to auto-update updated_at on cohort_settings
CREATE OR REPLACE FUNCTION update_cohort_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cohort_settings_updated_at
  BEFORE UPDATE ON public.cohort_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_cohort_settings_updated_at();
