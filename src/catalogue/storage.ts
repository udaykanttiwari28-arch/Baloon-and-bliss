import { createClient } from '@supabase/supabase-js';
import type { Product } from '../domain/types';
import { exampleCatalogue } from './fixtures';

const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'product-images';

/** Loads public images from Supabase Storage, falling back to the UI fixture. */
export async function getCatalogueProducts(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return exampleCatalogue;

  const supabase = createClient(url, key);
  return Promise.all(exampleCatalogue.map(async (product) => {
    const folder = `packages/${product.slug}`;
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error || !data?.length) return product;

    const images = data
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
