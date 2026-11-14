'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '../../../src/supabase/browser';

export default function AccountDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { router.replace('/account'); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/account'); return; }
      setEmail(data.session.user.email ?? null);
      setLoading(false);
    });
  }, [supabase, router]);

  async function signOut() {
    await supabase?.auth.signOut();
    router.push('/account');
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f0f3' }}>
      <p style={{ color: '#765d68' }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(36,21,28,.13)', padding: '36px 32px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.9rem', color: '#db2777', margin: '0 0 4px' }}>
          Balloons &amp; Bliss
        </p>
        <p style={{ color: '#765d68', fontSize: '.86rem', margin: '0 0 28px' }}>My Account</p>

        <div style={{ background: '#fdf4f8', borderRadius: 12, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
          <p style={{ margin: 0, color: '#765d68', fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Signed in as</p>
          <p style={{ margin: 0, color: '#24151c', fontWeight: 600 }}>{email}</p>
        </div>

        <p style={{ color: '#765d68', fontSize: '.9rem', margin: '0 0 24px' }}>
          Your booking portal is coming soon. We'll notify you when it's ready.
        </p>

        <button
          type="button"
          onClick={signOut}
          style={{ background: 'none', border: '1px solid #decbd5', borderRadius: 10, padding: '10px 20px', font: 'inherit', fontSize: '.88rem', color: '#765d68', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
