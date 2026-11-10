import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface LineItem {
  description: string;
  quantity: number;
  unit_price_minor: number;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

function generateInvoiceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `INV-${date}-${suffix}`;
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
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, total_minor, issued_date, due_date, paid_at, created_at')
      .eq('booking_enquiry_id', id)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ invoices: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = adminClient();
    const body = await req.json() as {
      line_items?: LineItem[];
      notes?: string;
      issued_date?: string;
      due_date?: string;
    };

    const lineItems: LineItem[] = Array.isArray(body.line_items) ? body.line_items : [];
    for (const item of lineItems) {
      if (!item.description?.trim()) return NextResponse.json({ error: 'Each line item must have a description.' }, { status: 400 });
      if (typeof item.quantity !== 'number' || item.quantity <= 0) return NextResponse.json({ error: 'Each line item must have a positive quantity.' }, { status: 400 });
      if (typeof item.unit_price_minor !== 'number' || item.unit_price_minor < 0) return NextResponse.json({ error: 'Each line item price must be a non-negative number.' }, { status: 400 });
    }

    const { subtotal_minor, gst_minor, total_minor } = calcTotals(lineItems);

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        booking_enquiry_id: id,
        invoice_number: generateInvoiceNumber(),
        line_items: lineItems,
        subtotal_minor,
        gst_minor,
        total_minor,
        notes: body.notes?.trim() || null,
        issued_date: body.issued_date || null,
        due_date: body.due_date || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ invoice: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
