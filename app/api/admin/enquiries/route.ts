import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_PACKAGE_SLUGS = ['classic-setup', 'signature-setup', 'premium-setup', 'custom-setup'] as const;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role is not configured.');
  return createClient(url, key);
}

function generateReference(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `BBSG-${date}-${suffix}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });

  const packageSlug = typeof body.package_slug === 'string' && VALID_PACKAGE_SLUGS.includes(body.package_slug as typeof VALID_PACKAGE_SLUGS[number])
    ? body.package_slug
    : null;

  const amountTotal = typeof body.amount_total_minor === 'number' ? Math.floor(body.amount_total_minor) : 0;
  const depositPaid = typeof body.deposit_paid_minor === 'number' ? Math.floor(body.deposit_paid_minor) : 0;

  const row = {
    reference:            generateReference(),
    lead_kind:            'booking',
    source:               'admin',
    name,
    email:                typeof body.email === 'string' ? body.email.trim().toLowerCase() || null : null,
    mobile:               typeof body.mobile === 'string' ? body.mobile.trim() || null : null,
    source_channel:       typeof body.source_channel === 'string' ? body.source_channel.trim() || null : null,
    carousell_id:         typeof body.carousell_id === 'string' ? body.carousell_id.trim() || null : null,
    facebook_id:          typeof body.facebook_id === 'string' ? body.facebook_id.trim() || null : null,
    celebration_type:     typeof body.celebration_type === 'string' ? body.celebration_type.trim() || null : null,
    event_date:           typeof body.event_date === 'string' ? body.event_date || null : null,
    start_time:           typeof body.start_time === 'string' ? body.start_time || null : null,
    end_time:             typeof body.end_time === 'string' ? body.end_time || null : null,
    package_slug:         packageSlug,
    venue:                typeof body.venue === 'string' ? body.venue.trim() || null : null,
    postal_code:          typeof body.postal_code === 'string' ? body.postal_code.trim() || null : null,
    special_requirements: typeof body.special_requirements === 'string' ? body.special_requirements.trim() || null : null,
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
    return NextResponse.json({ error: 'Could not create lead. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, reference: data.reference }, { status: 201 });
}
