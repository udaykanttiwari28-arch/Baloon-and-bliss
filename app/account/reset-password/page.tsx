'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '../../../src/supabase/browser';

export default function AccountResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push('/account'), 2500);
  }

  const inputStyle: React.CSSProperties = {
    padding: '12px 14px', border: '1px solid #decbd5', borderRadius: 10,
    width: '100%', font: 'inherit', fontSize: '1rem', color: '#24151c',
    background: '#fff', boxSizing: 'border-box',
  };

  const card: React.CSSProperties = {
    width: '100%', maxWidth: 440, background: '#fff', borderRadius: 20,
    boxShadow: '0 8px 40px rgba(36,21,28,.13)', padding: '36px 32px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={card}>
        <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.9rem', color: '#db2777', margin: '0 0 4px', textAlign: 'center' }}>
          Balloons &amp; Bliss
        </p>
        <p style={{ color: '#765d68', fontSize: '.86rem', textAlign: 'center', margin: '0 0 28px' }}>Set a new password</p>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#166534', fontWeight: 700, marginBottom: 8 }}>Password updated!</p>
            <p style={{ color: '#765d68', fontSize: '.9rem' }}>Redirecting you to sign in…</p>
          </div>
        ) : !ready ? (
          <p style={{ color: '#765d68', textAlign: 'center' }}>Verifying reset link…</p>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 5, fontSize: '.88rem', fontWeight: 700, color: '#765d68' }}>
              New password <span style={{ fontWeight: 400, color: '#a08090' }}>(min 8 characters)</span>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
            </label>
            <label style={{ display: 'grid', gap: 5, fontSize: '.88rem', fontWeight: 700, color: '#765d68' }}>
              Confirm password
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} autoComplete="new-password" />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button" type="submit" disabled={loading} style={{ border: 'none', cursor: 'pointer', marginTop: 4 }}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
