import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character] ?? character));
}

async function sendNotification(enquiry: {
  reference: string;
  packageName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  name: string;
  email: string;
  mobile: string;
  venue: string;
  postalCode: string;
  specialRequirements: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.BOOKING_NOTIFICATION_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !recipient || !from) return;

  const safe = Object.fromEntries(Object.entries(enquiry).map(([key, value]) => [key, escapeHtml(value)]));
  const html = `
    <h2>New booking enquiry</h2>
    <p><strong>Reference:</strong> ${safe.reference}</p>
    <p><strong>Package:</strong> ${safe.packageName}</p>
    <p><strong>Date:</strong> ${safe.eventDate}<br><strong>Time:</strong> ${safe.startTime}–${safe.endTime}</p>
    <p><strong>Customer:</strong> ${safe.name}<br><strong>Email:</strong> ${safe.email}<br><strong>Mobile:</strong> ${safe.mobile}</p>
    <p><strong>Venue:</strong> ${safe.venue}<br><strong>Postal code:</strong> ${safe.postalCode}</p>
    <p><strong>Notes:</strong> ${safe.specialRequirements || 'None provided'}</p>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [recipient], subject: `New booking enquiry ${enquiry.reference}`, html }),
  });
}

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

  const packageNames: Record<string, string> = {
    'classic-setup': 'Classic Setup', 'signature-setup': 'Signature Setup', 'premium-setup': 'Premium Setup',
  };
  await sendNotification({
    reference: String(data), packageName: packageNames[String(body.package)] ?? String(body.package),
    eventDate: String(body.eventDate), startTime: String(body.startTime), endTime: String(body.endTime),
    name: String(body.name).trim(), email: String(body.email).trim(), mobile: String(body.mobile).trim(),
    venue: String(body.venue).trim(), postalCode: String(body.postalCode),
    specialRequirements: String(body.specialRequirements ?? '').trim(),
  }).catch(() => undefined);

  return NextResponse.json({ reference: data });
}
