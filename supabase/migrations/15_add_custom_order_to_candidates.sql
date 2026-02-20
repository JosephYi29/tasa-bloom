-- Add custom_order to candidates table
ALTER TABLE public.candidates 
ADD COLUMN custom_order INT NULL;

-- Initialize custom_order to be the same as candidate_number for existing records
UPDATE public.candidates 
SET custom_order = candidate_number * 10 
WHERE custom_order IS NULL;

-- Update the Candidates view to sort by custom_order
-- No view currently exists, but we can set the default order
