'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBrowserSupabase } from '../../src/supabase/browser';
import AvailabilityPanel from './availability-panel';
import AddLeadModal from './add-lead-modal';
import { EnquiryDetail } from './enquiry-detail-panel';
import CalendarPanel from './calendar-panel';
import CustomersPanel from './customers-panel';

type Status = 'New' | 'Contacted' | 'Confirmed' | 'Cancelled' | 'Lost';
type Tab = 'customers' | 'enquiries' | 'calendar' | 'availability';

type Enquiry = EnquiryDetail & {
  package_slug: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  postal_code: string | null;
  whatsapp_opt_in: boolean;
  created_at: string;
  lead_kind?: 'booking' | 'alvernia_lead';
  lead_type?: 'individual' | 'corporate' | null;
  company_name?: string | null;
  source?: string | null;
  campaign?: string | null;
  celebration_month?: string | null;
  follow_up_date?: string | null;
  close_reason?: string | null;
  guide_delivery_status?: string;
  email_delivery_status?: string;
  whatsapp_delivery_status?: string;
};

const statuses: Status[] = ['New', 'Contacted', 'Confirmed', 'Cancelled', 'Lost'];
const packageNames: Record<string, string> = {
  'classic-setup': 'Classic Setup',
  'signature-setup': 'Signature Setup',
  'premium-setup': 'Premium Setup',
  'custom-setup': 'Custom Setup',
};

const NAV: { key: Tab; icon: string; label: string }[] = [
  { key: 'customers',    icon: '👥', label: 'Customers' },
  { key: 'enquiries',    icon: '📋', label: 'Leads & Enquiries' },
  { key: 'calendar',     icon: '📅', label: 'Calendar' },
  { key: 'availability', icon: '🚫', label: 'Availability' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}
function formatTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}
function fmtSGD(minor: number) {
  return `S$${(minor / 100).toFixed(2)}`;
}

