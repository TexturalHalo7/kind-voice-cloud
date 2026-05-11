CREATE TABLE public.voice_message_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voice_message_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (voice_message_id, reporter_id)
);

ALTER TABLE public.voice_message_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own reports"
  ON public.voice_message_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON public.voice_message_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE INDEX idx_voice_message_reports_message ON public.voice_message_reports(voice_message_id);
CREATE INDEX idx_voice_message_reports_reporter ON public.voice_message_reports(reporter_id);