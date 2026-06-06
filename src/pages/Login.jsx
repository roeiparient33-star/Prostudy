import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login({ onSwitchToSignup }) {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) setError(translateError(err.message));
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <GraduationCap size={22} color="white" />
          </div>
          <span className="auth-logo-text">Pro<span>Study</span></span>
        </div>

        <h1 className="auth-title">ברוך השב 👋</h1>
        <p className="auth-subtitle">התחבר לחשבון שלך כדי להמשיך ללמוד</p>

        <form className="auth-form" onSubmit={handleSubmit}>
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
            <label className="auth-label">סיסמה</label>
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
  if (msg.includes('Email not confirmed')) return 'יש לאמת את האימייל שלך לפני ההתחברות';
  if (msg.includes('Too many requests')) return 'יותר מדי ניסיונות — נסה שוב עוד כמה דקות';
  return 'אירעה שגיאה, נסה שנית';
}
