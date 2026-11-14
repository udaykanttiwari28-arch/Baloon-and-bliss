import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = serviceClient();

    // Get product slug for storage path
    const { data: product, error: productErr } = await supabase
      .from('products')
      .select('id, slug')
      .eq('id', id)
      .single();
    if (productErr || !product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

    const isPrimary = formData.get('is_primary') === 'true';
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${Date.now()}.${ext}`;
    const storagePath = `packages/${product.slug}/${filename}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(storagePath);

    // Count existing images for display_order
    const { count } = await supabase
      .from('product_images')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id);

    if (isPrimary) {
      await supabase.from('product_images').update({ is_primary: false }).eq('product_id', id);
    }

    const { data: image, error: imgErr } = await supabase
      .from('product_images')
      .insert({
        product_id: id,
        storage_path: storagePath,
        alt_text: `${product.slug} image`,
        is_primary: isPrimary,
        display_order: (count ?? 0) + 1,
      })
      .select('id, storage_path')
      .single();

    if (imgErr) return NextResponse.json({ error: imgErr.message }, { status: 500 });

    return NextResponse.json({ image: { ...image, image_url: publicUrlData.publicUrl } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const imageId = new URL(request.url).searchParams.get('imageId');
  if (!imageId) return NextResponse.json({ error: 'imageId query param required.' }, { status: 400 });

  try {
    const supabase = serviceClient();

    const { data: image, error: fetchErr } = await supabase
      .from('product_images')
      .select('id, storage_path')
      .eq('id', imageId)
      .eq('product_id', id)
      .single();
    if (fetchErr || !image) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });

    await supabase.storage.from('product-images').remove([image.storage_path]);
    const { error: delErr } = await supabase.from('product_images').delete().eq('id', imageId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
