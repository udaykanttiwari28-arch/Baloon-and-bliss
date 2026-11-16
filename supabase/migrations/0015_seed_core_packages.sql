-- Seed the three core packages that the site links to directly
-- (/catalogue/classic-setup, /catalogue/signature-setup, /catalogue/premium-setup).
-- Existing rows (matched on slug or sku) are left untouched.
INSERT INTO public.products (name, slug, sku, description, base_price_minor, tags, included_items, highlight_label, display_order, is_active)
VALUES
  ('Classic Setup', 'classic-setup', 'BBSG-CLASSIC-001',
   'Perfect for a beautiful, simple celebration setup.', 39800,
   ARRAY['classic','essential'],
   ARRAY['1 custom backdrop','2 themed cutouts','1 pedestal','Stress-free setup and delivery at your venue'],
   NULL, 1, true),
  ('Signature Setup', 'signature-setup', 'BBSG-SIGNATURE-001',
   'A fuller celebration setup with additional styling and personalised elements.', 45000,
   ARRAY['signature','most popular'],
   ARRAY['2 custom backdrops','2 themed cutouts','2 pedestals','Number light / number column','Welcome board','Stress-free setup and delivery at your venue'],
   'Most Popular', 2, true),
  ('Premium Setup', 'premium-setup', 'BBSG-PREMIUM-001',
   'The complete event styling experience — from the main backdrop to the entrance, walls, floor, and dessert table.', 75000,
   ARRAY['premium','full event styling'],
   ARRAY['3+ custom backdrops or 1 large custom backdrop up to 500cm wide','3+ themed cutouts','3 pedestals','Number light / number column','Welcome board','Entrance decor','Wall decor','Floor decor','Dessert table decor','Stress-free setup and delivery at your venue'],
   NULL, 3, true)
ON CONFLICT DO NOTHING;
