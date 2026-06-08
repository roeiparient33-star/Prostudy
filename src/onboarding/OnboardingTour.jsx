import { useState, useEffect, useRef } from 'react';
import { Zap, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PRESET_SVGS } from '../data/presetSvgs';
import { NEW_PRESET_SVGS } from '../data/newPresetSvgs';
import { ALL_STEPS, QUICK_STEPS } from './steps';

const ALL_PRESET_SVGS = [...PRESET_SVGS, ...NEW_PRESET_SVGS];

const BUBBLE_W = 310;
const BUBBLE_H = 200; // approximate for position calc
const GAP = 16;
const ARR = 14;

function calcBubblePos(rect, side) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!rect) {
    return { x: vw / 2 - BUBBLE_W / 2, y: vh / 2 - BUBBLE_H / 2, arrowDir: null };
  }

  let x, y, arrowDir;

  switch (side) {
    case 'bottom':
      x = rect.left + rect.width / 2 - BUBBLE_W / 2;
      y = rect.bottom + GAP + ARR;
      arrowDir = 'top';
      break;
    case 'top':
      x = rect.left + rect.width / 2 - BUBBLE_W / 2;
      y = rect.top - BUBBLE_H - GAP - ARR;
      arrowDir = 'bottom';
      break;
    case 'left':
      x = rect.left - BUBBLE_W - GAP - ARR;
      y = rect.top + rect.height / 2 - BUBBLE_H / 2;
      arrowDir = 'right';
      break;
    case 'right':
      x = rect.right + GAP + ARR;
      y = rect.top + rect.height / 2 - BUBBLE_H / 2;
      arrowDir = 'left';
      break;
    default:
      x = vw / 2 - BUBBLE_W / 2;
      y = vh - BUBBLE_H - GAP * 4;
      arrowDir = null;
  }

  // Clamp to viewport
  x = Math.max(GAP, Math.min(x, vw - BUBBLE_W - GAP));
  y = Math.max(GAP, Math.min(y, vh - BUBBLE_H - GAP));

  return { x, y, arrowDir };
}

export default function OnboardingTour({ page, setPage }) {
  const { profile, updateProfile } = useAuth();
  const [active,     setActive]    = useState(false);
  const [steps,      setSteps]     = useState([]);   // empty = not chosen yet
  const [stepIdx,    setStepIdx]   = useState(0);
  const [targetRect, setRect]      = useState(null);
  const measureRef = useRef(null);

  // Activate for new users (avatar chosen but tour not done)
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

  // Measure target element after page renders
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
    setStepIdx(1); // skip welcome, go to first real step
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
    const welcomeStep = ALL_STEPS[0];
    return (
      <>
        <div className="tour-overlay" />
        <div className="tour-welcome-box">
          <img src={avatarSrc} className="tour-welcome-avatar" alt="סוכן" />
          <div className="tour-welcome-title">{welcomeStep.title} 🎉</div>
          <p className="tour-welcome-body">{welcomeStep.body}</p>
          <div className="tour-welcome-choices">
            <button className="tour-choice-btn tour-choice-quick" onClick={() => chooseTour('quick')}>
              <Zap size={16} />
              <div className="tour-choice-inner">
                <span className="tour-choice-label">סיור מהיר</span>
                <span className="tour-choice-sub">5 שלבים · ~2 דקות</span>
              </div>
            </button>
            <button className="tour-choice-btn tour-choice-full" onClick={() => chooseTour('full')}>
              <List size={16} />
              <div className="tour-choice-inner">
                <span className="tour-choice-label">סיור מלא</span>
                <span className="tour-choice-sub">11 שלבים · ~5 דקות</span>
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
  const pos        = calcBubblePos(targetRect, currentStep?.side);
  const totalSteps = steps.length - 1;         // exclude welcome
  const realStep   = stepIdx;                  // 1-based
  const isFirst    = stepIdx === 1;
  const isLast     = stepIdx === steps.length - 1;

  // Arrow position inside bubble
  let arrowStyle = null;
  if (pos.arrowDir && targetRect) {
    const midTarget = targetRect.left + targetRect.width / 2;
    const midTargetY = targetRect.top + targetRect.height / 2;
    switch (pos.arrowDir) {
      case 'top':
        arrowStyle = {
          top: -ARR,
          left: Math.min(Math.max(midTarget - pos.x - ARR, 16), BUBBLE_W - 40),
          borderBottom: `${ARR}px solid #fff`,
          borderLeft:   `${ARR}px solid transparent`,
          borderRight:  `${ARR}px solid transparent`,
        };
        break;
      case 'bottom':
        arrowStyle = {
          bottom: -ARR,
          left: Math.min(Math.max(midTarget - pos.x - ARR, 16), BUBBLE_W - 40),
          borderTop:   `${ARR}px solid #fff`,
          borderLeft:  `${ARR}px solid transparent`,
          borderRight: `${ARR}px solid transparent`,
        };
        break;
      case 'right':
        arrowStyle = {
          right: -ARR,
          top: Math.min(Math.max(midTargetY - pos.y - ARR, 16), BUBBLE_H - 40),
          borderLeft:   `${ARR}px solid #fff`,
          borderTop:    `${ARR}px solid transparent`,
          borderBottom: `${ARR}px solid transparent`,
        };
        break;
      case 'left':
        arrowStyle = {
          left: -ARR,
          top: Math.min(Math.max(midTargetY - pos.y - ARR, 16), BUBBLE_H - 40),
          borderRight:  `${ARR}px solid #fff`,
          borderTop:    `${ARR}px solid transparent`,
          borderBottom: `${ARR}px solid transparent`,
        };
        break;
      default:
        break;
    }
  }

  return (
    <>
      {/* Dark overlay — clicks blocked, no dismiss on bg click */}
      <div className="tour-overlay" />

      {/* Highlight ring around target */}
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

      {/* Speech bubble */}
      <div
        className="tour-bubble tour-bubble-enter"
        key={currentStep.id}
        style={{ left: pos.x, top: pos.y, width: BUBBLE_W }}
      >
        {/* Arrow pointing toward target */}
        {arrowStyle && <div className="tour-arrow" style={arrowStyle} />}

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
