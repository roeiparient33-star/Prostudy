import { useState } from 'react';
import { BookOpen, ListChecks, Clock, Gift, Check, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';
import { burstConfetti } from '../lib/confetti';

const BONUS = 100;

// First-session activation path: 3 steps to the "aha" moment, then a credit gift.
// Visibility: until the bonus is claimed (profiles.activation_bonus_at, localStorage fallback).
export default function ActivationChecklist({ onNavigate }) {
  const { profile, refreshProfile } = useAuth();
  const { courses, tasks } = useData();
  const [claiming, setClaiming] = useState(false);
  const [claimedLocal, setClaimedLocal] = useState(() => !!localStorage.getItem('ps_activation_claimed'));

  if (!profile || profile.activation_bonus_at || claimedLocal) return null;

  const steps = [
    {
      id: 'course', icon: BookOpen,
      label: 'הוסף את הקורסים שלך',
      hint: 'אפילו אחד מספיק כדי להתחיל',
      done: courses.length >= 1,
      page: 'courses',
    },
    {
      id: 'tasks', icon: ListChecks,
      label: `הוסף 3 משימות ראשונות (${Math.min(tasks.length, 3)}/3)`,
      hint: 'מטלות, תרגילים, מה שיושב לך בראש',
      done: tasks.length >= 3,
      page: 'tasks',
    },
    {
      id: 'timer', icon: Clock,
      label: 'סיים סשן לימוד ראשון',
      hint: 'אפילו 10 דקות — השעון בצד המסך ⏱️',
      done: (profile.weekly_studied_minutes ?? 0) > 0 || (profile.streak_current ?? 0) > 0,
      page: null,
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const allDone   = doneCount === steps.length;

  async function claim(e) {
    if (claiming) return;
    setClaiming(true);
    burstConfetti(e, 24);
    // Steps + one-time claim are validated server-side (claim_activation_bonus RPC)
    const { error } = await supabase.rpc('claim_activation_bonus');
    if (error) {
      setClaiming(false);
      showToast({ type: 'info', text: 'עוד לא — השלם את שלושת הצעדים ונסה שוב' });
      return;
    }
    await refreshProfile();
    localStorage.setItem('ps_activation_claimed', '1');
    showToast({ type: 'credits', amount: BONUS });
    setClaimedLocal(true);
  }

  return (
    <div className="actv-card">
      <div className="actv-head">
        <div className="actv-gift"><Gift size={20}/></div>
        <div className="actv-head-text">
          <div className="actv-title">המסלול שלך 🚀</div>
          <div className="actv-sub">השלם 3 צעדים — וקבל מתנת פתיחה של {BONUS} קרדיטים לחנות</div>
        </div>
        <div className="actv-count">{doneCount}/{steps.length}</div>
      </div>

      <div className="actv-track">
        {steps.map(s => <div key={s.id} className={`actv-seg${s.done ? ' done' : ''}`}/>)}
      </div>

      <div className="actv-steps">
        {steps.map(({ id, icon: Icon, label, hint, done, page }) => (
          <button
            key={id}
            className={`actv-step${done ? ' done' : ''}`}
            onClick={() => !done && page && onNavigate(page)}
            disabled={done || !page}
          >
            <span className="actv-step-check">{done ? <Check size={13}/> : <Icon size={14}/>}</span>
            <span className="actv-step-text">
              <span className="actv-step-label">{label}</span>
              <span className="actv-step-hint">{hint}</span>
            </span>
            {!done && page && <ChevronLeft size={15} className="actv-step-go"/>}
          </button>
        ))}
      </div>

      <button
        className={`actv-claim${allDone ? ' ready' : ''}`}
        onClick={claim}
        disabled={!allDone || claiming}
      >
        {allDone
          ? <>🎁 קח את {BONUS} הקרדיטים שלך!</>
          : `עוד ${steps.length - doneCount} צעדים למתנה 🎁`}
      </button>
    </div>
  );
}
