'use client';

import { useEffect, useMemo, useState } from 'react';
import { getBrowserSupabase } from '../../src/supabase/browser';
import AvailabilityPanel from './availability-panel';
import SiteFooter from '../../src/components/site-footer';
import AddLeadModal from './add-lead-modal';
import EnquiryDetailPanel, { EnquiryDetail } from './enquiry-detail-panel';
import CalendarPanel from './calendar-panel';

type Status = 'New' | 'Contacted' | 'Confirmed' | 'Cancelled';
type Enquiry = EnquiryDetail & {
  package_slug: string;
  event_date: string;
  start_time: string;
  end_time: string;
  postal_code: string;
  whatsapp_opt_in: boolean;
  created_at: string;
  lead_kind?: 'booking' | 'alvernia_lead';
  source?: string | null;
  campaign?: string | null;
  celebration_month?: string | null;
  guide_delivery_status?: string;
  email_delivery_status?: string;
  whatsapp_delivery_status?: string;
};

const statuses: Status[] = ['New', 'Contacted', 'Confirmed', 'Cancelled'];
const packageNames: Record<string, string> = {
  'classic-setup': 'Classic Setup',
  'signature-setup': 'Signature Setup',
  'premium-setup': 'Premium Setup',
  'custom-setup': 'Custom Setup',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}
function formatTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}
function fmtSGD(minor: number) {
  return `SGD ${(minor / 100).toFixed(2)}`;
}

