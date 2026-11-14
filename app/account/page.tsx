'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '../../src/supabase/browser';

type View = 'signin' | 'signup' | 'forgot';

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  border: '1px solid #decbd5',
  borderRadius: 10,
  width: '100%',
  font: 'inherit',
  fontSize: '1rem',
  color: '#24151c',
  background: '#fff',
  boxSizing: 'border-box',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" aria-hidden="true" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-150.3-93.8c-50.6-62.4-93-152.9-93-238.9C67.2 230.5 199.3 155 329.4 155c65.4 0 120 43.1 161.8 43.1 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </svg>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const supabase = useMemo(() => { try { return getBrowserSupabase(); } catch { return null; } }, []);
  const [view, setView] = useState<View>('signin');

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign up extras
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpDone, setSignUpDone] = useState(false);

  // Forgot password
  const [forgotSent, setForgotSent] = useState(false);

  function clearErrors() { setError(''); }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    clearErrors(); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push('/account/dashboard');
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    clearErrors();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/account/callback` },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSignUpDone(true);
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    clearErrors(); setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/reset-password`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setForgotSent(true);
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    if (!supabase) return;
    clearErrors();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/account/callback` },
    });
  }

  const card: React.CSSProperties = {
    width: '100%',
    maxWidth: 440,
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(36,21,28,.13)',
    padding: '36px 32px',
  };

  const oauthBtn: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    padding: '11px 16px',
    borderRadius: 10,
    border: '1px solid #decbd5',
    font: 'inherit',
    fontSize: '.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const divider: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#765d68',
    fontSize: '.82rem',
    margin: '8px 0',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={card}>
        {/* Brand */}
        <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.9rem', color: '#db2777', margin: '0 0 4px', textAlign: 'center' }}>
          Balloons &amp; Bliss
        </p>
        <p style={{ color: '#765d68', fontSize: '.86rem', textAlign: 'center', margin: '0 0 28px' }}>
          {view === 'forgot' ? 'Reset your password' : 'Your booking account'}
        </p>

        {/* ── FORGOT PASSWORD ── */}
        {view === 'forgot' && (
          forgotSent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#166534', fontWeight: 700, marginBottom: 16 }}>Check your email for a reset link.</p>
              <button type="button" className="text-link" onClick={() => { setView('signin'); setForgotSent(false); }}>Back to sign in</button>
            </div>
          ) : (
            <form onSubmit={handleForgot} style={{ display: 'grid', gap: 14 }}>
              <p style={{ color: '#765d68', fontSize: '.88rem', margin: 0 }}>Enter your email and we'll send a reset link.</p>
              <label style={{ display: 'grid', gap: 5, fontSize: '.88rem', fontWeight: 700, color: '#765d68' }}>
                Email
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button" type="submit" disabled={loading} style={{ border: 'none', cursor: 'pointer', marginTop: 4 }}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <button type="button" className="text-link" style={{ textAlign: 'center', fontSize: '.86rem' }} onClick={() => { setView('signin'); clearErrors(); }}>
                Back to sign in
              </button>
            </form>
          )
        )}

        {/* ── TAB VIEWS ── */}
        {view !== 'forgot' && (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#f5f0f3', borderRadius: 12, padding: 4 }}>
              {(['signin', 'signup'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setView(v); clearErrors(); setSignUpDone(false); }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                    font: 'inherit', fontSize: '.9rem', fontWeight: 700,
                    background: view === v ? '#db2777' : 'transparent',
                    color: view === v ? '#fff' : '#765d68',
                    transition: 'background .15s',
                  }}
                >
                  {v === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* OAuth buttons */}
            <div style={{ display: 'grid', gap: 10, marginBottom: 4 }}>
              <button type="button" style={{ ...oauthBtn, background: '#fff', color: '#24151c' }} onClick={() => handleOAuth('google')}>
                <GoogleIcon /> Continue with Google
              </button>
              <button type="button" style={{ ...oauthBtn, background: '#000', color: '#fff', border: '1px solid #000' }} onClick={() => handleOAuth('apple')}>
                <AppleIcon /> Continue with Apple
              </button>
            </div>

            <div style={divider}>
              <div style={{ flex: 1, height: 1, background: '#f0dce7' }} />
              <span>or</span>
              <div style={{ flex: 1, height: 1, background: '#f0dce7' }} />
            </div>

            {/* ── SIGN IN ── */}
            {view === 'signin' && (
              <form onSubmit={handleSignIn} style={{ display: 'grid', gap: 14, marginTop: 4 }}>
                <label style={{ display: 'grid', gap: 5, fontSize: '.88rem', fontWeight: 700, color: '#765d68' }}>
                  Email
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
                </label>
                <label style={{ display: 'grid', gap: 5, fontSize: '.88rem', fontWeight: 700, color: '#765d68' }}>
                  Password
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" />
                </label>
                <button type="button" className="text-link" style={{ justifySelf: 'start', fontSize: '.84rem' }} onClick={() => { setView('forgot'); clearErrors(); }}>
                  Forgot password?
                </button>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="button" type="submit" disabled={loading} style={{ border: 'none', cursor: 'pointer' }}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            )}

            {/* ── SIGN UP ── */}
            {view === 'signup' && (
              signUpDone ? (
                <div style={{ textAlign: 'center', paddingTop: 8 }}>
                  <p style={{ color: '#166534', fontWeight: 700, marginBottom: 8 }}>Almost there!</p>
                  <p style={{ color: '#765d68', fontSize: '.9rem' }}>Check your email to confirm your account.</p>
                </div>
              ) : (
                <form onSubmit={handleSignUp} style={{ display: 'grid', gap: 14, marginTop: 4 }}>
                  <label style={{ display: 'grid', gap: 5, fontSize: '.88rem', fontWeight: 700, color: '#765d68' }}>
                    Email
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
                  </label>
                  <label style={{ display: 'grid', gap: 5, fontSize: '.88rem', fontWeight: 700, color: '#765d68' }}>
                    Password <span style={{ fontWeight: 400, color: '#a08090' }}>(min 8 characters)</span>
                    <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
                  </label>
                  <label style={{ display: 'grid', gap: 5, fontSize: '.88rem', fontWeight: 700, color: '#765d68' }}>
                    Confirm Password
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
                  </label>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <button className="button" type="submit" disabled={loading} style={{ border: 'none', cursor: 'pointer' }}>
                    {loading ? 'Creating account…' : 'Create account'}
                  </button>
                </form>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
