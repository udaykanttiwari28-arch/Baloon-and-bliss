import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role not configured.');
  return createClient(url, key);
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${ym}-${suffix}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing enquiry id.' }, { status: 400 });

  let supabase;
  try { supabase = getServiceClient(); } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total_minor, issued_at, due_date')
    .eq('booking_enquiry_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/invoices GET]', error);
    return NextResponse.json({ error: 'Could not load invoices.' }, { status: 500 });
  }

  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing enquiry id.' }, { status: 400 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const lineItems = Array.isArray(body.line_items) ? body.line_items : [];
  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'At least one line item is required.' }, { status: 400 });
  }

  const subtotalMinor = typeof body.subtotal_minor === 'number' ? Math.round(body.subtotal_minor) : 0;
  const gstMinor      = typeof body.gst_minor      === 'number' ? Math.round(body.gst_minor)      : 0;
  const totalMinor    = typeof body.total_minor     === 'number' ? Math.round(body.total_minor)     : 0;

  let supabase;
  try { supabase = getServiceClient(); } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      booking_enquiry_id: id,
      invoice_number:     generateInvoiceNumber(),
      status:             'draft',
      line_items:         lineItems,
      subtotal_minor:     subtotalMinor,
      gst_minor:          gstMinor,
      total_minor:        totalMinor,
      issued_at:          typeof body.issued_at === 'string' && body.issued_at ? body.issued_at : null,
      due_date:           typeof body.due_date   === 'string' && body.due_date   ? body.due_date   : null,
      notes:              typeof body.notes      === 'string' ? body.notes.trim() || null : null,
    })
    .select('id, invoice_number, status, total_minor, issued_at, due_date')
    .single();

  if (error) {
    console.error('[admin/invoices POST]', error);
    return NextResponse.json({ error: 'Could not create invoice.' }, { status: 500 });
  }

  return NextResponse.json({ invoice: data }, { status: 201 });
}
