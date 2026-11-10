-- Track when a lead was converted to a customer
ALTER TABLE booking_enquiries
  ADD COLUMN IF NOT EXISTS converted_to_customer_at timestamptz;

-- Booking preparation checklist per enquiry
CREATE TABLE IF NOT EXISTS booking_checklist_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_enquiry_id uuid NOT NULL REFERENCES booking_enquiries(id) ON DELETE CASCADE,
  item_name          text NOT NULL,
  is_done            boolean NOT NULL DEFAULT false,
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE booking_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage checklist items"
  ON booking_checklist_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
