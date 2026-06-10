import { useState } from 'react';
import { GraduationCap, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';
import GoogleButton from '../components/GoogleButton';

export default function Signup({ onSwitchToLogin }) {
  const { signUp, signInWithGoogle, resendConfirmation } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [resent, setResent]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return; }
    setLoading(true);
    const { data, error: err } = await signUp(email, password, name);
    setLoading(false);
    if (err) { setError(translateError(err.message)); return; }
    localStorage.setItem('ps_last_email', email);
    // If email confirmation is disabled, Supabase returns a session —
    // onAuthStateChange logs the user straight in. Otherwise show the email screen.
    if (!data?.session) setDone(true);
  }

  async function handleGoogle() {
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) setError('כניסה עם Google לא זמינה כרגע — אפשר להירשם עם אימייל');
  }

  async function handleResend() {
    const { error: err } = await resendConfirmation(email);
    if (!err) setResent(true);
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card-success">
          <div className="auth-success-icon"><CheckCircle size={48} color="var(--green)" /></div>
          <h1 className="auth-title">כמעט שם! 🎉</h1>
          <p className="auth-subtitle">
            שלחנו קישור אימות אל<br/><strong style={{ color: 'var(--text)' }} dir="ltr">{email}</strong>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '12px 0 20px', lineHeight: 1.6 }}>
            לחץ על הקישור במייל ותועבר ישר פנימה.<br/>לא רואה? בדוק בתיקיית הספאם.
          </p>
          <button className="auth-btn" onClick={onSwitchToLogin}>כבר אימתתי — התחבר</button>
          <button className="auth-link auth-resend" onClick={handleResend} disabled={resent}>
            {resent ? '✓ נשלח שוב — בדוק את המייל' : 'לא הגיע? שלח שוב'}
          </button>
        </div>
      </div>
    );
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

        <h1 className="auth-title">יוצרים חשבון 🚀</h1>
        <p className="auth-subtitle">הצטרף לפרוסטאדי וקח שליטה על הלימודים שלך</p>

        <GoogleButton onClick={handleGoogle} label="הרשמה עם Google"/>
        <div className="auth-divider"><span>או עם אימייל</span></div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">שם מלא</label>
            <input
              className="auth-input"
              type="text"
              placeholder="ישראל ישראלי"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

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
            <PasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="לפחות 6 תווים"
              autoComplete="new-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="auth-btn-spinner" /> : 'מתחילים ללמוד חכם ←'}
          </button>
        </form>

        <div className="auth-trust">
          <span>✓ חינם לגמרי</span>
          <span>✓ הקמה ב-2 דקות</span>
          <span>✓ עובד מעולה בנייד</span>
        </div>

        <p className="auth-switch">
          כבר יש לך חשבון?{' '}
          <button className="auth-link" onClick={onSwitchToLogin}>התחבר</button>
        </p>
      </div>
    </div>
  );
}

function translateError(msg) {
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'האימייל הזה כבר רשום — נסה להתחבר';
  if (msg.includes('Password should be')) return 'הסיסמה חייבת להכיל לפחות 6 תווים';
  if (msg.includes('Unable to validate')) return 'כתובת האימייל לא תקינה';
  return 'אירעה שגיאה, נסה שנית';
}
