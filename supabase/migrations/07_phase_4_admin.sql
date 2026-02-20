-- /supabase/migrations/07_phase_4_admin.sql
-- Add voting phase lock columns to the cohorts table and a trigger to enforce a single active cohort.

-- 1. Add boolean flags for voting phases
ALTER TABLE public.cohorts 
  ADD COLUMN IF NOT EXISTS app_voting_open BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS int_voting_open BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS char_voting_open BOOLEAN DEFAULT false;

-- 2. Create function to enforce only one active cohort
CREATE OR REPLACE FUNCTION ensure_single_active_cohort()
RETURNS TRIGGER AS $$
BEGIN
  -- If the cohort being inserted or updated is set to active (true)
  IF NEW.is_active = true THEN
    -- Set all other cohorts to inactive
    UPDATE public.cohorts
    SET is_active = false
    WHERE id <> NEW.id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger on the cohorts table
DROP TRIGGER IF EXISTS trigger_ensure_single_active_cohort ON public.cohorts;

CREATE TRIGGER trigger_ensure_single_active_cohort
BEFORE INSERT OR UPDATE OF is_active ON public.cohorts
FOR EACH ROW
EXECUTE FUNCTION ensure_single_active_cohort();
