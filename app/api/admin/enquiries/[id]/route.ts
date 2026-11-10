import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role is not configured.');
  return createClient(url, key);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing enquiry id.' }, { status: 400 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const updates: Record<string, unknown> = {};

  if ('amount_total_minor' in body) {
    const val = body.amount_total_minor;
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
      return NextResponse.json({ error: 'amount_total_minor must be a non-negative integer.' }, { status: 400 });
    }
    updates.amount_total_minor = val;
  }

  if ('deposit_paid_minor' in body) {
    const val = body.deposit_paid_minor;
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
      return NextResponse.json({ error: 'deposit_paid_minor must be a non-negative integer.' }, { status: 400 });
    }
    updates.deposit_paid_minor = val;
  }

  if ('admin_notes' in body) {
    updates.admin_notes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() || null : null;
  }

  if ('status' in body) {
    const VALID = ['New', 'Contacted', 'Quoted', 'Confirmed', 'Cancelled', 'Lost'];
    if (typeof body.status !== 'string' || !VALID.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }
    updates.status = body.status;
  }

  if ('lead_type' in body) {
    if (body.lead_type !== 'individual' && body.lead_type !== 'corporate') {
      return NextResponse.json({ error: 'lead_type must be individual or corporate.' }, { status: 400 });
    }
    updates.lead_type = body.lead_type;
  }

  if ('company_name' in body) {
    updates.company_name = typeof body.company_name === 'string' ? body.company_name.trim() || null : null;
  }

  if ('follow_up_date' in body) {
    updates.follow_up_date = typeof body.follow_up_date === 'string' && body.follow_up_date ? body.follow_up_date : null;
  }

  if ('follow_up_notes' in body) {
    updates.follow_up_notes = typeof body.follow_up_notes === 'string' ? body.follow_up_notes.trim() || null : null;
  }

  if ('close_reason' in body) {
    updates.close_reason = typeof body.close_reason === 'string' ? body.close_reason.trim() || null : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided.' }, { status: 400 });
  }

  let supabase;
  try { supabase = getServiceClient(); } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const { error } = await supabase
    .from('booking_enquiries')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[admin/enquiries/:id] Update failed:', error);
    return NextResponse.json({ error: 'Could not update enquiry.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
