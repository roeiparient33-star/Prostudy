import { useState } from 'react';
import { Flame, Snowflake, X, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';
import { getStreakStatus, FREEZE_COST, FREEZE_MAX } from '../lib/streak';
import ModalPortal from './ModalPortal';

// Always-visible streak counter in the Topbar (Duolingo-style loss aversion).
// Click opens details + the streak-freeze shop.
export default function StreakBadge() {
  const { profile, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  if (!profile) return null;
  const { streak, doneToday, alive, freezes } = getStreakStatus(profile);

  async function buyFreeze() {
    if (buying) return;
    setBuying(true);
    const { error } = await updateProfile({
      credits: (profile.credits || 0) - FREEZE_COST,
      streak_freezes: freezes + 1,
    });
    setBuying(false);
    if (error) {
      showToast({ type: 'info', text: 'הקנייה לא הצליחה — נסה שוב עוד רגע' });
      return;
    }
    showToast({ type: 'info', text: '❄️ הקפאת רצף נוספה למלאי — הרצף שלך מוגן!' });
  }

  const canBuy = (profile.credits || 0) >= FREEZE_COST && freezes < FREEZE_MAX;

  return (
    <>
      <button
        className={`stk-badge${doneToday ? ' lit' : ''}`}
        title={doneToday ? 'הרצף שלך מאובטח להיום' : 'סיים סשן לימוד כדי לשמור על הרצף'}
        onClick={() => setOpen(true)}
      >
        <Flame size={16} className="stk-flame"/>
        <span className="stk-num">{streak}</span>
      </button>

      {open && (
        <ModalPortal>
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setOpen(false)}>
            <div className="modal-box stk-modal">
              <button className="modal-close-btn stk-close" onClick={() => setOpen(false)}><X size={17}/></button>

              <div className={`stk-hero${doneToday ? ' lit' : ''}`}>
                <Flame size={44}/>
                <div className="stk-hero-num">{streak}</div>
                <div className="stk-hero-label">ימי רצף</div>
              </div>

              <div className="stk-status">
                {doneToday && '💪 למדת היום — הרצף מאובטח!'}
                {!doneToday && alive && streak > 0 && 'סיים סשן לימוד היום כדי לא לאבד את הרצף 🔥'}
                {!alive && streak === 0 && 'כל סשן לימוד היום מתחיל רצף חדש — קדימה!'}
              </div>

              <div className="stk-row">
                <Trophy size={15}/>
                <span>הרצף הכי ארוך שלך: <strong>{profile.streak_best || 0} ימים</strong></span>
              </div>

              <div className="stk-freeze-box">
                <div className="stk-freeze-head">
                  <Snowflake size={16}/>
                  <span>הקפאות רצף</span>
                  <span className="stk-freeze-count">{freezes}/{FREEZE_MAX}</span>
                </div>
                <p className="stk-freeze-desc">
                  פספסת יום? הקפאה נשרפת אוטומטית במקומו והרצף שלך נשאר בחיים.
                </p>
                <button
                  className="stk-freeze-buy"
                  onClick={buyFreeze}
                  disabled={!canBuy || buying}
                >
                  {freezes >= FREEZE_MAX
                    ? 'המלאי מלא ❄️'
                    : buying
                      ? 'קונה...'
                      : <>קנה הקפאה · 🪙 {FREEZE_COST}</>}
                </button>
                {!canBuy && freezes < FREEZE_MAX && (
                  <div className="stk-freeze-hint">חסרים לך קרדיטים — כל דקת לימוד שווה קרדיט 😉</div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
