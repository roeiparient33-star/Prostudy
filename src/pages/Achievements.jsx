import { Trophy } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import { achievements } from '../data/mockData';

const RARITY_LABELS = {
  common:    { label: 'נפוץ',      cls: 'rarity-common'    },
  uncommon:  { label: 'לא נפוץ',  cls: 'rarity-uncommon'  },
  rare:      { label: 'נדיר',      cls: 'rarity-rare'      },
  legendary: { label: 'אגדי',      cls: 'rarity-legendary' },
};

const RARITY_GLOW = {
  common:    '#9CA3AF',
  uncommon:  '#3B82F6',
  rare:      '#7C3AED',
  legendary: '#F59E0B',
};

const CATEGORY_LABELS = {
  milestone:  '🏅 ציון דרך',
  streak:     '🔥 רצף',
  course:     '📖 קורס',
  dedication: '💪 מסירות',
  reading:    '📚 קריאה',
  time:       '⏱️ זמן',
  exam:       '🎯 מבחנים',
  variety:    '🌈 מגוון',
  ultimate:   '🏆 אולטימטיבי',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function Achievements() {
  const unlocked = achievements.filter(a => a.unlocked);
  const locked   = achievements.filter(a => !a.unlocked);
  const overallPct = achievements.length ? Math.round((unlocked.length / achievements.length) * 100) : 0;

  if (achievements.length === 0) {
    return (
      <div className="page-enter">
        <div className="achievements-page-header">
          <h2 style={{ fontSize:22,fontWeight:800,letterSpacing:-0.4,color:'var(--text)' }}>ארון הגביעים</h2>
        </div>
        <div className="card" style={{ textAlign:'center',padding:'64px 32px' }}>
          <Trophy size={48} color="var(--text-3)" style={{ marginBottom:16 }}/>
          <div style={{ fontSize:18,fontWeight:700,color:'var(--text-2)',marginBottom:8 }}>אין הישגים עדיין</div>
          <div style={{ fontSize:14,color:'var(--text-3)' }}>השלם משימות, שמור על רצף לימוד וצבור שעות כדי לפתוח הישגים</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="achievements-page-header">
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: 'var(--text)' }}>
          ארון הגביעים
        </h2>
        <div className="achievements-summary">
          <div className="achievements-summary-stat">
            <span className="achievements-summary-value" style={{ color: 'var(--accent)' }}>
              {unlocked.length}
            </span>
            <span className="achievements-summary-label">תגים שהושגו</span>
          </div>
          <div style={{ width: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div className="achievements-summary-stat">
            <span className="achievements-summary-value">{locked.length}</span>
            <span className="achievements-summary-label">תגים נעולים</span>
          </div>
          <div style={{ width: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div className="achievements-summary-stat">
            <span className="achievements-summary-value">{achievements.length}</span>
            <span className="achievements-summary-label">סך הכל</span>
          </div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="achievements-overall-progress">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            התקדמות כוללת
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {unlocked.length}/{achievements.length} תגים
          </span>
        </div>
        <ProgressBar value={overallPct} color="var(--accent)" showLabel={false} />
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
          עוד {locked.length} תגים לפתיחה כדי להשלים את האוסף
        </div>
      </div>

      {/* Unlocked */}
      <div style={{ marginBottom: 32 }}>
        <div className="achievements-section-title">
          <span>✨</span>
          <span>הושגו ({unlocked.length})</span>
        </div>
        <div className="achievements-grid">
          {unlocked.map(ach => {
            const rarity = RARITY_LABELS[ach.rarity] ?? RARITY_LABELS.common;
            const glowColor = RARITY_GLOW[ach.rarity] ?? '#9CA3AF';
            return (
              <div
                key={ach.id}
                className={`achievement-card unlocked ${ach.rarity}`}
              >
                <div
                  className="achievement-card-glow"
                  style={{ background: glowColor }}
                />
                <div className={`achievement-rarity-badge ${rarity.cls}`}>
                  {rarity.label}
                </div>
                <div
                  className="achievement-card-icon-wrap"
                  style={{ background: `${glowColor}18`, border: `1px solid ${glowColor}30` }}
                >
                  {ach.icon}
                </div>
                <div className="achievement-card-title">{ach.title}</div>
                <div className="achievement-card-desc">{ach.description}</div>
                {ach.category && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 8 }}>
                    {CATEGORY_LABELS[ach.category]}
                  </div>
                )}
                <div className="achievement-unlock-date">
                  <span>✓</span>
                  <span>הושג ב-{formatDate(ach.unlockedDate)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Locked */}
      <div>
        <div className="achievements-section-title">
          <span>🔒</span>
          <span>נעולים ({locked.length})</span>
        </div>
        <div className="achievements-grid">
          {locked.map(ach => {
            const rarity = RARITY_LABELS[ach.rarity] ?? RARITY_LABELS.common;
            const glowColor = RARITY_GLOW[ach.rarity] ?? '#9CA3AF';
            const progressPct = ach.requiredCount
              ? Math.round((ach.currentCount / ach.requiredCount) * 100)
              : 0;

            return (
              <div key={ach.id} className="achievement-card locked">
                <div className={`achievement-rarity-badge ${rarity.cls}`} style={{ opacity: 0.6 }}>
                  {rarity.label}
                </div>
                <div className="achievement-card-icon-wrap" style={{ background: '#F3F4F6' }}>
                  {ach.icon}
                </div>
                <div className="achievement-card-title">{ach.title}</div>
                <div className="achievement-card-desc">{ach.description}</div>
                {ach.category && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 10 }}>
                    {CATEGORY_LABELS[ach.category]}
                  </div>
                )}
                {ach.requiredCount != null && (
                  <div className="achievement-lock-progress">
                    <div className="achievement-lock-progress-text">
                      {ach.currentCount}/{ach.requiredCount} · {progressPct}%
                    </div>
                    <ProgressBar
                      value={progressPct}
                      color={glowColor}
                      showLabel={false}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
