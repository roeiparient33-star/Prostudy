import { useState, useEffect, useCallback } from 'react';
import { onToast } from '../lib/toast';

const TOAST_DURATION = 4200;

// Toast shapes:
//   { type:'credits',     amount: 25, streak?: 5 }
//   { type:'achievement', icon:'🔥', title:'שבוע מושלם', rarity:'uncommon' }
//   { type:'info',        text:'...' }
export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => onToast(toast => {
    setToasts(prev => [...prev.slice(-2), toast]); // max 3 on screen
    setTimeout(() => dismiss(toast.id), TOAST_DURATION);
  }), [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
          {t.type === 'credits' && (
            <>
              <span className="toast-emoji">🪙</span>
              <div className="toast-body">
                <div className="toast-title">+{t.amount} קרדיטים!</div>
                <div className="toast-sub">
                  {t.streak ? `🔥 יום ${t.streak} ברצף — כל הכבוד!` : 'כל דקת לימוד נספרת'}
                </div>
              </div>
            </>
          )}
          {t.type === 'achievement' && (
            <>
              <span className={`toast-emoji toast-trophy rarity-${t.rarity || 'common'}`}>{t.icon}</span>
              <div className="toast-body">
                <div className="toast-title">הישג חדש! {t.title}</div>
                <div className="toast-sub">נפתח בארון הגביעים שלך 🏆</div>
              </div>
            </>
          )}
          {(t.type === 'info' || t.type === 'success' || t.type === 'error') && (
            <div className="toast-body"><div className="toast-title">{t.text}</div></div>
          )}
        </div>
      ))}
    </div>
  );
}
