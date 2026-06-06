import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { PRESET_SVGS } from '../data/presetSvgs';
import { JPG_PRESET_START } from '../data/avatarData';

// Only the 6 regular (non-premium) presets are free for new users
const FREE_PRESETS = PRESET_SVGS.slice(0, JPG_PRESET_START);

export default function AvatarOnboarding({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);

  async function handleConfirm() {
    if (selected === null) return;
    setSaving(true);
    await onSelect(selected);
    setSaving(false);
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-box">
        {/* Header */}
        <div className="onboarding-logo">
          <div className="sidebar-logo-icon">
            <GraduationCap size={22} color="white"/>
          </div>
          <span className="auth-logo-text">Pro<span>Study</span></span>
        </div>

        <h1 className="onboarding-title">ברוך הבא! 🎉</h1>
        <p className="onboarding-sub">
          בחר סוכן לימודים אחד <strong>חינם</strong> שייצג אותך.<br/>
          סוכני לימודים נוספים ניתן לרכוש בחנות עם קרדיטי לימוד.
        </p>

        {/* Presets grid */}
        <div className="onboarding-grid">
          {FREE_PRESETS.map((src, i) => (
            <button
              key={i}
              className={`onboarding-preset${selected === i ? ' selected' : ''}`}
              onClick={() => setSelected(i)}
            >
              <img src={src} alt={`preset ${i + 1}`} className="onboarding-preset-img"/>
              {selected === i && <div className="onboarding-check">✓</div>}
            </button>
          ))}
        </div>

        <button
          className="auth-btn onboarding-confirm"
          onClick={handleConfirm}
          disabled={selected === null || saving}
        >
          {saving ? <span className="auth-btn-spinner"/> : 'המשך לפלטפורמה →'}
        </button>
      </div>
    </div>
  );
}
