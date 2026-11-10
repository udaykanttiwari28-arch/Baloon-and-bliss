import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role is not configured.');
  return createClient(url, key);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing enquiry id.' }, { status: 400 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });

  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File must be an image (JPEG, PNG, WebP, GIF) or PDF.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be 10 MB or smaller.' }, { status: 400 });
  }

  let supabase;
  try { supabase = getServiceClient(); } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const path = `${id}/${file.name}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('mockups')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error('[admin/mockup] Upload failed:', uploadError);
    return NextResponse.json({ error: 'Could not upload file.' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('booking_enquiries')
    .update({ mockup_storage_path: path })
    .eq('id', id);

  if (updateError) {
    console.error('[admin/mockup] DB update failed:', updateError);
    return NextResponse.json({ error: 'File uploaded but could not save path.' }, { status: 500 });
  }

  const { data: signedData, error: signError } = await supabase.storage
    .from('mockups')
    .createSignedUrl(path, 3600);

  if (signError || !signedData) {
    return NextResponse.json({ path }, { status: 200 });
  }

  return NextResponse.json({ signedUrl: signedData.signedUrl, path });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing enquiry id.' }, { status: 400 });

  let supabase;
  try { supabase = getServiceClient(); } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  const { data: row, error: fetchError } = await supabase
    .from('booking_enquiries')
    .select('mockup_storage_path')
    .eq('id', id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
  }

  if (row.mockup_storage_path) {
    const { error: removeError } = await supabase.storage
      .from('mockups')
      .remove([row.mockup_storage_path]);
    if (removeError) {
      console.error('[admin/mockup] Storage remove failed:', removeError);
      return NextResponse.json({ error: 'Could not delete file from storage.' }, { status: 500 });
    }
  }

  const { error: clearError } = await supabase
    .from('booking_enquiries')
    .update({ mockup_storage_path: null })
    .eq('id', id);

  if (clearError) {
    console.error('[admin/mockup] DB clear failed:', clearError);
    return NextResponse.json({ error: 'File removed but could not clear path.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
