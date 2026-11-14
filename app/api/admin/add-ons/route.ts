import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from('add_ons')
      .select('id, name, description, price_minor, price_on_request, is_active')
      .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ addOns: data ?? [] });
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

    const description = typeof body.description === 'string' ? body.description.trim() || null : null;
    const priceMinor = typeof body.price_minor === 'number' ? body.price_minor : 0;
    const priceOnRequest = body.price_on_request === true;
    const isActive = body.is_active !== false;

    const supabase = serviceClient();
    const { data, error } = await supabase
      .from('add_ons')
      .insert({ name, description, price_minor: priceMinor, price_on_request: priceOnRequest, is_active: isActive })
      .select('id, name')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ addOn: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
