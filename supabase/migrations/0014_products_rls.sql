-- RLS for products and related tables so authenticated admins can manage them

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_add_ons ENABLE ROW LEVEL SECURITY;

-- Public can read active products (for the customer catalogue)
DO $$ BEGIN
  CREATE POLICY "Public can read active products"
    ON public.products FOR SELECT TO public
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can read product images"
    ON public.product_images FOR SELECT TO public
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can read add_ons"
    ON public.add_ons FOR SELECT TO public
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can read product_add_ons"
    ON public.product_add_ons FOR SELECT TO public
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated (admin) can do everything
DO $$ BEGIN
  CREATE POLICY "Authenticated can manage products"
    ON public.products FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can manage product_images"
    ON public.product_images FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can manage add_ons"
    ON public.add_ons FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can manage product_add_ons"
    ON public.product_add_ons FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Storage: authenticated can upload/delete in product-images bucket
DO $$ BEGIN
  CREATE POLICY "Authenticated can upload product images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can update product images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can delete product images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
