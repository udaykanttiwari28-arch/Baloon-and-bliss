'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBrowserSupabase } from '../../src/supabase/browser';

interface Customer {
  id: string;
  name: string;
  salutation?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  mobile?: string | null;
  created_at: string;
}

interface LinkedEnquiry {
  id: string;
  reference: string;
  event_date?: string | null;
  celebration_type?: string | null;
  status: string;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(iso));
}

function displayName(c: Customer) {
  if (c.first_name) {
    const parts = [c.salutation, c.first_name, c.last_name].filter(Boolean);
    return parts.join(' ');
  }
  return c.name;
}

export default function CustomersPanel() {
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [enquiryMap, setEnquiryMap] = useState<Record<string, LinkedEnquiry>>({});
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }

    Promise.all([
      supabase.from('customers').select('id, name, salutation, first_name, last_name, email, mobile, created_at').order('created_at', { ascending: false }),
      supabase.from('booking_enquiries').select('id, reference, event_date, celebration_type, status, email, mobile').not('converted_to_customer_at', 'is', null),
    ]).then(([custRes, enqRes]) => {
      const custs = (custRes.data ?? []) as Customer[];
      setCustomers(custs);

      // Build a map: match enquiry to customer by email or mobile
      const enqs = (enqRes.data ?? []) as (LinkedEnquiry & { email?: string | null; mobile?: string | null })[];
      const map: Record<string, LinkedEnquiry> = {};
      for (const c of custs) {
        const match = enqs.find((e) =>
          (c.email && e.email && c.email === e.email) ||
          (c.mobile && e.mobile && c.mobile === e.mobile)
        );
        if (match) map[c.id] = match;
      }
      setEnquiryMap(map);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [supabase]);

  const searchLower = search.toLowerCase().trim();
  const visible = customers.filter((c) => {
    if (!searchLower) return true;
    return (
      displayName(c).toLowerCase().includes(searchLower) ||
      (c.email ?? '').toLowerCase().includes(searchLower) ||
      (c.mobile ?? '').includes(searchLower)
    );
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid #f0dce7',
    borderRadius: 10, background: '#fff', color: '#24151c', font: 'inherit', fontSize: '.9rem', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email or phone…"
        style={inputStyle}
      />

      {!loaded && <p style={{ color: '#765d68' }}>Loading customers…</p>}

      {loaded && visible.length === 0 && (
        <div className="empty-card">
          <h2>{search ? 'No customers match' : 'No customers yet'}</h2>
          <p>{search ? 'Try a different search.' : 'Convert a lead to customer from its detail page.'}</p>
        </div>
      )}

      {loaded && visible.length > 0 && (
        <section style={{ display: 'grid', gap: 10 }}>
          {visible.map((c) => {
            const enq = enquiryMap[c.id];
            return (
              <div key={c.id} style={{ background: '#fff', border: '1px solid #f0dce7', borderRadius: 16, padding: '16px 20px', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: '.68rem', fontWeight: 700, marginBottom: 6 }}>Customer</span>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{displayName(c)}</h2>
                    <p style={{ margin: '3px 0 0', color: '#765d68', fontSize: '.82rem' }}>Since {formatDate(c.created_at)}</p>
                  </div>
                  {enq && (
                    <Link
                      href={`/admin/enquiries/${enq.id}`}
                      style={{ padding: '7px 14px', borderRadius: 8, background: '#f5f0f7', color: '#8b5cf6', fontWeight: 700, fontSize: '.8rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      View Booking →
                    </Link>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div>
                    <span style={{ display: 'block', color: '#765d68', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>Email</span>
                    {c.email ? <a href={`mailto:${c.email}`} style={{ color: '#db2777', fontSize: '.88rem', textDecoration: 'none' }}>{c.email}</a> : <span style={{ color: '#765d68', fontSize: '.88rem' }}>—</span>}
                  </div>
                  <div>
                    <span style={{ display: 'block', color: '#765d68', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>Phone</span>
                    {c.mobile ? <a href={`tel:${c.mobile}`} style={{ color: '#db2777', fontSize: '.88rem', textDecoration: 'none' }}>{c.mobile}</a> : <span style={{ color: '#765d68', fontSize: '.88rem' }}>—</span>}
                  </div>
                  {enq && (
                    <div>
                      <span style={{ display: 'block', color: '#765d68', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>Last Booking</span>
                      <span style={{ fontSize: '.88rem', color: '#24151c' }}>
                        {enq.celebration_type ?? 'Booking'}{enq.event_date ? ` · ${new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium' }).format(new Date(`${enq.event_date}T00:00:00`))}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {loaded && (
        <p style={{ margin: 0, color: '#765d68', fontSize: '.8rem' }}>
          {visible.length} customer{visible.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
