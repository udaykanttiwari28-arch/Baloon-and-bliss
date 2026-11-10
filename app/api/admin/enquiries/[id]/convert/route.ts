import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured.');
  return createClient(url, key);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = adminClient();

    const body = await req.json().catch(() => ({})) as {
      salutation?: string;
      first_name?: string;
      last_name?: string;
    };

    const { data: enquiry, error: fetchErr } = await supabase
      .from('booking_enquiries')
      .select('id, name, email, mobile, converted_to_customer_at')
      .eq('id', id)
      .single();

    if (fetchErr || !enquiry) return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
    if (enquiry.converted_to_customer_at) return NextResponse.json({ error: 'Already converted.' }, { status: 409 });

    const firstName = body.first_name?.trim() || enquiry.name.split(' ')[0] || enquiry.name;
    const lastName = body.last_name?.trim() || enquiry.name.split(' ').slice(1).join(' ') || null;
    const salutation = body.salutation?.trim() || null;

    // Create or find customer record
    let customerId: string | null = null;
    if (enquiry.email) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', enquiry.email)
        .maybeSingle();
      if (existing) {
        customerId = existing.id as string;
      }
    }

    if (!customerId) {
      const customerRow: Record<string, unknown> = {
        name: enquiry.name,
        first_name: firstName,
        last_name: lastName || null,
        salutation,
      };
      if (enquiry.email) customerRow.email = enquiry.email;
      if (enquiry.mobile) customerRow.mobile = enquiry.mobile;
      const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert(customerRow)
        .select('id')
        .single();
      if (custErr || !newCustomer) return NextResponse.json({ error: custErr?.message ?? 'Failed to create customer.' }, { status: 500 });
      customerId = newCustomer.id as string;
    }

    // Mark enquiry as converted
    const { error: updateErr } = await supabase
      .from('booking_enquiries')
      .update({ converted_to_customer_at: new Date().toISOString() })
      .eq('id', id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Seed default checklist if not already present
    const { data: existing } = await supabase
      .from('booking_checklist_items')
      .select('id')
      .eq('booking_enquiry_id', id)
      .limit(1);

    if (!existing || existing.length === 0) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/admin/enquiries/${id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed_defaults: true }),
      });
    }

    return NextResponse.json({ success: true, customerId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
