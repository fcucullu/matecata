-- Add mode column to track multiplication vs division progress separately
ALTER TABLE public.matecata_progress
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'multiply' CHECK (mode IN ('multiply', 'divide'));

-- Drop the old unique constraint and create a new one including mode
ALTER TABLE public.matecata_progress
  DROP CONSTRAINT IF EXISTS matecata_progress_user_id_tabla_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_matecata_progress_user_tabla_mode
  ON public.matecata_progress(user_id, tabla, mode);
