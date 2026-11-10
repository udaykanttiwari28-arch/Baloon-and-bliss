-- Migration 0011: lead_type, company_name, follow_up, close_reason, invoices table

-- Lead enhancements
ALTER TABLE booking_enquiries
  ADD COLUMN IF NOT EXISTS lead_type        text        DEFAULT 'individual' CHECK (lead_type IN ('individual','corporate')),
  ADD COLUMN IF NOT EXISTS company_name     text,
  ADD COLUMN IF NOT EXISTS follow_up_date   date,
  ADD COLUMN IF NOT EXISTS follow_up_notes  text,
  ADD COLUMN IF NOT EXISTS close_reason     text;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_enquiry_id uuid      NOT NULL REFERENCES booking_enquiries(id) ON DELETE CASCADE,
  invoice_number   text        NOT NULL UNIQUE,
  status           text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','unpaid','paid')),
  line_items       jsonb       NOT NULL DEFAULT '[]',
  subtotal_minor   integer     NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
  gst_minor        integer     NOT NULL DEFAULT 0 CHECK (gst_minor >= 0),
  total_minor      integer     NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  issued_at        date,
  due_date         date,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "invoices_auth" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_invoices_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_invoices_updated_at();
