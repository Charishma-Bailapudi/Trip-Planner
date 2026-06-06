import React, { useState } from 'react';
import { login, register } from '../services/api';
import { Compass, Mail, Lock, User, Loader2 } from 'lucide-react';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        if (!emailOrUsername || !password) {
          throw new Error('Please fill in all fields.');
        }
        const data = await login(emailOrUsername, password);
        onAuthSuccess(data);
      } else {
        if (!username || !email || !password) {
          throw new Error('Please fill in all fields.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const data = await register(username, email, password);
        onAuthSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #1b2035 0%, #0d0f18 100%)',
      padding: '1.5rem',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-primary)'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', textAlign: 'center' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '0.8rem', borderRadius: '16px', display: 'flex', alignItems: 'center', marginBottom: '0.2rem' }}>
            <Compass size={36} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>AI Trip Planner</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Plan your next adventure in seconds</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.25rem' }}>
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '6px',
              border: 'none',
              background: isLogin ? 'var(--bg-tertiary)' : 'transparent',
              color: isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '6px',
              border: 'none',
              background: !isLogin ? 'var(--bg-tertiary)' : 'transparent',
              color: !isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'var(--accent-glow)',
            color: 'var(--accent)',
            fontSize: '0.85rem',
            border: '1px solid rgba(255,118,117,0.2)'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {isLogin ? (
            /* Login Fields */
            <div>
              <label htmlFor="login-identity">Email or Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-identity"
                  type="text"
                  placeholder="Enter username or email"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  style={{ paddingLeft: '2.8rem' }}
                  required
                />
              </div>
            </div>
          ) : (
            /* Register Fields */
            <>
              <div>
                <label htmlFor="reg-username">Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="reg-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ paddingLeft: '2.8rem' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.8rem' }}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="reg-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.8rem' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '0.8rem',
              fontSize: '1rem',
              fontWeight: 700,
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            disabled={isLoading}
          >
            {isLoading && <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          margin: 0,
          lineHeight: 1.5
        }}>
          By proceeding, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
