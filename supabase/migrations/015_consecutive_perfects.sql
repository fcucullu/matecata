-- Track consecutive perfect scores for diamond reward
ALTER TABLE public.matecata_progress
  ADD COLUMN IF NOT EXISTS consecutive_perfects integer NOT NULL DEFAULT 0;
