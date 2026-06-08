import { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import { useTimer, formatTime } from '../contexts/TimerContext';
import { useData } from '../contexts/DataContext';

export default function MobileTimerBar() {
  const { isRunning, currentSeconds, start, stop } = useTimer();
  const { courses } = useData();

  const [studyCourseId, setStudyCourseId] = useState('');
  const [timerMode,     setTimerMode]     = useState(false); // false=free, true=pom
  const [workMins,      setWorkMins]      = useState(25);
  const [breakMins,     setBreakMins]     = useState(5);
  const [pomPhase,      setPomPhase]      = useState('idle'); // 'idle'|'work'|'break'
  const [secsLeft,      setSecsLeft]      = useState(0);

  const pomInterval = useRef(null);
  const stopRef     = useRef(stop);
  useEffect(() => { stopRef.current = stop; }, [stop]);
  useEffect(() => () => clearInterval(pomInterval.current), []);

  const studyCourse = courses.find(c => String(c.id) === String(studyCourseId));

  function clearPom() {
    clearInterval(pomInterval.current);
    pomInterval.current = null;
  }

  function startBreakCountdown(secs) {
    setPomPhase('break');
    setSecsLeft(secs);
    clearPom();
    pomInterval.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { clearInterval(pomInterval.current); setPomPhase('idle'); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  function startWorkCountdown() {
    const workSecs  = workMins  * 60;
    const breakSecs = breakMins * 60;
    setPomPhase('work');
    setSecsLeft(workSecs);
    start(studyCourse?.name || '');
    clearPom();
    pomInterval.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          clearInterval(pomInterval.current);
          stopRef.current?.();
          startBreakCountdown(breakSecs);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function stopPomodoro() {
    clearPom();
    setPomPhase('idle');
    setSecsLeft(0);
    stop();
  }

  function skipBreak() {
    clearPom();
    setPomPhase('idle');
    setSecsLeft(0);
  }

  function toggleMode() {
    if (isRunning || pomPhase !== 'idle') return;
    setTimerMode(p => !p);
  }

  // ── Pomodoro: work phase ──────────────────────────────────────────────────
  if (timerMode && pomPhase === 'work') {
    return (
      <div className="mobile-timer-bar running">
        <span className="mobile-pom-phase work">סשן לימוד</span>
        <span className="mobile-timer-time">{formatTime(secsLeft)}</span>
        <button className="mobile-timer-btn stop" onClick={stopPomodoro}>
          <Square size={11} fill="currentColor"/> עצור
        </button>
      </div>
    );
  }

  // ── Pomodoro: break phase ─────────────────────────────────────────────────
  if (timerMode && pomPhase === 'break') {
    return (
      <div className="mobile-timer-bar running">
        <span className="mobile-pom-phase break">הפסקה</span>
        <span className="mobile-timer-time">{formatTime(secsLeft)}</span>
        <button className="mobile-timer-btn start" onClick={startWorkCountdown}>
          <Play size={11} fill="currentColor"/> סשן חדש
        </button>
        <button className="mobile-pom-skip" onClick={skipBreak}>דלג</button>
      </div>
    );
  }

  // ── Pomodoro: idle — show preset pickers ─────────────────────────────────
  if (timerMode && pomPhase === 'idle') {
    return (
      <div className="mobile-timer-bar pom-idle">
        {/* Row 1: phase presets + toggle + start */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
          <button
            className="mobile-pom-toggle active"
            onClick={toggleMode}
            aria-label="יציאה ממצב פומדורו"
            title="פומדורו פעיל"
          >🍅</button>

          <div className="mobile-pom-presets">
            <span className="mobile-pom-label">לימוד</span>
            {[15, 25, 45].map(m => (
              <button
                key={m}
                className={`mobile-pom-preset${workMins === m ? ' active' : ''}`}
                onClick={() => setWorkMins(m)}
              >{m}′</button>
            ))}
          </div>

          <span className="mobile-pom-sep">|</span>

          <div className="mobile-pom-presets">
            <span className="mobile-pom-label">הפסקה</span>
            {[5, 10, 15].map(m => (
              <button
                key={m}
                className={`mobile-pom-preset${breakMins === m ? ' active' : ''}`}
                onClick={() => setBreakMins(m)}
              >{m}′</button>
            ))}
          </div>
        </div>

        <button className="mobile-timer-btn start" onClick={startWorkCountdown}>
          <Play size={11} fill="currentColor"/> התחל
        </button>
      </div>
    );
  }

  // ── Free mode ─────────────────────────────────────────────────────────────
  return (
    <div className={`mobile-timer-bar${isRunning ? ' running' : ''}`}>
      {!isRunning && courses.length > 0 && (
        <select
          className="mobile-timer-course"
          value={studyCourseId}
          onChange={e => setStudyCourseId(e.target.value)}
        >
          <option value="">קורס...</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
          ))}
        </select>
      )}

      {isRunning && studyCourse && (
        <span className="mobile-timer-course-pill">
          {studyCourse.emoji} {studyCourse.name}
        </span>
      )}

      <span className="mobile-timer-time">{formatTime(currentSeconds)}</span>

      {/* Pomodoro toggle — only when idle */}
      {!isRunning && (
        <button
          className="mobile-pom-toggle"
          onClick={toggleMode}
          aria-label="עבור למצב פומדורו"
          title="פומדורו"
        >🍅</button>
      )}

      <button
        className={`mobile-timer-btn${isRunning ? ' stop' : ' start'}`}
        onClick={isRunning ? stop : () => start(studyCourse?.name || '')}
      >
        {isRunning
          ? <><Square size={11} fill="currentColor"/> עצור</>
          : <><Play  size={11} fill="currentColor"/> התחל</>
        }
      </button>
    </div>
  );
}
