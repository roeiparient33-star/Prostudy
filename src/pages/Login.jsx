import { useState } from 'react';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login({ onSwitchToSignup }) {
  const { signIn, sendPasswordReset } = useAuth();
  const [view, setView]         = useState('login'); // 'login' | 'forgot' | 'sent'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) setError(translateError(err.message));
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await sendPasswordReset(email);
    setLoading(false);
    if (err) { setError('לא הצלחנו לשלוח — בדוק שהאימייל נכון'); return; }
    setView('sent');
  }

  // ── Sent confirmation ──────────────────────────────────────────────────────
  if (view === 'sent') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h1 className="auth-title">בדוק את המייל שלך</h1>
          <p className="auth-subtitle" style={{ marginBottom: 24 }}>
            שלחנו קישור לאיפוס סיסמה לכתובת<br/>
            <strong style={{ color: 'var(--text)' }}>{email}</strong>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.6 }}>
            לחץ על הקישור במייל כדי להגדיר סיסמה חדשה.<br/>
            לא קיבלת? בדוק בתיקיית הספאם.
          </p>
          <button
            className="auth-link"
            onClick={() => { setView('login'); setError(''); }}
          >
            חזרה להתחברות
          </button>
        </div>
      </div>
    );
  }

  // ── Forgot password ────────────────────────────────────────────────────────
  if (view === 'forgot') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon"><GraduationCap size={22} color="white" /></div>
            <span className="auth-logo-text">Pro<span>Study</span></span>
          </div>

          <button
            className="auth-back-btn"
            onClick={() => { setView('login'); setError(''); }}
            aria-label="חזרה"
          >
            <ArrowRight size={16} /> חזרה
          </button>

          <h1 className="auth-title">שכחת סיסמה?</h1>
          <p className="auth-subtitle">נשלח לך קישור לאיפוס סיסמה למייל</p>

          <form className="auth-form" onSubmit={handleForgot}>
            <div className="auth-field">
              <label className="auth-label">אימייל</label>
              <input
                className="auth-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                dir="ltr"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-btn" type="submit" disabled={loading || !email}>
              {loading ? <span className="auth-btn-spinner" /> : 'שלח קישור לאיפוס'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><GraduationCap size={22} color="white" /></div>
          <span className="auth-logo-text">Pro<span>Study</span></span>
        </div>

        <h1 className="auth-title">ברוך השב 👋</h1>
        <p className="auth-subtitle">התחבר לחשבון שלך כדי להמשיך ללמוד</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <label className="auth-label">אימייל</label>
            <input
              className="auth-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">
              סיסמה
              <button
                type="button"
                className="auth-forgot-link"
                onClick={() => { setView('forgot'); setError(''); }}
              >
                שכחת סיסמה?
              </button>
            </label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              dir="ltr"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="auth-btn-spinner" /> : 'התחבר'}
          </button>
        </form>

        <p className="auth-switch">
          עדיין אין לך חשבון?{' '}
          <button className="auth-link" onClick={onSwitchToSignup}>הירשם עכשיו</button>
        </p>
      </div>
    </div>
  );
}

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'אימייל או סיסמה שגויים';
  if (msg.includes('Email not confirmed'))       return 'יש לאמת את האימייל שלך לפני ההתחברות';
  if (msg.includes('Too many requests'))         return 'יותר מדי ניסיונות — נסה שוב עוד כמה דקות';
  return 'אירעה שגיאה, נסה שנית';
}
