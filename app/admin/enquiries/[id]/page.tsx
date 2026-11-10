'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabase } from '../../../../src/supabase/browser';
import EnquiryDetailPanel, { EnquiryDetail } from '../../enquiry-detail-panel';

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);
  const [enquiry, setEnquiry] = useState<EnquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) { setError('Not configured.'); setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/admin'); return; }
      supabase
        .from('booking_enquiries')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data: row, error: err }) => {
          if (err || !row) setError(err?.message ?? 'Enquiry not found.');
          else setEnquiry(row as EnquiryDetail);
          setLoading(false);
        });
    });
  }, [supabase, id, router]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f0f3' }}>
      <p style={{ color: '#765d68' }}>Loading…</p>
    </div>
  );

  if (error || !enquiry) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f0f3', gap: 12 }}>
      <p style={{ color: '#be123c' }}>{error || 'Not found.'}</p>
      <Link href="/admin" style={{ color: '#db2777', fontSize: '.9rem' }}>← Back to Admin</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0f3' }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0dce7', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.86rem', color: '#765d68' }}>
          <Link href="/admin" style={{ color: '#db2777', textDecoration: 'none', fontWeight: 600 }}>Admin</Link>
          <span style={{ color: '#decbd5' }}>/</span>
          <Link href="/admin" style={{ color: '#db2777', textDecoration: 'none', fontWeight: 600 }}>Enquiries</Link>
          <span style={{ color: '#decbd5' }}>/</span>
          <span style={{ color: '#24151c', fontWeight: 700 }}>{enquiry.name}</span>
          <span style={{ color: '#decbd5', marginLeft: 4, fontSize: '.78rem' }}>{enquiry.reference}</span>
        </nav>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <EnquiryDetailPanel
          enquiry={enquiry}
          onUpdated={(patch) => setEnquiry((prev) => prev ? { ...prev, ...patch } : prev)}
        />
      </div>
    </div>
  );
}
