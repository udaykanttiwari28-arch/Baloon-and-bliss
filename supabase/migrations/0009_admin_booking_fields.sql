-- Add admin-managed fields to booking_enquiries
ALTER TABLE booking_enquiries
  ADD COLUMN IF NOT EXISTS amount_total_minor  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_paid_minor  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notes         text,
  ADD COLUMN IF NOT EXISTS mockup_storage_path text,
  ADD COLUMN IF NOT EXISTS source_channel      text,
  ADD COLUMN IF NOT EXISTS carousell_id        text,
  ADD COLUMN IF NOT EXISTS facebook_id         text;

-- Allow authenticated admins to insert enquiries manually
CREATE POLICY "Authenticated can insert enquiries"
  ON booking_enquiries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create private storage bucket for agreed mockups
INSERT INTO storage.buckets (id, name, public)
VALUES ('mockups', 'mockups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for mockups bucket
CREATE POLICY "Authenticated can upload mockups"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mockups');

CREATE POLICY "Authenticated can read mockups"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mockups');

CREATE POLICY "Authenticated can delete mockups"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'mockups');
