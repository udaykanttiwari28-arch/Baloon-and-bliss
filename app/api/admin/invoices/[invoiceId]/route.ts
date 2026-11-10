import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role not configured.');
  return createClient(url, key);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const { invoiceId } = await params;
  if (!invoiceId) return NextResponse.json({ error: 'Missing invoice id.' }, { status: 400 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const VALID_STATUSES = ['draft', 'sent', 'unpaid', 'paid'];
  if (!('status' in body) || !VALID_STATUSES.includes(body.status as string)) {
    return NextResponse.json({ error: 'status must be one of: draft, sent, unpaid, paid.' }, { status: 400 });
  }

  let supabase;
  try { supabase = getServiceClient(); } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const { error } = await supabase
    .from('invoices')
    .update({ status: body.status })
    .eq('id', invoiceId);

  if (error) {
    console.error('[admin/invoices PATCH]', error);
    return NextResponse.json({ error: 'Could not update invoice.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
