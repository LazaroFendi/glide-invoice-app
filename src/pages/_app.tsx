import React, { useState } from 'react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto-condensed/700.css';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';

const HARDCODED_EMAIL = 'hello@glidesurf.travel';
const HARDCODED_PASSWORD = 'yeZjEbcWjeVTfbZ';

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
      setError('');
      onLogin();
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 32, borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minWidth: 320 }}>
        <h2 style={{ fontFamily: 'Roboto Condensed, Roboto, Arial, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 24 }}>GLIDE Invoice Login</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Password</label>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', paddingRight: 36 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                color: showPassword ? '#222' : '#888',
                transition: 'color 0.15s',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onMouseOver={e => (e.currentTarget.style.color = '#222')}
              onMouseOut={e => (e.currentTarget.style.color = showPassword ? '#222' : '#888')}
            >
              {showPassword ? (
                // Minimalist eye-off SVG
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.09-2.73 2.99-4.98 5.38-6.32" /><path d="M1 1l22 22" /><circle cx="12" cy="12" r="3" /></svg>
              ) : (
                // Minimalist eye SVG
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', background: '#222', color: 'white', padding: 10, borderRadius: 4, fontWeight: 700, fontFamily: 'Roboto Condensed, Roboto, Arial, sans-serif', fontSize: 16, border: 'none' }}>Log In</button>
      </form>
    </div>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
