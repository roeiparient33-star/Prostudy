import { useState, useEffect, useRef } from 'react';
import { Zap, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PRESET_SVGS } from '../data/presetSvgs';
import { NEW_PRESET_SVGS } from '../data/newPresetSvgs';
import { ALL_STEPS, QUICK_STEPS } from './steps';

const ALL_PRESET_SVGS = [...PRESET_SVGS, ...NEW_PRESET_SVGS];

export default function OnboardingTour({ page, setPage }) {
  const { profile, updateProfile } = useAuth();
  const [active,     setActive]    = useState(false);
  const [steps,      setSteps]     = useState([]);   // empty = welcome screen
  const [stepIdx,    setStepIdx]   = useState(0);
  const [targetRect, setRect]      = useState(null);
  const measureRef = useRef(null);

  // Activate for new users (avatar chosen, tour not yet done)
  useEffect(() => {
    if (profile && !profile.onboarding_completed_at && profile.avatar_config?.baseSelected) {
      setActive(true);
    }
  }, [profile?.id]); // eslint-disable-line

  const currentStep = steps[stepIdx];

  // Navigate to the step's page when step changes
  useEffect(() => {
    if (!active || !currentStep?.page) return;
    if (currentStep.page !== page) setPage(currentStep.page);
  }, [stepIdx, active]); // eslint-disable-line

  // Measure target element after page renders (for highlight only)
  useEffect(() => {
    if (!active || !currentStep) return;
    clearTimeout(measureRef.current);
    if (!currentStep.target) { setRect(null); return; }
    measureRef.current = setTimeout(() => {
      const el = document.querySelector(currentStep.target);
      setRect(el ? el.getBoundingClientRect() : null);
    }, 140);
  }, [stepIdx, active, page]); // eslint-disable-line

  // Re-measure on resize
  useEffect(() => {
    if (!active || !currentStep?.target) return;
    function onResize() {
      const el = document.querySelector(currentStep.target);
      if (el) setRect(el.getBoundingClientRect());
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, stepIdx]); // eslint-disable-line

  async function completeTour() {
    setActive(false);
    await updateProfile({ onboarding_completed_at: new Date().toISOString() });
  }

  function chooseTour(mode) {
    const chosen = mode === 'quick' ? QUICK_STEPS : ALL_STEPS;
    setSteps(chosen);
    setStepIdx(1); // skip welcome step
  }

  function next() {
    if (stepIdx >= steps.length - 1) completeTour();
    else setStepIdx(i => i + 1);
  }

  function prev() {
    if (stepIdx > 1) setStepIdx(i => i - 1);
  }

  if (!active) return null;

  const avatarSrc = ALL_PRESET_SVGS[profile?.avatar_config?.presetId ?? 0];

  // ── Welcome choice screen ──────────────────────────────────────────────────
  if (steps.length === 0) {
    const step = ALL_STEPS[0];
    return (
      <>
        <div className="tour-overlay" />
        <div className="tour-welcome-box">
          <img src={avatarSrc} className="tour-welcome-avatar" alt="סוכן" />
          <div className="tour-welcome-title">{step.title}</div>
          <p className="tour-welcome-body">{step.body}</p>
          <div className="tour-welcome-choices">
            <button className="tour-choice-btn" onClick={() => chooseTour('quick')}>
              <Zap size={16} />
              <div className="tour-choice-inner">
                <span className="tour-choice-label">טור מהיר</span>
                <span className="tour-choice-sub">5 תחנות · בערך 2 דקות</span>
              </div>
            </button>
            <button className="tour-choice-btn" onClick={() => chooseTour('full')}>
              <List size={16} />
              <div className="tour-choice-inner">
                <span className="tour-choice-label">טור מלא</span>
                <span className="tour-choice-sub">11 תחנות · בערך 5 דקות</span>
              </div>
            </button>
          </div>
          <button className="tour-skip-link" onClick={completeTour}>
            דלג, אני מסתדר לבד ←
          </button>
        </div>
      </>
    );
  }

  // ── Regular tour step ──────────────────────────────────────────────────────
  const totalSteps = steps.length - 1;
  const realStep   = stepIdx;
  const isFirst    = stepIdx === 1;
  const isLast     = stepIdx === steps.length - 1;

  return (
    <>
      {/* Dark backdrop */}
      <div className="tour-overlay" />

      {/* Glowing highlight on the target element */}
      {targetRect && (
        <div
          className="tour-highlight"
          style={{
            left:   targetRect.left   - 6,
            top:    targetRect.top    - 6,
            width:  targetRect.width  + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Bubble — always centered, never moves */}
      <div className="tour-bubble tour-bubble-enter" key={currentStep.id}>

        {/* Head: avatar + title */}
        <div className="tour-bubble-head">
          <img src={avatarSrc} className="tour-avatar-sm" alt="סוכן" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="tour-step-title">{currentStep.title}</div>
            <div className="tour-progress-row">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`tour-dot${i + 1 === realStep ? ' active' : i + 1 < realStep ? ' done' : ''}`}
                />
              ))}
              <span className="tour-count">{realStep} / {totalSteps}</span>
            </div>
          </div>
        </div>

        <p className="tour-bubble-body">{currentStep.body}</p>

        <div className="tour-bubble-actions">
          <button className="tour-skip-btn" onClick={completeTour}>דלג על הסיור</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button className="tour-prev-btn" onClick={prev}>← חזרה</button>
            )}
            <button className="tour-next-btn" onClick={next}>
              {isLast ? 'סיום 🎉' : 'הבא →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
