import { useState } from 'react';
import { Settings, X, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ModalPortal from './ModalPortal';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';
import { isAdmin } from '../lib/admin';

export default function Topbar({ title, onNavigate }) {
  const { user, profile, updateProfile } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">{title}</span>

        <div className="topbar-actions">
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
        />
      )}
    </>
  );
}

function EditProfileModal({ profile, onSave, onClose }) {
  const [name,    setName]    = useState(profile?.name    || '');
  const [semester,setSemester]= useState(profile?.semester|| '');
  const [goal,    setGoal]    = useState(profile?.weekly_goal_hours || 20);
  const [saving,  setSaving]  = useState(false);

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
      </div>
    </div>
    </ModalPortal>
  );
}
