-- MateCata progress table (profiles already exists from shared project)

CREATE TABLE IF NOT EXISTS public.matecata_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tabla integer NOT NULL CHECK (tabla BETWEEN 1 AND 9),
  stars integer NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  best_streak integer NOT NULL DEFAULT 0,
  last_score integer NOT NULL DEFAULT 0,
  times_played integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, tabla)
);

ALTER TABLE public.matecata_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.matecata_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.matecata_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.matecata_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_matecata_progress_user ON public.matecata_progress(user_id);
