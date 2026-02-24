-- Add weight column to character_traits for per-trait weighting within the character category
ALTER TABLE public.character_traits ADD COLUMN IF NOT EXISTS weight DECIMAL NOT NULL DEFAULT 0;
