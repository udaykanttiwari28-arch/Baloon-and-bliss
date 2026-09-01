import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Please send valid enquiry details.' }, { status: 400 });

  const required = ['package', 'eventDate', 'startTime', 'endTime', 'postalCode', 'venue', 'name', 'email', 'mobile'];
  if (required.some((field) => typeof body[field] !== 'string' || !String(body[field]).trim())) {
    return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 });
  }
  if (!emailPattern.test(String(body.email)) || !/^\d{6}$/.test(String(body.postalCode))) {
    return NextResponse.json({ error: 'Please check your email and six-digit postal code.' }, { status: 400 });
  }
  if (String(body.endTime) <= String(body.startTime)) {
    return NextResponse.json({ error: 'End time must be later than start time.' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Enquiries are temporarily unavailable. Please contact us on Instagram.' }, { status: 503 });

  const supabase = createClient(url, key);
  const { data, error } = await supabase.rpc('submit_booking_enquiry', {
    enquiry: {
      package_slug: String(body.package), event_date: String(body.eventDate), start_time: String(body.startTime), end_time: String(body.endTime),
      postal_code: String(body.postalCode), venue: String(body.venue).trim(), special_requirements: String(body.specialRequirements ?? '').trim() || null,
      name: String(body.name).trim(), email: String(body.email).trim().toLowerCase(), mobile: String(body.mobile).trim(), whatsapp_opt_in: body.whatsappOptIn === 'true',
    },
  });
  if (error) return NextResponse.json({ error: 'We could not save your enquiry. Please try again.' }, { status: 500 });
  return NextResponse.json({ reference: data });
}
