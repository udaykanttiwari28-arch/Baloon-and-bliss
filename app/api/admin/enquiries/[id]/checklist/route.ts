import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_ITEMS = [
  'Order backdrop',
  'Design backdrop',
  'Verify backdrop with customer',
  'Order number light',
  'Order balloon supplies',
  'Confirm deposit received',
  'Send booking confirmation',
  'Day-of setup ready',
];

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('booking_checklist_items')
      .select('*')
      .eq('booking_enquiry_id', id)
      .order('sort_order')
      .order('created_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = adminClient();
    const body = await req.json() as { item_name?: string; seed_defaults?: boolean };

    if (body.seed_defaults) {
      const rows = DEFAULT_ITEMS.map((item_name, i) => ({
        booking_enquiry_id: id,
        item_name,
        sort_order: i,
      }));
      const { data, error } = await supabase.from('booking_checklist_items').insert(rows).select();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ items: data });
    }

    const item_name = body.item_name?.trim();
    if (!item_name) return NextResponse.json({ error: 'item_name is required.' }, { status: 400 });

    const { data: existing } = await supabase
      .from('booking_checklist_items')
      .select('sort_order')
      .eq('booking_enquiry_id', id)
      .order('sort_order', { ascending: false })
      .limit(1);
    const sort_order = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('booking_checklist_items')
      .insert({ booking_enquiry_id: id, item_name, sort_order })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
