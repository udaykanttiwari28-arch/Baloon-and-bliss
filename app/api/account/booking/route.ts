import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    // Verify token against Supabase auth
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
    const anonClient = createClient(anonUrl, anonKey);
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const userEmail = userData.user.email;
    if (!userEmail) return NextResponse.json({ error: 'No email associated with this account.' }, { status: 400 });

    const supabase = serviceClient();

    // Find booking enquiry matched by email (most recent confirmed/converted one first)
    const { data: enquiries, error: enqError } = await supabase
      .from('booking_enquiries')
      .select(`
        id, reference, name, email, mobile,
        celebration_type, event_date, start_time, end_time,
        venue, postal_code, package_slug, special_requirements,
        status, amount_total_minor, deposit_paid_minor, admin_notes,
        mockup_storage_path, converted_to_customer_at, created_at
      `)
      .eq('email', userEmail)
      .order('event_date', { ascending: true, nullsFirst: false });

    if (enqError) return NextResponse.json({ error: enqError.message }, { status: 500 });

    // Prefer converted/confirmed enquiries, fallback to most recent
    const enquiry = (enquiries ?? []).find(e => e.converted_to_customer_at)
      ?? (enquiries ?? []).find(e => e.status === 'Confirmed')
      ?? (enquiries ?? [])[0]
      ?? null;

    if (!enquiry) {
      return NextResponse.json({ enquiry: null, invoices: [], checklist: [] });
    }

    // Fetch invoices and checklist in parallel
    const [invRes, checkRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('id, invoice_number, status, subtotal_minor, gst_minor, total_minor, issued_date, due_date, paid_at')
        .eq('booking_enquiry_id', enquiry.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('booking_checklist_items')
        .select('id, item_name, is_done, sort_order')
        .eq('booking_enquiry_id', enquiry.id)
        .order('sort_order', { ascending: true }),
    ]);

    // Generate signed URL for mockup if present
    let mockupUrl: string | null = null;
    if (enquiry.mockup_storage_path) {
      const { data: signedData } = await supabase.storage
        .from('mockups')
        .createSignedUrl(enquiry.mockup_storage_path.replace(/^mockups\//, ''), 3600);
      mockupUrl = signedData?.signedUrl ?? null;
    }

    return NextResponse.json({
      enquiry: { ...enquiry, mockup_url: mockupUrl },
      invoices: invRes.data ?? [],
      checklist: checkRes.data ?? [],
    });
  } catch (err) {
    console.error('[api/account/booking]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
