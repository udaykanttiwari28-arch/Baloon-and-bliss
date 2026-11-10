-- Fix package_slug check to include custom-setup
ALTER TABLE booking_enquiries DROP CONSTRAINT IF EXISTS booking_enquiries_package_slug_check;
ALTER TABLE booking_enquiries ADD CONSTRAINT booking_enquiries_package_slug_check
  CHECK (package_slug IS NULL OR package_slug IN ('classic-setup','signature-setup','premium-setup','custom-setup'));

-- Fix status to include Lost
ALTER TABLE booking_enquiries DROP CONSTRAINT IF EXISTS booking_enquiries_status_check;
ALTER TABLE booking_enquiries ADD CONSTRAINT booking_enquiries_status_check
  CHECK (status IN ('New','Contacted','Confirmed','Cancelled','Lost'));

-- Lead enhancements
ALTER TABLE booking_enquiries
  ADD COLUMN IF NOT EXISTS lead_type         text NOT NULL DEFAULT 'individual' CHECK (lead_type IN ('individual','corporate')),
  ADD COLUMN IF NOT EXISTS company_name      text,
  ADD COLUMN IF NOT EXISTS follow_up_date    date,
  ADD COLUMN IF NOT EXISTS follow_up_notes   text,
  ADD COLUMN IF NOT EXISTS close_reason      text;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_enquiry_id uuid NOT NULL REFERENCES booking_enquiries(id) ON DELETE CASCADE,
  invoice_number     text UNIQUE NOT NULL,
  status             text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','unpaid','paid')),
  line_items         jsonb NOT NULL DEFAULT '[]',
  subtotal_minor     integer NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
  gst_minor          integer NOT NULL DEFAULT 0 CHECK (gst_minor >= 0),
  total_minor        integer NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  notes              text,
  issued_date        date,
  due_date           date,
  paid_at            timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated can manage invoices"
    ON invoices FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
