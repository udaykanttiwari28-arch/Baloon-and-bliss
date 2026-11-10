import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_STATUSES = ['New', 'Contacted', 'Confirmed', 'Cancelled', 'Lost'] as const;
const VALID_LEAD_TYPES = ['individual', 'corporate'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE = /^[0-9]{6}$/;

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

  // Status
  if ('status' in body) {
    if (!VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}.` }, { status: 400 });
    }
    updates.status = body.status;
  }

  // Payment fields
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
    // Cross-validate against amount if both provided
    const total = ('amount_total_minor' in updates ? updates.amount_total_minor : null) as number | null;
    if (total !== null && (val as number) > total) {
      return NextResponse.json({ error: 'deposit_paid_minor cannot exceed amount_total_minor.' }, { status: 400 });
    }
    updates.deposit_paid_minor = val;
  }

  // Notes
  if ('admin_notes' in body) {
    updates.admin_notes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() || null : null;
  }

  // Lead type
  if ('lead_type' in body) {
    if (!VALID_LEAD_TYPES.includes(body.lead_type as typeof VALID_LEAD_TYPES[number])) {
      return NextResponse.json({ error: `lead_type must be 'individual' or 'corporate'.` }, { status: 400 });
    }
    updates.lead_type = body.lead_type;
  }

  // Company name
  if ('company_name' in body) {
    updates.company_name = typeof body.company_name === 'string' ? body.company_name.trim() || null : null;
  }

  // Follow-up
  if ('follow_up_date' in body) {
    updates.follow_up_date = body.follow_up_date || null;
  }
  if ('follow_up_notes' in body) {
    updates.follow_up_notes = typeof body.follow_up_notes === 'string' ? body.follow_up_notes.trim() || null : null;
  }

  // Close reason
  if ('close_reason' in body) {
    updates.close_reason = typeof body.close_reason === 'string' ? body.close_reason.trim() || null : null;
  }

  // Email
  if ('email' in body) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    updates.email = email || null;
  }

  // Postal code
  if ('postal_code' in body) {
    const pc = typeof body.postal_code === 'string' ? body.postal_code.trim() : null;
    if (pc && !POSTAL_RE.test(pc)) {
      return NextResponse.json({ error: 'Postal code must be exactly 6 digits.' }, { status: 400 });
    }
    updates.postal_code = pc || null;
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
