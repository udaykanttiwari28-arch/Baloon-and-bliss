'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '../../../src/supabase/browser';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Enquiry {
  id: string;
  reference: string;
  name: string;
  email: string;
  celebration_type: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  postal_code: string | null;
  package_slug: string | null;
  special_requirements: string | null;
  status: string;
  amount_total_minor: number;
  deposit_paid_minor: number;
  admin_notes: string | null;
  mockup_storage_path: string | null;
  mockup_url: string | null;
  converted_to_customer_at: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  subtotal_minor: number;
  gst_minor: number;
  total_minor: number;
  issued_date: string | null;
  due_date: string | null;
  paid_at: string | null;
}

interface ChecklistItem {
  id: string;
  item_name: string;
  is_done: boolean;
  sort_order: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sgd(minor: number) {
  return `SGD ${(minor / 100).toFixed(2)}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}

const PKG_LABELS: Record<string, string> = {
  'classic-setup': 'Classic Setup',
  'signature-setup': 'Signature Setup',
  'premium-setup': 'Premium Setup',
  'custom-setup': 'Custom Setup',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  New:       { bg: '#dbeafe', color: '#1d4ed8' },
  Contacted: { bg: '#fef3c7', color: '#92400e' },
  Confirmed: { bg: '#dcfce7', color: '#166534' },
  Cancelled: { bg: '#f3f4f6', color: '#6b7280' },
  Lost:      { bg: '#fee2e2', color: '#991b1b' },
};

const INV_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft:  { bg: '#f3f4f6', color: '#6b7280' },
  sent:   { bg: '#dbeafe', color: '#1d4ed8' },
  unpaid: { bg: '#fef3c7', color: '#92400e' },
  paid:   { bg: '#dcfce7', color: '#166534' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AccountDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);

  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (!supabase) { router.replace('/account'); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/account'); return; }
      setEmail(data.session.user.email ?? null);
      setToken(data.session.access_token);
      setLoading(false);
    });
  }, [supabase, router]);

  // Fetch booking data once we have a token
  useEffect(() => {
    if (!token) return;
    setBookingLoading(true);
    fetch('/api/account/booking', {
      headers: { authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setEnquiry(data.enquiry ?? null);
        setInvoices(data.invoices ?? []);
        setChecklist(data.checklist ?? []);
      })
      .catch(() => setBookingError('Could not load booking details.'))
      .finally(() => setBookingLoading(false));
  }, [token]);

  async function signOut() {
    await supabase?.auth.signOut();
    router.push('/account');
  }

  // ─── Loading / shell ────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f0f3' }}>
      <p style={{ color: '#765d68' }}>Loading…</p>
    </div>
  );

  const balance = enquiry ? enquiry.amount_total_minor - enquiry.deposit_paid_minor : 0;
  const statusStyle = enquiry ? (STATUS_STYLES[enquiry.status] ?? { bg: '#f3f4f6', color: '#6b7280' }) : null;
  const checkDone = checklist.filter(c => c.is_done).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0f3', padding: '24px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.9rem', color: '#db2777', margin: 0 }}>
              Balloons &amp; Bliss
            </p>
            <p style={{ color: '#765d68', fontSize: '.82rem', margin: '2px 0 0' }}>My Booking Portal</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 6px', fontSize: '.82rem', color: '#765d68' }}>{email}</p>
            <button
              onClick={signOut}
              style={{ background: 'none', border: '1px solid #decbd5', borderRadius: 8, padding: '6px 14px', fontSize: '.82rem', color: '#765d68', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Booking loading / error */}
        {bookingLoading && (
          <Card><p style={{ color: '#765d68', margin: 0 }}>Loading your booking…</p></Card>
        )}
        {bookingError && (
          <Card><p style={{ color: '#dc2626', margin: 0 }}>{bookingError}</p></Card>
        )}

        {/* No booking found */}
        {!bookingLoading && !bookingError && !enquiry && (
          <Card>
            <p style={{ color: '#765d68', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
              We don't have a booking on file for <strong>{email}</strong> yet.<br />
              Once your enquiry is confirmed you'll see all the details here.
            </p>
          </Card>
        )}

        {/* Booking details */}
        {enquiry && !bookingLoading && (
          <>
            {/* Booking card */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#24151c', fontSize: '1.05rem' }}>{enquiry.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '.82rem', color: '#765d68' }}>Ref: {enquiry.reference}</p>
                </div>
                {statusStyle && (
                  <span style={{ background: statusStyle.bg, color: statusStyle.color, fontSize: '.76rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                    {enquiry.status}
                  </span>
                )}
              </div>

              <Divider />

              <Grid>
                <Field label="Occasion" value={enquiry.celebration_type ?? '—'} />
                <Field label="Package" value={enquiry.package_slug ? PKG_LABELS[enquiry.package_slug] ?? enquiry.package_slug : '—'} />
                <Field label="Event Date" value={fmtDate(enquiry.event_date)} />
                <Field label="Time" value={
                  enquiry.start_time
                    ? [fmtTime(enquiry.start_time), fmtTime(enquiry.end_time)].filter(Boolean).join(' – ')
                    : '—'
                } />
                <Field label="Venue" value={enquiry.venue ?? '—'} span />
                {enquiry.postal_code && <Field label="Postal Code" value={enquiry.postal_code} />}
                {enquiry.special_requirements && <Field label="Requirements" value={enquiry.special_requirements} span />}
              </Grid>
            </Card>

            {/* Payment */}
            <Card>
              <SectionTitle>Payment</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 16px', marginTop: 12 }}>
                <PayTile label="Quoted" amount={enquiry.amount_total_minor} color="#24151c" />
                <PayTile label="Deposit Paid" amount={enquiry.deposit_paid_minor} color="#166534" />
                <PayTile
                  label="Balance"
                  amount={balance}
                  color={balance > 0 ? '#dc2626' : '#166534'}
                />
              </div>
            </Card>

            {/* Agreed Mockup */}
            {enquiry.mockup_url && (
              <Card>
                <SectionTitle>Agreed Mockup</SectionTitle>
                <div style={{ marginTop: 12 }}>
                  {/\.(jpg|jpeg|png|gif|webp)$/i.test(enquiry.mockup_storage_path ?? '') ? (
                    <img
                      src={enquiry.mockup_url}
                      alt="Event mockup"
                      style={{ width: '100%', borderRadius: 10, border: '1px solid #f0e6ec' }}
                    />
                  ) : (
                    <a
                      href={enquiry.mockup_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fdf4f8', border: '1px solid #f0e6ec', borderRadius: 8, padding: '10px 16px', color: '#db2777', textDecoration: 'none', fontSize: '.88rem', fontWeight: 600 }}
                    >
                      📄 View Mockup PDF
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Checklist */}
            {checklist.length > 0 && (
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <SectionTitle style={{ margin: 0 }}>Preparation Checklist</SectionTitle>
                  <span style={{ fontSize: '.8rem', color: '#765d68' }}>{checkDone}/{checklist.length} done</span>
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {checklist.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        background: item.is_done ? '#db2777' : '#fff',
                        border: item.is_done ? 'none' : '2px solid #decbd5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {item.is_done && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '.88rem', color: item.is_done ? '#765d68' : '#24151c', textDecoration: item.is_done ? 'line-through' : 'none' }}>
                        {item.item_name}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 14, height: 6, background: '#f0e6ec', borderRadius: 99 }}>
                  <div style={{ height: '100%', background: '#db2777', borderRadius: 99, width: `${checklist.length ? (checkDone / checklist.length) * 100 : 0}%`, transition: 'width .3s' }} />
                </div>
              </Card>
            )}

            {/* Invoices */}
            {invoices.length > 0 && (
              <Card>
                <SectionTitle>Invoices</SectionTitle>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {invoices.map(inv => {
                    const is = INV_STATUS_STYLES[inv.status] ?? { bg: '#f3f4f6', color: '#6b7280' };
                    return (
                      <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fdf4f8', borderRadius: 10, padding: '12px 14px', gap: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '.88rem', color: '#24151c' }}>{inv.invoice_number}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: '#765d68' }}>
                            {inv.issued_date ? `Issued ${fmtDate(inv.issued_date)}` : 'Draft'}
                            {inv.due_date ? ` · Due ${fmtDate(inv.due_date)}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span style={{ background: is.bg, color: is.color, fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{inv.status}</span>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '.92rem', color: '#24151c' }}>{sgd(inv.total_minor)}</p>
                          {inv.status !== 'draft' && (
                            <a
                              href={`/api/admin/invoices/${inv.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ background: '#db2777', color: '#fff', fontSize: '.76rem', fontWeight: 700, padding: '5px 12px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(36,21,28,.09)', padding: '20px 22px', marginBottom: 16 }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ margin: '0 0 0', fontWeight: 700, fontSize: '.82rem', color: '#765d68', letterSpacing: '.07em', textTransform: 'uppercase', ...style }}>{children}</p>;
}

function Divider() {
  return <div style={{ height: 1, background: '#f0e6ec', margin: '14px 0' }} />;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>{children}</div>;
}

function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div style={span ? { gridColumn: '1 / -1' } : undefined}>
      <p style={{ margin: 0, fontSize: '.72rem', color: '#765d68', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: '3px 0 0', fontSize: '.9rem', color: '#24151c' }}>{value}</p>
    </div>
  );
}

function PayTile({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div style={{ background: '#fdf4f8', borderRadius: 10, padding: '12px 14px' }}>
      <p style={{ margin: 0, fontSize: '.72rem', color: '#765d68', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '1rem', color }}>{sgd(amount)}</p>
    </div>
  );
}
