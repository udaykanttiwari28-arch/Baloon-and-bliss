import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = adminClient();

    const [custRes, enqRes] = await Promise.all([
      supabase
        .from('customers')
        .select('id, name, salutation, first_name, last_name, email, mobile, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('booking_enquiries')
        .select('id, reference, event_date, celebration_type, status, email, mobile')
        .not('converted_to_customer_at', 'is', null),
    ]);

    if (custRes.error) return NextResponse.json({ error: custRes.error.message }, { status: 500 });

    return NextResponse.json({
      customers: custRes.data ?? [],
      enquiries: enqRes.data ?? [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
