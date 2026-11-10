import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_PACKAGE_SLUGS = ['classic-setup', 'signature-setup', 'premium-setup', 'custom-setup'] as const;
const VALID_LEAD_TYPES = ['individual', 'corporate'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE = /^[0-9]{6}$/;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role is not configured.');
  return createClient(url, key);
}

function generateReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `BBSG-${date}-${suffix}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : '';
  if (!name) return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });

  // Email validation
  const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
  if (rawEmail && !EMAIL_RE.test(rawEmail)) {
    return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
  }

  // Postal code validation
  const postalCode = typeof body.postal_code === 'string' ? body.postal_code.trim() : null;
  if (postalCode && !POSTAL_RE.test(postalCode)) {
    return NextResponse.json({ error: 'Postal code must be exactly 6 digits.' }, { status: 400 });
  }

  // Time validation
  const startTime = typeof body.start_time === 'string' ? body.start_time : null;
  const endTime = typeof body.end_time === 'string' ? body.end_time : null;
  if (startTime && endTime && startTime >= endTime) {
    return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
  }

  // Amount validation
  const amountTotal = typeof body.amount_total_minor === 'number' ? Math.floor(body.amount_total_minor) : 0;
  const depositPaid = typeof body.deposit_paid_minor === 'number' ? Math.floor(body.deposit_paid_minor) : 0;
  if (amountTotal < 0) return NextResponse.json({ error: 'amount_total_minor must be non-negative.' }, { status: 400 });
  if (depositPaid < 0) return NextResponse.json({ error: 'deposit_paid_minor must be non-negative.' }, { status: 400 });
  if (depositPaid > amountTotal && amountTotal > 0) {
    return NextResponse.json({ error: 'Deposit paid cannot exceed quoted amount.' }, { status: 400 });
  }

  // Lead type
  const leadType = typeof body.lead_type === 'string' && VALID_LEAD_TYPES.includes(body.lead_type as typeof VALID_LEAD_TYPES[number])
    ? body.lead_type
    : 'individual';

  const packageSlug = typeof body.package_slug === 'string' && VALID_PACKAGE_SLUGS.includes(body.package_slug as typeof VALID_PACKAGE_SLUGS[number])
    ? body.package_slug
    : null;

  const row = {
    reference:            generateReference(),
    lead_kind:            'booking',
    source:               'admin',
    lead_type:            leadType,
    name,
    company_name:         typeof body.company_name === 'string' ? body.company_name.trim() || null : null,
    email:                rawEmail || null,
    mobile:               typeof body.mobile === 'string' ? body.mobile.trim() || null : null,
    source_channel:       typeof body.source_channel === 'string' ? body.source_channel.trim() || null : null,
    carousell_id:         typeof body.carousell_id === 'string' ? body.carousell_id.trim() || null : null,
    facebook_id:          typeof body.facebook_id === 'string' ? body.facebook_id.trim() || null : null,
    celebration_type:     typeof body.celebration_type === 'string' ? body.celebration_type.trim() || null : null,
    event_date:           typeof body.event_date === 'string' ? body.event_date || null : null,
    start_time:           startTime,
    end_time:             endTime,
    package_slug:         packageSlug,
    venue:                typeof body.venue === 'string' ? body.venue.trim() || null : null,
    postal_code:          postalCode || null,
    special_requirements: typeof body.special_requirements === 'string' ? body.special_requirements.trim().slice(0, 2000) || null : null,
    amount_total_minor:   amountTotal,
    deposit_paid_minor:   depositPaid,
    admin_notes:          typeof body.admin_notes === 'string' ? body.admin_notes.trim() || null : null,
    status:               'New',
  };

  let supabase;
  try { supabase = getServiceClient(); } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('booking_enquiries')
    .insert(row)
    .select('id, reference')
    .single();

  if (error) {
    console.error('[admin/enquiries] Insert failed:', error);
    return NextResponse.json({ error: `Could not create lead: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, reference: data.reference }, { status: 201 });
}
