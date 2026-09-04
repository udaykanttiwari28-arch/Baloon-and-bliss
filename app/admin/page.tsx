'use client';

import { useEffect, useMemo, useState } from 'react';
import { getBrowserSupabase } from '../../src/supabase/browser';
import AvailabilityPanel from './availability-panel';
import SiteFooter from '../../src/components/site-footer';

type Status = 'New' | 'Contacted' | 'Confirmed' | 'Cancelled';
type Enquiry = {
  id: string; reference: string; package_slug: string; event_date: string; start_time: string; end_time: string;
  postal_code: string; venue: string; special_requirements: string | null; name: string; email: string; mobile: string;
  whatsapp_opt_in: boolean; status: Status; created_at: string;
};

const statuses: Status[] = ['New', 'Contacted', 'Confirmed', 'Cancelled'];
const packageNames: Record<string, string> = { 'classic-setup': 'Classic Setup', 'signature-setup': 'Signature Setup', 'premium-setup': 'Premium Setup', 'custom-setup': 'Custom setup' };

function formatDate(value: string) { return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)); }
function formatTime(value: string) { const [hour, minute] = value.slice(0, 5).split(':').map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`; }

export default function AdminPage() {
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true); const [message, setMessage] = useState('');

  async function loadEnquiries() {
    if (!supabase) return;
    const { data, error } = await supabase.from('booking_enquiries').select('*').order('created_at', { ascending: false });
    if (error) setMessage(error.message); else setEnquiries((data ?? []) as Enquiry[]);
  }

  useEffect(() => { if (!supabase) { setLoading(false); return; } supabase.auth.getSession().then(({ data }) => { setSessionEmail(data.session?.user.email ?? null); setLoading(false); if (data.session) void loadEnquiries(); }); }, [supabase]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault(); if (!supabase) return; setLoading(true); setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage('Login failed. Check your admin email and password.'); else { setSessionEmail(data.user?.email ?? null); await loadEnquiries(); }
    setLoading(false);
  }

  async function updateStatus(id: string, status: Status) {
    if (!supabase) return; setMessage('');
    const { error } = await supabase.from('booking_enquiries').update({ status }).eq('id', id);
    if (error) setMessage(error.message); else setEnquiries((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }

  if (loading) return <main className="shell admin-shell"><p className="eyebrow">Admin</p><h1>Loading enquiries…</h1></main>;
  if (!sessionEmail) return <main className="shell admin-shell"><div className="admin-login"><p className="eyebrow">Private workspace</p><h1>Admin sign in</h1><p className="lede">Sign in to view and manage booking enquiries.</p><form className="booking-form" onSubmit={signIn}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{message && <p className="form-error" role="alert">{message}</p>}<button className="button" type="submit">Sign in</button></form></div></main>;

  return <main className="shell admin-shell"><header className="admin-header"><div><p className="eyebrow">Private workspace</p><h1>Booking enquiries</h1><p className="lede">Review customer requests and keep each enquiry moving.</p></div><button className="text-button" onClick={() => { void supabase?.auth.signOut(); setSessionEmail(null); }}>Sign out</button></header><AvailabilityPanel />{message && <p className="form-error" role="alert">{message}</p>}<div className="admin-summary"><strong>{enquiries.length}</strong><span>Total enquiries</span><strong>{enquiries.filter((item) => item.status === 'New').length}</strong><span>New to review</span></div>{enquiries.length === 0 ? <div className="empty-card"><h2>No enquiries yet</h2><p>New booking requests will appear here as soon as a customer submits the form.</p></div> : <section className="enquiry-list" aria-label="Booking enquiries">{enquiries.map((item) => <article className="enquiry-card" key={item.id}><div className="enquiry-top"><div><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span><h2>{item.name}</h2><p className="enquiry-reference">{item.reference} · {packageNames[item.package_slug] ?? item.package_slug}</p></div><select value={item.status} onChange={(event) => void updateStatus(item.id, event.target.value as Status)} aria-label={`Update status for ${item.reference}`}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div><div className="enquiry-details"><p><strong>{formatDate(item.event_date)}</strong><br />{formatTime(item.start_time)} – {formatTime(item.end_time)}</p><p><strong>{item.venue}</strong><br />Singapore {item.postal_code}</p><p><a href={`mailto:${item.email}`}>{item.email}</a><br /><a href={`tel:${item.mobile}`}>{item.mobile}</a></p></div>{item.special_requirements && <p className="enquiry-notes"><strong>Notes:</strong> {item.special_requirements}</p>}<div className="enquiry-actions"><a className="text-link" href={`mailto:${item.email}?subject=Your Balloons%20%26%20Bliss%20enquiry%20${item.reference}`}>Email customer →</a>{item.whatsapp_opt_in && <a className="text-link" href={`https://wa.me/${item.mobile.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp customer ↗</a>}</div></article>)}</section>}<SiteFooter /></main>;
}