function BalanceChip({ total, paid }: { total: number; paid: number }) {
  if (total === 0) return null;
  const balance = total - paid;
  if (balance <= 0) return <span style={{ padding: '3px 9px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '.72rem', fontWeight: 700 }}>Paid in Full</span>;
  if (paid === 0) return <span style={{ padding: '3px 9px', borderRadius: 999, background: '#fef2f2', color: '#991b1b', fontSize: '.72rem', fontWeight: 700 }}>Unpaid: {fmtSGD(balance)}</span>;
  return <span style={{ padding: '3px 9px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: '.72rem', fontWeight: 700 }}>Partial: {fmtSGD(balance)}</span>;
}

export default function AdminPage() {
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'alvernia'>('all');
  const [activeTab, setActiveTab] = useState<'enquiries' | 'calendar'>('enquiries');
  const [showAddLead, setShowAddLead] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadEnquiries() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('booking_enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setMessage(error.message);
    else setEnquiries((data ?? []) as Enquiry[]);
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null);
      setLoading(false);
      if (data.session) void loadEnquiries();
    });
  }, [supabase]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true); setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage('Login failed. Check your admin email and password.');
    else { setSessionEmail(data.user?.email ?? null); await loadEnquiries(); }
    setLoading(false);
  }

  async function updateStatus(id: string, status: Status) {
    if (!supabase) return; setMessage('');
    const { error } = await supabase.from('booking_enquiries').update({ status }).eq('id', id);
    if (error) setMessage(error.message);
    else setEnquiries((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }

  function patchEnquiry(id: string, patch: Partial<Enquiry>) {
    setEnquiries((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  if (loading) return <main className="shell admin-shell"><p className="eyebrow">Admin</p><h1>Loading…</h1></main>;

  if (!sessionEmail) return (
    <main className="shell admin-shell">
      <div className="admin-login">
        <p className="eyebrow">Private workspace</p>
        <h1>Admin sign in</h1>
        <p className="lede">Sign in to view and manage booking enquiries.</p>
        <form className="booking-form" onSubmit={signIn}>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {message && <p className="form-error" role="alert">{message}</p>}
          <button className="button" type="submit">Sign in</button>
        </form>
      </div>
    </main>
  );

  const visibleEnquiries = filter === 'alvernia'
    ? enquiries.filter((item) => item.source === 'alvernia')
    : enquiries;

  return (
    <main className="shell admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Private workspace</p>
          <h1>Admin Dashboard</h1>
          <p className="lede">Manage leads, bookings, and customers.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="button" style={{ padding: '10px 18px', fontSize: '.88rem' }} onClick={() => setShowAddLead(true)}>+ Add Lead</button>
          <button className="text-button" onClick={() => { void supabase?.auth.signOut(); setSessionEmail(null); }}>Sign out</button>
        </div>
      </header>

      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onCreated={(created) => {
            setShowAddLead(false);
            void loadEnquiries();
            setExpandedId(created.id);
          }}
        />
      )}

      <AvailabilityPanel />

      {message && <p className="form-error" role="alert">{message}</p>}

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f0dce7', marginBottom: 24 }}>
        {(['enquiries', 'calendar'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '11px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #24151c' : '2px solid transparent',
              marginBottom: -2,
              fontWeight: activeTab === tab ? 700 : 400,
              color: activeTab === tab ? '#24151c' : '#765d68',
              cursor: 'pointer',
              fontSize: '.95rem',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'enquiries' ? 'Enquiries' : 'Calendar'}
          </button>
        ))}
      </div>

      {activeTab === 'calendar' && <CalendarPanel />}

      {activeTab === 'enquiries' && (
        <>
          <div className="admin-summary">
            <strong>{enquiries.length}</strong><span>Total enquiries</span>
            <strong>{enquiries.filter((item) => item.status === 'New').length}</strong><span>New to review</span>
            <label className="admin-filter">
              View{' '}
              <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'alvernia')}>
                <option value="all">All enquiries</option>
                <option value="alvernia">Alvernia Ladies Card</option>
              </select>
            </label>
          </div>

          {visibleEnquiries.length === 0 ? (
            <div className="empty-card">
              <h2>No enquiries yet</h2>
              <p>New requests will appear here as soon as a customer submits a form.</p>
            </div>
          ) : (
            <section className="enquiry-list" aria-label="Booking enquiries">
              {visibleEnquiries.map((item) => {
                const isAlvernia = item.source === 'alvernia';
                const isExpanded = expandedId === item.id;
                return (
                  <article className={`enquiry-card ${isAlvernia ? 'campaign-card' : ''}`} key={item.id}>
                    <div className="enquiry-top">
                      <div>
                        <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
                        {isAlvernia && <span className="campaign-badge">Alvernia Ladies Card</span>}
                        {item.converted_to_customer_at && (
                          <span style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '.72rem', fontWeight: 700 }}>Customer</span>
                        )}
                        <h2>{item.name}</h2>
                        <p className="enquiry-reference">
                          {item.reference} · {isAlvernia ? 'FREE Celebration Guide lead' : (packageNames[item.package_slug] ?? item.package_slug)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <BalanceChip total={item.amount_total_minor ?? 0} paid={item.deposit_paid_minor ?? 0} />
                        <select
                          value={item.status}
                          onChange={(e) => void updateStatus(item.id, e.target.value as Status)}
                          aria-label={`Update status for ${item.reference}`}
                        >
                          {statuses.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {isAlvernia ? (
                      <div className="enquiry-details">
                        <p><strong>{item.email}</strong><br /><a href={`tel:${item.mobile}`}>{item.mobile}</a></p>
                        <p><strong>{item.celebration_type || 'Not provided'}</strong><br />{item.celebration_month || 'Month not provided'}</p>
                        <p><strong>Submitted</strong><br />{formatDate(item.created_at.slice(0, 10))}</p>
                      </div>
                    ) : (
                      <div className="enquiry-details">
                        <p><strong>{item.event_date ? formatDate(item.event_date) : '—'}</strong><br />{item.start_time && item.end_time ? `${formatTime(item.start_time)} – ${formatTime(item.end_time)}` : ''}</p>
                        <p><strong>{item.venue || '—'}</strong><br />{item.postal_code ? `Singapore ${item.postal_code}` : ''}</p>
                        <p><a href={`mailto:${item.email}`}>{item.email}</a><br /><a href={`tel:${item.mobile}`}>{item.mobile}</a></p>
                      </div>
                    )}

                    {isAlvernia && (
                      <div className="delivery-statuses">
                        <span>Guide: <b>{item.guide_delivery_status}</b></span>
                        <span>Email: <b>{item.email_delivery_status}</b></span>
                        <span>WhatsApp: <b>{item.whatsapp_delivery_status}</b></span>
                      </div>
                    )}

                    {item.special_requirements && (
                      <p className="enquiry-notes"><strong>Notes:</strong> {item.special_requirements}</p>
                    )}

                    <div className="enquiry-actions">
                      <a className="text-link" href={`mailto:${item.email}?subject=Your Balloons%20%26%20Bliss%20enquiry%20${item.reference}`}>Email customer →</a>
                      {(item.whatsapp_opt_in || isAlvernia) && (
                        <a className="text-link" href={`https://wa.me/${item.mobile?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp customer ↗</a>
                      )}
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        style={{ fontSize: '.86rem' }}
                      >
                        {isExpanded ? 'Collapse ▲' : 'Details ▼'}
                      </button>
                    </div>

                    {isExpanded && (
                      <EnquiryDetailPanel
                        enquiry={item}
                        onUpdated={(patch) => patchEnquiry(item.id, patch as Partial<Enquiry>)}
                      />
                    )}
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}

      <SiteFooter />
    </main>
  );
}
