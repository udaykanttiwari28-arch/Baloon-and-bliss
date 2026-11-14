import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images ( id, storage_path, alt_text, is_primary, display_order ),
        product_add_ons ( add_on_id, add_ons ( id, name, description, price_minor, price_on_request, is_active ) )
      `)
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ product: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if ('name' in body && typeof body.name === 'string') updates.name = body.name.trim();
    if ('description' in body && typeof body.description === 'string') updates.description = body.description.trim();
    if ('slug' in body && typeof body.slug === 'string') updates.slug = body.slug.trim().toLowerCase();
    if ('sku' in body && typeof body.sku === 'string') updates.sku = body.sku.trim().toUpperCase();
    if ('base_price_minor' in body && typeof body.base_price_minor === 'number') {
      if (!Number.isInteger(body.base_price_minor) || body.base_price_minor < 0) {
        return NextResponse.json({ error: 'base_price_minor must be a non-negative integer.' }, { status: 400 });
      }
      updates.base_price_minor = body.base_price_minor;
    }
    if ('tags' in body && Array.isArray(body.tags)) updates.tags = (body.tags as unknown[]).map(String);
    if ('included_items' in body && Array.isArray(body.included_items)) updates.included_items = (body.included_items as unknown[]).map(String);
    if ('highlight_label' in body) updates.highlight_label = typeof body.highlight_label === 'string' ? body.highlight_label.trim() || null : null;
    if ('display_order' in body && typeof body.display_order === 'number') updates.display_order = body.display_order;
    if ('is_active' in body && typeof body.is_active === 'boolean') updates.is_active = body.is_active;

    const supabase = serviceClient();

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('products').update(updates).eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Replace add-ons if provided
    if ('add_on_ids' in body && Array.isArray(body.add_on_ids)) {
      await supabase.from('product_add_ons').delete().eq('product_id', id);
      const addOnIds = (body.add_on_ids as unknown[]).map(String);
      if (addOnIds.length > 0) {
        const rows = addOnIds.map((aid) => ({ product_id: id, add_on_id: aid }));
        const { error } = await supabase.from('product_add_ons').insert(rows);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const hard = new URL(request.url).searchParams.get('hard') === 'true';
  try {
    const supabase = serviceClient();
    if (hard) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
