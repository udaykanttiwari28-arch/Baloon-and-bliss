-- Migration 0013: reconcile schema after the duplicate 0011 migrations.
-- Two files numbered 0011 existed; only 0011_lead_enhancements_and_invoices.sql
-- is kept. Databases that ran the removed 0011_lead_type_followup_invoices.sql
-- instead have issued_at (not issued_date), no paid_at, a nullable lead_type,
-- and are missing the Lost / custom-setup check values. Safe to run on either.

-- Invoices: issued_at -> issued_date, add paid_at
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'invoices' AND column_name = 'issued_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'invoices' AND column_name = 'issued_date') THEN
    ALTER TABLE invoices RENAME COLUMN issued_at TO issued_date;
  END IF;
END $$;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_date date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Use the shared set_updated_at() trigger only
DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
DROP FUNCTION IF EXISTS set_invoices_updated_at();
DROP TRIGGER IF EXISTS set_invoices_updated_at ON invoices;
CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- lead_type must always be set
UPDATE booking_enquiries SET lead_type = 'individual' WHERE lead_type IS NULL;
ALTER TABLE booking_enquiries ALTER COLUMN lead_type SET DEFAULT 'individual';
ALTER TABLE booking_enquiries ALTER COLUMN lead_type SET NOT NULL;

-- Status and package checks
ALTER TABLE booking_enquiries DROP CONSTRAINT IF EXISTS booking_enquiries_package_slug_check;
ALTER TABLE booking_enquiries ADD CONSTRAINT booking_enquiries_package_slug_check
  CHECK (package_slug IS NULL OR package_slug IN ('classic-setup','signature-setup','premium-setup','custom-setup'));

ALTER TABLE booking_enquiries DROP CONSTRAINT IF EXISTS booking_enquiries_status_check;
ALTER TABLE booking_enquiries ADD CONSTRAINT booking_enquiries_status_check
  CHECK (status IN ('New','Contacted','Confirmed','Cancelled','Lost'));
