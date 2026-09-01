import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'A valid date is required.' }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ busy: [] });
  const { data, error } = await createClient(url, key).rpc('get_booking_busy_times', { target_date: date });
  if (error) return NextResponse.json({ error: 'Availability is temporarily unavailable.' }, { status: 500 });
  return NextResponse.json({ busy: data ?? [] });
}
