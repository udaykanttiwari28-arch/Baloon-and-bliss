import { createClient } from '@supabase/supabase-js';
import type { AddOn, Product } from '../domain/types';
import { exampleCatalogue } from './fixtures';

const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'product-images';

// ─── DB-backed loader ─────────────────────────────────────────────────────────

interface DbAddOn {
  id: string;
  name: string;
  description: string | null;
  price_minor: number;
  price_on_request: boolean;
  is_active: boolean;
}

interface DbImage {
  id: string;
  storage_path: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

interface DbRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  base_price_minor: number;
  currency: string;
  tags: string[];
  included_items: string[];
  highlight_label: string | null;
  display_order: number;
  is_active: boolean;
  category_id: string | null;
  product_images: DbImage[];
  product_add_ons: { add_on_id: string; add_ons: DbAddOn }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbProduct(row: DbRow, supabase: any): Product {
  const images = (row.product_images ?? [])
    .sort((a, b) => {
      if (a.is_primary) return -1;
      if (b.is_primary) return 1;
      return a.display_order - b.display_order;
    })
    .map((img) => {
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(img.storage_path);
      return {
        id: img.id,
        productId: row.id,
        storagePath: img.storage_path,
        altText: img.alt_text,
        imageUrl: pub.publicUrl,
        isPrimary: img.is_primary,
        displayOrder: img.display_order,
      };
    });

  const addOns: AddOn[] = (row.product_add_ons ?? [])
    .map((pa) => pa.add_ons)
    .filter(Boolean)
    .map((ao) => ({
      id: ao.id,
      name: ao.name,
      description: ao.description,
      price: { amountMinor: ao.price_minor, currency: 'SGD' as const },
      priceOnRequest: ao.price_on_request,
      isActive: ao.is_active,
    }));

  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sku: row.sku,
    basePrice: { amountMinor: row.base_price_minor, currency: 'SGD' as const },
    tags: row.tags ?? [],
    included: row.included_items ?? [],
    highlightLabel: row.highlight_label ?? undefined,
    displayOrder: row.display_order,
    isActive: row.is_active,
    options: [],
    addOns,
    images,
  };
}

/** Loads products from the Supabase DB first; falls back to fixtures if DB is empty or unavailable. */
export async function getCatalogueProducts(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return exampleCatalogue;

  const supabase = createClient(url, key);

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images ( id, storage_path, alt_text, is_primary, display_order ),
        product_add_ons ( add_on_id, add_ons ( id, name, description, price_minor, price_on_request, is_active ) )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data?.length) {
      // Fall back to fixture-based loader (augments with storage images)
      return getFixtureProducts(supabase);
    }

    return (data as DbRow[]).map((row) => mapDbProduct(row, supabase));
  } catch {
    return getFixtureProducts(supabase);
  }
}

/** Legacy fixture loader — augments fixture products with Supabase Storage images. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFixtureProducts(supabase: any): Promise<Product[]> {
  return Promise.all(exampleCatalogue.map(async (product) => {
    const folder = `packages/${product.slug}`;
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error || !data?.length) return product;

    const images = (data as { name: string; id: string }[])
      .filter((file) => file.name && file.id)
      .sort((a, b) => {
        if (a.name === product.frontImageName) return -1;
        if (b.name === product.frontImageName) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((file, index) => {
        const storagePath = `${folder}/${file.name}`;
        const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        return {
          id: `${product.id}-storage-${index}`,
          productId: product.id,
          storagePath,
          imageUrl: publicUrl.publicUrl,
          altText: `${product.name} image ${index + 1}`,
          isPrimary: index === 0,
          displayOrder: index + 1,
        };
      });

    return images.length ? { ...product, images } : product;
  }));
}

/**
 * Looks up a single product by slug. Uses the DB-backed catalogue first, then
 * falls back to the built-in core packages (classic/signature/premium) so that
 * links hard-coded across the site never 404 when the DB is missing a row.
 */
export async function getCatalogueProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getCatalogueProducts();
  const fromCatalogue = products.find((product) => product.isActive && product.slug === slug);
  if (fromCatalogue) return fromCatalogue;
  return exampleCatalogue.find((product) => product.isActive && product.slug === slug);
}