function BalanceChip({ total, paid }: { total: number; paid: number }) {
  if (total === 0) return null;
  const balance = total - paid;
  if (balance <= 0) return <span style={{ padding: '3px 9px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '.7rem', fontWeight: 700 }}>Paid in Full</span>;
  if (paid === 0) return <span style={{ padding: '3px 9px', borderRadius: 999, background: '#fef2f2', color: '#991b1b', fontSize: '.7rem', fontWeight: 700 }}>Unpaid: {fmtSGD(balance)}</span>;
  return <span style={{ padding: '3px 9px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: '.7rem', fontWeight: 700 }}>Partial: {fmtSGD(balance)}</span>;
}

export default function AdminPage() {
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'alvernia' | 'admin'>('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('enquiries');
  const [showAddLead, setShowAddLead] = useState(false);

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

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setLoading(true); setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) setMessage('Login failed. Check your credentials.');
    else { setSessionEmail(data.user?.email ?? null); await loadEnquiries(); }
    setLoading(false);
  }

  async function updateStatus(id: string, status: Status) {
    if (!supabase) return;
    const { error } = await supabase.from('booking_enquiries').update({ status }).eq('id', id);
    if (!error) setEnquiries((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }


  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f0f3' }}>
      <p style={{ color: '#765d68' }}>Loading…</p>
    </div>
  );

  if (!sessionEmail) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f0f3', padding: 20 }}>
      <div className="admin-login">
        <p className="eyebrow">Private workspace</p>
        <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Admin sign in</h1>
        <p className="lede" style={{ fontSize: '.95rem', marginBottom: 24 }}>Sign in to manage leads and bookings.</p>
        <form className="booking-form" onSubmit={signIn}>
          <label>Email<input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email" required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {message && <p className="form-error" role="alert">{message}</p>}
          <button className="button" type="submit" style={{ border: 'none', cursor: 'pointer' }}>Sign in</button>
        </form>
      </div>
    </div>
  );

  // Stats
  const confirmed = enquiries.filter((e) => e.status === 'Confirmed');
  const totalRevenue = confirmed.reduce((s, e) => s + (e.amount_total_minor ?? 0), 0);
  const totalOutstanding = confirmed.reduce((s, e) => {
    const bal = (e.amount_total_minor ?? 0) - (e.deposit_paid_minor ?? 0);
    return s + (bal > 0 ? bal : 0);
  }, 0);
  const today = new Date().toISOString().slice(0, 10);
  const followUpsDue = enquiries.filter((e) =>
    e.follow_up_date && e.follow_up_date <= today && !['Confirmed', 'Cancelled', 'Lost'].includes(e.status)
  ).length;

  const searchLower = search.toLowerCase().trim();
  const visibleEnquiries = enquiries.filter((item) => {
    if (filter === 'alvernia' && item.source !== 'alvernia') return false;
    if (filter === 'admin' && item.source !== 'admin') return false;
    if (searchLower) {
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.reference.toLowerCase().includes(searchLower) ||
        (item.email ?? '').toLowerCase().includes(searchLower) ||
        (item.mobile ?? '').includes(searchLower) ||
        (item.company_name ?? '').toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const tabTitle: Record<Tab, string> = {
    customers: 'Customers',
    enquiries: 'Leads & Enquiries',
    calendar: 'Booking Calendar',
    availability: 'Availability',
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span>Balloons <em>&</em> Bliss</span>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV.map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              className={`admin-nav-item${activeTab === key ? ' active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className="admin-nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ marginBottom: 6, padding: '8px 12px', color: 'rgba(255,255,255,.4)', fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Signed in as
          </div>
          <div style={{ padding: '0 12px 10px', color: 'rgba(255,255,255,.65)', fontSize: '.8rem', wordBreak: 'break-all' }}>{sessionEmail}</div>
          <button
            type="button"
            className="admin-nav-item"
            onClick={() => { void supabase?.auth.signOut(); setSessionEmail(null); }}
          >
            <span className="admin-nav-icon">🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-content">
        {/* Top bar */}
        <div className="admin-topbar">
          <h1 className="admin-topbar-title">{tabTitle[activeTab]}</h1>
          <div className="admin-topbar-actions">
            {activeTab === 'enquiries' && (
              <button
                className="button"
                type="button"
                style={{ margin: 0, padding: '9px 18px', fontSize: '.86rem', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowAddLead(true)}
              >
                + Add Lead
              </button>
            )}
          </div>
        </div>

        <div className="admin-page-body">
          {/* Stats row — always visible */}
          <div className="admin-stats">
            <div className="stat-card"><div className="stat-value">{enquiries.length}</div><div className="stat-label">Total Leads</div></div>
            <div className="stat-card stat-pink"><div className="stat-value">{enquiries.filter((e) => e.status === 'New').length}</div><div className="stat-label">New</div></div>
            <div className="stat-card stat-green"><div className="stat-value">{confirmed.length}</div><div className="stat-label">Confirmed</div></div>
            <div className="stat-card stat-green"><div className="stat-value" style={{ fontSize: '1.1rem' }}>{fmtSGD(totalRevenue)}</div><div className="stat-label">Total Revenue</div></div>
            <div className="stat-card stat-red"><div className="stat-value" style={{ fontSize: '1.1rem' }}>{fmtSGD(totalOutstanding)}</div><div className="stat-label">Outstanding</div></div>
            <div className="stat-card stat-amber"><div className="stat-value">{followUpsDue}</div><div className="stat-label">Follow-ups Due</div></div>
          </div>

          {message && <p className="form-error" role="alert" style={{ marginBottom: 16 }}>{message}</p>}

          {/* Customers tab */}
          {activeTab === 'customers' && <CustomersPanel />}

          {/* Calendar tab */}
          {activeTab === 'calendar' && <CalendarPanel />}

          {/* Availability tab */}
          {activeTab === 'availability' && <AvailabilityPanel />}

          {/* Enquiries tab */}
          {activeTab === 'enquiries' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, phone, reference…"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #f0dce7', borderRadius: 10, background: '#fff', color: '#24151c', font: 'inherit', fontSize: '.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div className="admin-filter-bar">
                <span style={{ color: '#765d68', fontSize: '.86rem', fontWeight: 700 }}>Filter:</span>
                {(['all', 'admin', 'alvernia'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: '1px solid',
                      borderColor: filter === f ? '#db2777' : '#f0dce7',
                      background: filter === f ? '#fce7f3' : '#fff',
                      color: filter === f ? '#db2777' : '#765d68',
                      fontWeight: filter === f ? 700 : 400,
                      cursor: 'pointer', font: 'inherit', fontSize: '.82rem',
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'admin' ? 'Admin-added' : 'Alvernia'}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto', color: '#765d68', fontSize: '.82rem' }}>
                  {visibleEnquiries.length} enquir{visibleEnquiries.length === 1 ? 'y' : 'ies'}
                </span>
              </div>

              {visibleEnquiries.length === 0 ? (
                <div className="empty-card">
                  <h2>No enquiries</h2>
                  <p>No enquiries match the current filter. Click <strong>+ Add Lead</strong> to create one manually.</p>
                </div>
              ) : (
                <section className="enquiry-list" aria-label="Booking enquiries">
                  {visibleEnquiries.map((item) => {
                    const isAlvernia = item.source === 'alvernia';
                    return (
                      <article className={`enquiry-card${isAlvernia ? ' campaign-card' : ''}`} key={item.id} style={{ cursor: 'pointer' }} onClick={() => { window.location.href = `/admin/enquiries/${item.id}`; }}>
                        <div className="enquiry-top">
                          <div>
                            <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
                            {isAlvernia && <span className="campaign-badge">Alvernia</span>}
                            {item.source === 'admin' && <span style={{ marginLeft: 6, padding: '3px 8px', borderRadius: 999, background: '#f0f0ff', color: '#5b21b6', fontSize: '.68rem', fontWeight: 700 }}>Admin</span>}
                            {item.converted_to_customer_at && <span style={{ marginLeft: 6, padding: '3px 8px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '.68rem', fontWeight: 700 }}>Customer</span>}
                            {item.lead_type === 'corporate' && <span style={{ marginLeft: 6, padding: '3px 8px', borderRadius: 999, background: '#ede9fe', color: '#5b21b6', fontSize: '.68rem', fontWeight: 700 }}>Corporate</span>}
                            {item.follow_up_date && item.follow_up_date <= today && !['Confirmed', 'Cancelled', 'Lost'].includes(item.status) && <span style={{ marginLeft: 6, padding: '3px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: '.68rem', fontWeight: 700 }}>Follow-up Due</span>}
                            <h2>{item.name}{item.company_name ? <span style={{ color: '#765d68', fontWeight: 400, fontSize: '.9rem' }}> · {item.company_name}</span> : null}</h2>
                            <p className="enquiry-reference">
                              {item.reference}
                              {item.package_slug && ` · ${packageNames[item.package_slug] ?? item.package_slug}`}
                              {item.source_channel && ` · via ${item.source_channel}`}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <BalanceChip total={item.amount_total_minor ?? 0} paid={item.deposit_paid_minor ?? 0} />
                            <select
                              value={item.status}
                              onChange={(e) => void updateStatus(item.id, e.target.value as Status)}
                              aria-label={`Status for ${item.reference}`}
                            >
                              {statuses.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>

                        {isAlvernia ? (
                          <div className="enquiry-details">
                            <p><strong>{item.email || '—'}</strong><br /><a href={`tel:${item.mobile}`}>{item.mobile}</a></p>
                            <p><strong>{item.celebration_type || 'Not provided'}</strong><br />{item.celebration_month || 'Month not provided'}</p>
                            <p><strong>Submitted</strong><br />{formatDate(item.created_at.slice(0, 10))}</p>
                          </div>
                        ) : (
                          <div className="enquiry-details">
                            <p>
                              <strong>{item.event_date ? formatDate(item.event_date) : '—'}</strong><br />
                              {item.start_time && item.end_time ? `${formatTime(item.start_time)} – ${formatTime(item.end_time)}` : 'Time TBC'}
                            </p>
                            <p>
                              <strong>{item.venue || '—'}</strong><br />
                              {item.postal_code ? `Singapore ${item.postal_code}` : ''}
                            </p>
                            <p>
                              {item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : '—'}<br />
                              {item.mobile ? <a href={`tel:${item.mobile}`}>{item.mobile}</a> : ''}
                            </p>
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
                          <p className="enquiry-notes" style={{ marginTop: 10 }}><strong>Notes:</strong> {item.special_requirements}</p>
                        )}

                        <div className="enquiry-actions" onClick={(e) => e.stopPropagation()}>
                          {item.email && <a className="text-link" href={`mailto:${item.email}?subject=Your Balloons%20%26%20Bliss%20enquiry%20${item.reference}`}>Email →</a>}
                          {item.mobile && (item.whatsapp_opt_in || isAlvernia) && (
                            <a className="text-link" href={`https://wa.me/${item.mobile.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp ↗</a>
                          )}
                          <Link href={`/admin/enquiries/${item.id}`} className="text-link" style={{ fontSize: '.84rem' }}>View Details →</Link>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onCreated={(created) => {
            setShowAddLead(false);
            window.location.href = `/admin/enquiries/${created.id}`;
          }}
        />
      )}
    </div>
  );
}
