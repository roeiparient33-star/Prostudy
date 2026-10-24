import { useState } from 'react';
import { Settings, X, BarChart3, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { showToast } from '../lib/toast';
import ModalPortal from './ModalPortal';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';
import StreakBadge from './StreakBadge';
import { isAdmin } from '../lib/admin';

export default function Topbar({ title, onNavigate }) {
  const { user, profile, updateProfile } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">{title}</span>

        <div className="topbar-actions">
          <StreakBadge/>
          {isAdmin(user) && onNavigate && (
            <button className="topbar-icon-btn topbar-admin-btn" title='חמ"ל' onClick={() => onNavigate('admin')}>
              <BarChart3 size={17}/>
            </button>
          )}
          <button className="topbar-icon-btn" title="הגדרות" onClick={() => setShowSettings(true)}>
            <Settings size={17}/>
          </button>
          <NotificationBell/>
          <div className="topbar-avatar-wrap" title={profile?.name} onClick={() => setShowSettings(true)}>
            <UserAvatar profile={profile} size={36}/>
          </div>
        </div>
      </header>

      {showSettings && (
        <EditProfileModal
          profile={profile}
          onSave={async (updates) => { await updateProfile(updates); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
          onNewSemester={async (newSemester) => {
            await updateProfile({ semester: newSemester });
            setShowSettings(false);
            onNavigate?.('dashboard');
          }}
        />
      )}
    </>
  );
}

function EditProfileModal({ profile, onSave, onClose, onNewSemester }) {
  const [name,    setName]    = useState(profile?.name    || '');
  const [semester,setSemester]= useState(profile?.semester|| '');
  const [goal,    setGoal]    = useState(profile?.weekly_goal_hours || 20);
  const [saving,  setSaving]  = useState(false);
  const [resetMode, setResetMode] = useState(false);

  if (resetMode) {
    return <NewSemesterModal onBack={() => setResetMode(false)} onClose={onClose} onDone={onNewSemester}/>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name: name.trim(), semester: semester.trim(), weekly_goal_hours: Number(goal) });
    setSaving(false);
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <span className="modal-head-title">הגדרות פרופיל</span>
          <button className="modal-close-btn" onClick={onClose}><X size={17}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">שם מלא</label>
            <input className="modal-input" value={name} onChange={e=>setName(e.target.value)} placeholder="ישראל ישראלי" required/>
          </div>
          <div className="modal-field">
            <label className="modal-label">סמסטר</label>
            <input className="modal-input" value={semester} onChange={e=>setSemester(e.target.value)} placeholder="סמסטר א׳, 2026"/>
          </div>
          <div className="modal-field">
            <label className="modal-label">יעד שעות לימוד שבועי</label>
            <input className="modal-input" type="number" min={1} max={100} value={goal} onChange={e=>setGoal(e.target.value)} dir="ltr"/>
          </div>
          <div className="modal-actions">
            <button type="submit" className="modal-btn-primary" disabled={saving || !name.trim()}>
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button type="button" className="modal-btn-ghost" onClick={onClose}>ביטול</button>
          </div>
        </form>

        <div className="new-semester-zone">
          <div>
            <div className="new-semester-title">מתחילים סמסטר / שנה חדשה?</div>
            <div className="new-semester-sub">ניקוי הקורסים, המשימות, המבחנים ומערכת השעות</div>
          </div>
          <button type="button" className="new-semester-open-btn" onClick={() => setResetMode(true)}>
            <RotateCcw size={15}/> סמסטר חדש
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

function NewSemesterModal({ onBack, onClose, onDone }) {
  const { courses, tasks, exams, resetSemester } = useData();
  const [semester, setSemester] = useState('');
  const [busy,     setBusy]     = useState(false);

  async function handleReset() {
    setBusy(true);
    const { error } = await resetSemester();
    if (error) {
      setBusy(false);
      showToast({ type: 'info', text: 'האיפוס נכשל — בדוק חיבור ונסה שוב' });
      return;
    }
    await onDone(semester.trim());
    showToast({ type: 'info', text: '🎓 סמסטר חדש התחיל — בהצלחה!' });
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <span className="modal-head-title">התחלת סמסטר חדש</span>
          <button className="modal-close-btn" onClick={onClose} disabled={busy}><X size={17}/></button>
        </div>

        <div className="new-semester-warn">
          <AlertTriangle size={18}/>
          <span>הפעולה מוחקת לצמיתות ואי אפשר לבטל אותה.</span>
        </div>

        <div className="new-semester-lists">
          <div>
            <div className="new-semester-list-title">יימחק</div>
            <ul>
              <li>{courses.length} קורסים</li>
              <li>{tasks.length} משימות (וספירת המשימות שהושלמו)</li>
              <li>{exams.length} מבחנים</li>
              <li>כל השיעורים במערכת השעות</li>
            </ul>
          </div>
          <div>
            <div className="new-semester-list-title keep">נשמר</div>
            <ul>
              <li>קרדיטים ורצף</li>
              <li>גביעים שכבר נפתחו</li>
              <li>האווטר והפריטים</li>
              <li>חברים, צוותים וחומרי לימוד</li>
            </ul>
          </div>
        </div>

        <div className="modal-field">
          <label className="modal-label">שם הסמסטר החדש (לא חובה)</label>
          <input className="modal-input" value={semester} onChange={e => setSemester(e.target.value)} placeholder="סמסטר ב׳, 2027"/>
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn-primary new-semester-confirm-btn" onClick={handleReset} disabled={busy}>
            {busy ? 'מאפס...' : 'כן, לאפס ולהתחיל מחדש'}
          </button>
          <button type="button" className="modal-btn-ghost" onClick={onBack} disabled={busy}>חזרה</button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
