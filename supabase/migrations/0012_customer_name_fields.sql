-- Add salutation, first_name, last_name to customers
-- first_name is the primary name going forward; existing rows get name split as fallback
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS salutation  text,
  ADD COLUMN IF NOT EXISTS first_name  text,
  ADD COLUMN IF NOT EXISTS last_name   text;

-- Make email and mobile nullable (admin-created customers may not have these)
ALTER TABLE customers
  ALTER COLUMN email  DROP NOT NULL,
  ALTER COLUMN mobile DROP NOT NULL;
