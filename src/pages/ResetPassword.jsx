import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function ResetPassword({ onDone }) {
  const { updatePassword } = useAuth();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6)        { setError('הסיסמה חייבת להיות לפחות 6 תווים'); return; }
    if (password !== confirm)       { setError('הסיסמאות לא תואמות'); return; }
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) { setError('לא הצלחנו לעדכן — נסה שוב'); return; }
    setSuccess(true);
    setTimeout(onDone, 2000);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><GraduationCap size={22} color="white" /></div>
          <span className="auth-logo-text">Pro<span>Study</span></span>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h1 className="auth-title">הסיסמה עודכנה!</h1>
            <p className="auth-subtitle">מעביר אותך לאפליקציה...</p>
          </div>
        ) : (
          <>
            <h1 className="auth-title">סיסמה חדשה 🔑</h1>
            <p className="auth-subtitle">הגדר סיסמה חדשה לחשבונך</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label">סיסמה חדשה</label>
                <PasswordInput
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="לפחות 6 תווים"
                  autoComplete="new-password"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">אשר סיסמה</label>
                <PasswordInput
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-btn" type="submit" disabled={loading || !password || !confirm}>
                {loading ? <span className="auth-btn-spinner" /> : 'שמור סיסמה חדשה'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
