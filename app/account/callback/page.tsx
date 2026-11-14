'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '../../../src/supabase/browser';

export default function AccountCallbackPage() {
  const router = useRouter();
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);

  useEffect(() => {
    if (!supabase) { router.replace('/account'); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/account/dashboard');
      else router.replace('/account');
    });
  }, [supabase, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f0f3' }}>
      <p style={{ color: '#765d68' }}>Signing you in…</p>
    </div>
  );
}
