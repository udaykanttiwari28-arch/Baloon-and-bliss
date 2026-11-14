import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'product-images';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ images: [] });

    const supabase = createClient(url, key);

    // List all folders in the bucket (one per package slug)
    const { data: folders } = await supabase.storage.from(bucket).list('packages', { limit: 100 });
    if (!folders?.length) return NextResponse.json({ images: [] });

    // List files in every folder in parallel
    const fileArrays = await Promise.all(
      folders.map(async (folder) => {
        const { data: files } = await supabase.storage
          .from(bucket)
          .list(`packages/${folder.name}`, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
        return (files ?? [])
          .filter(f => f.name && f.id)
          .map(f => {
            const path = `packages/${folder.name}/${f.name}`;
            const { data } = supabase.storage.from(bucket).getPublicUrl(path);
            return data.publicUrl;
          });
      })
    );

    const images = fileArrays.flat();
    return NextResponse.json({ images });
  } catch (err) {
    console.error('[api/gallery]', err);
    return NextResponse.json({ images: [] });
  }
}
