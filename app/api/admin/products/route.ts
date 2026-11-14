import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function GET() {
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images ( id, storage_path, alt_text, is_primary, display_order ),
        product_add_ons ( add_on_id, add_ons ( id, name, description, price_minor, price_on_request, is_active ) )
      `)
      .order('display_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return NextResponse.json({ error: 'name is required.' }, { status: 400 });

    const slug = typeof body.slug === 'string' && body.slug.trim()
      ? body.slug.trim().toLowerCase()
      : toSlug(name);

    const sku = typeof body.sku === 'string' && body.sku.trim()
      ? body.sku.trim().toUpperCase()
      : `BBSG-${slug.toUpperCase()}`;

    const basePriceMinor = typeof body.base_price_minor === 'number' ? body.base_price_minor : 0;
    if (!Number.isInteger(basePriceMinor) || basePriceMinor < 0) {
      return NextResponse.json({ error: 'base_price_minor must be a non-negative integer.' }, { status: 400 });
    }

    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const tags = Array.isArray(body.tags) ? (body.tags as unknown[]).map(String) : [];
    const includedItems = Array.isArray(body.included_items) ? (body.included_items as unknown[]).map(String) : [];
    const highlightLabel = typeof body.highlight_label === 'string' ? body.highlight_label.trim() || null : null;
    const displayOrder = typeof body.display_order === 'number' ? body.display_order : 0;
    const isActive = body.is_active !== false;
    const addOnIds = Array.isArray(body.add_on_ids) ? (body.add_on_ids as unknown[]).map(String) : [];

    const supabase = serviceClient();

    const { data: product, error: insertErr } = await supabase
      .from('products')
      .insert({
        name, slug, sku, description, base_price_minor: basePriceMinor,
        tags, included_items: includedItems, highlight_label: highlightLabel,
        display_order: displayOrder, is_active: isActive,
      })
      .select('id, slug')
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    if (addOnIds.length > 0) {
      const rows = addOnIds.map((id) => ({ product_id: product.id, add_on_id: id }));
      const { error: aoErr } = await supabase.from('product_add_ons').insert(rows);
      if (aoErr) console.error('[products POST] add_ons link failed:', aoErr.message);
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
