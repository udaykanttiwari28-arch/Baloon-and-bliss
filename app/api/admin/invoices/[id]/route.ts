import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface LineItem {
  description: string;
  quantity: number;
  unit_price_minor: number;
}

const VALID_STATUSES = ['draft', 'sent', 'unpaid', 'paid'] as const;

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

function calcTotals(lineItems: LineItem[]) {
  const subtotal = lineItems.reduce((s, item) => s + Math.round(item.quantity * item.unit_price_minor), 0);
  const gst = Math.round(subtotal * 0.09);
  return { subtotal_minor: subtotal, gst_minor: gst, total_minor: subtotal + gst };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = adminClient();
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
    return NextResponse.json({ invoice: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = adminClient();
    const body = await req.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if ('status' in body) {
      const s = body.status;
      if (!VALID_STATUSES.includes(s as typeof VALID_STATUSES[number])) {
        return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}.` }, { status: 400 });
      }
      updates.status = s;
      if (s === 'paid') updates.paid_at = new Date().toISOString();
    }

    if ('line_items' in body) {
      const items = body.line_items as LineItem[];
      if (!Array.isArray(items)) return NextResponse.json({ error: 'line_items must be an array.' }, { status: 400 });
      const { subtotal_minor, gst_minor, total_minor } = calcTotals(items);
      updates.line_items = items;
      updates.subtotal_minor = subtotal_minor;
      updates.gst_minor = gst_minor;
      updates.total_minor = total_minor;
    }

    if ('notes' in body) updates.notes = typeof body.notes === 'string' ? body.notes.trim() || null : null;
    if ('issued_date' in body) updates.issued_date = body.issued_date || null;
    if ('due_date' in body) updates.due_date = body.due_date || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided.' }, { status: 400 });
    }

    const { error } = await supabase.from('invoices').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
