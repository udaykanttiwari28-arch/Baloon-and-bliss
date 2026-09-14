import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d][\d\s().-]{7,24}$/;
const celebrationTypes = new Set(['Baby Welcome Home', 'Baby Shower', 'Gender Reveal', 'Full Month', '100 Days', 'First Birthday', 'Birthday', 'Baby Milestone', 'Wedding', 'Proposal', 'Corporate', 'Other']);

type DeliveryStatus = 'sent' | 'failed' | 'not_configured';
type Lead = { id: string; reference: string; name: string; email: string; whatsapp_number: string };

function clean(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character)); }
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return createClient(url, key);
}
function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return createClient(url, key);
}
async function setStatus(id: string, channel: 'email' | 'whatsapp' | 'guide', status: string) {
  try { await adminClient().rpc('update_alvernia_delivery_status', { lead_id: id, channel, delivery_status: status }); } catch (error) { console.error('[alvernia] Could not record delivery status.', error); }
}

async function sendEmail(lead: Lead, guideUrl: string): Promise<DeliveryStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return 'not_configured';
  const name = escapeHtml(lead.name);
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [lead.email], subject: 'Your FREE Celebration Guide from Balloons & Bliss 🎈', html: `<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;color:#24151c;line-height:1.6"><div style="padding:28px 0;color:#db2777;font-size:28px;font-weight:bold">Balloons <span style="color:#f59e0b">&amp;</span> Bliss</div><h1 style="font-family:Georgia,serif;font-weight:normal">Your Celebration Guide is here 🎉</h1><p>Hi ${name},</p><p>Thank you for requesting our FREE Celebration Guide. We hope it makes planning your little one&apos;s special day feel easier and more joyful.</p><p><a href="${guideUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#db2777;color:white;text-decoration:none;font-weight:bold">Download your guide</a></p><p>As an Alvernia Ladies Card member, you also enjoy <strong>15% OFF</strong> our Classic, Signature &amp; Premium décor packages, plus complimentary member benefits.</p><p>Ready to start planning? Reply to this email or <a href="https://wa.me/6583937938">message us on WhatsApp</a>.</p><p>With love,<br />Balloons &amp; Bliss</p></div>` }) });
  if (!response.ok) { console.error('[alvernia] Resend rejected guide email.', response.status, await response.text()); return 'failed'; }
  return 'sent';
}

async function sendWhatsApp(lead: Lead, guideUrl: string): Promise<DeliveryStatus> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return 'not_configured';
  const version = process.env.WHATSAPP_API_VERSION ?? 'v20.0';
  const digits = lead.whatsapp_number.replace(/\D/g, '');
  const to = digits.length === 8 ? `65${digits}` : digits;
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'template', template: { name: process.env.WHATSAPP_ALVERNIA_TEMPLATE_NAME ?? 'alvernia_celebration_guide', language: { code: 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: lead.name }, { type: 'text', text: guideUrl }] }] } }) });
  if (!response.ok) { console.error('[alvernia] WhatsApp rejected guide message.', response.status, await response.text()); return 'failed'; }
  return 'sent';
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Please send valid details.' }, { status: 400 });
  const name = clean(body.name, 100); const email = clean(body.email, 254).toLowerCase(); const whatsapp = clean(body.whatsapp_number, 25);
  const month = clean(body.celebration_month, 7); const type = clean(body.celebration_type, 40);
  if (name.length < 2 || !emailPattern.test(email) || !phonePattern.test(whatsapp) || (type && !celebrationTypes.has(type)) || (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) || body.consent !== 'true') return NextResponse.json({ error: 'Please complete the required fields and consent to guide delivery.' }, { status: 400 });

  let supabase;
  try { supabase = publicClient(); } catch { return NextResponse.json({ error: 'Registrations are temporarily unavailable. Please contact us on WhatsApp.' }, { status: 503 }); }
  const { data, error } = await supabase.rpc('submit_alvernia_lead', { lead: { name, email, whatsapp_number: whatsapp, celebration_month: month || null, celebration_type: type, consent: true } });
  if (error || !data) { console.error('[alvernia] Could not save lead.', error); return NextResponse.json({ error: 'We could not save your details. Please try again.' }, { status: 500 }); }
  const lead = { id: String(data.id), reference: String(data.reference), name, email, whatsapp_number: whatsapp };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const guideUrl = process.env.ALVERNIA_GUIDE_URL ?? `${siteUrl}/celebration-guide.pdf`;
  const [emailStatus, whatsappStatus] = await Promise.all([sendEmail(lead, guideUrl).catch((error) => { console.error('[alvernia] Email delivery failed.', error); return 'failed' as const; }), sendWhatsApp(lead, guideUrl).catch((error) => { console.error('[alvernia] WhatsApp delivery failed.', error); return 'failed' as const; })]);
  await Promise.all([setStatus(lead.id, 'email', emailStatus), setStatus(lead.id, 'whatsapp', whatsappStatus)]);
  const guideStatus = emailStatus === 'sent' && whatsappStatus === 'sent' ? 'sent' : emailStatus === 'failed' || whatsappStatus === 'failed' ? (emailStatus === 'sent' || whatsappStatus === 'sent' ? 'partial' : 'failed') : 'partial';
  await setStatus(lead.id, 'guide', guideStatus);
  return NextResponse.json({ reference: lead.reference, emailStatus, whatsappStatus, guideStatus });
}
