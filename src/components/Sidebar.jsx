import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, BookOpen, CheckSquare, Users, GraduationCap, LogOut, Smile, CalendarDays, Play, Square, Settings2, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTimer, formatTime } from '../contexts/TimerContext';
import UserAvatar from './UserAvatar';

// Circular countdown ring for pomodoro phases
function TimerRing({ secsLeft, totalSecs, isBreak }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  const frac = totalSecs > 0 ? Math.max(0, Math.min(1, secsLeft / totalSecs)) : 0;
  return (
    <div className="timer-ring-wrap">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={R} className="timer-ring-track"/>
        <circle
          cx="52" cy="52" r={R}
          className={`timer-ring-fill${isBreak ? ' break' : ''}`}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 52 52)"
        />
      </svg>
      <div className="timer-ring-time">{formatTime(secsLeft)}</div>
    </div>
  );
}

const navItems = [
  { id: 'dashboard',    label: 'דשבורד',       icon: LayoutDashboard },
  { id: 'courses',      label: 'קורסים',       icon: BookOpen },
  { id: 'tasks',        label: 'משימות',       icon: CheckSquare },
  { id: 'schedule',     label: 'מערכת שעות',   icon: CalendarDays },
  { id: 'friends',      label: 'חברים',        icon: Users },
  { id: 'avatar',       label: 'סוכן לימודים', icon: Smile },
  { id: 'achievements', label: 'הישגים',       icon: Trophy },
];

export default function Sidebar({ currentPage, onNavigate }) {
  const { profile, signOut } = useAuth();
  const { courses } = useData();
  const { isRunning, currentSeconds, start, stop } = useTimer();

  // ── Modes & settings ─────────────────────────────────────────────────────
  const [timerMode,    setTimerMode]    = useState(false);
  const [workMins,     setWorkMins]     = useState(25);
  const [breakMins,    setBreakMins]    = useState(5);
  const [studyCourseId, setStudyCourseId] = useState('');

  // ── Pomodoro state — fully self-contained countdown ──────────────────────
  // pomPhase: 'idle' | 'work' | 'break'
  const [pomPhase,  setPomPhase]  = useState('idle');
  const [secsLeft,  setSecsLeft]  = useState(0);
  const pomInterval = useRef(null);
  const stopRef     = useRef(stop);
  useEffect(() => { stopRef.current = stop; }, [stop]);

  // Cleanup interval on unmount
  useEffect(() => () => clearInterval(pomInterval.current), []);

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
        if (s <= 1) {
          clearInterval(pomInterval.current);
          setPomPhase('idle');
          return 0;
        }
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

  function toggleTimerMode() {
    if (isRunning || pomPhase !== 'idle') return;
    setTimerMode(p => !p);
  }

  // ── Display ───────────────────────────────────────────────────────────────
  const displayTime = (timerMode && pomPhase !== 'idle')
    ? formatTime(secsLeft)
    : formatTime(currentSeconds);

  const studyCourse = courses.find(c => String(c.id) === String(studyCourseId));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <GraduationCap size={20} color="white"/>
        </div>
        <span className="sidebar-logo-text">Pro<span>Study</span></span>
      </div>

      <div className="sidebar-section-label">ניווט</div>
      <nav className="sidebar-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item${currentPage === id ? ' active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={17} className="nav-icon"/>
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-divider"/>

      {/* Study Timer */}
      <div className="sidebar-timer" data-tour="study-timer">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="sidebar-timer-label">
          שעון לימוד
          {(isRunning || pomPhase !== 'idle') && <span className="timer-live-dot" aria-hidden="true"/>}
        </div>

        {/* ── Mode switcher — only when fully idle ─────────────── */}
        {!isRunning && pomPhase === 'idle' && (
          <div className="timer-mode-row">
            <button
              className={`timer-mode-pill${!timerMode ? ' active' : ''}`}
              onClick={() => timerMode && toggleTimerMode()}
            >
              חופשי
            </button>
            <button
              className={`timer-mode-pill${timerMode ? ' active' : ''}`}
              data-tour="pomodoro-toggle"
              onClick={() => !timerMode && toggleTimerMode()}
            >
              פומודורו
            </button>
          </div>
        )}

        {/* ── Pomodoro presets — idle + pomodoro mode ────────── */}
        {timerMode && !isRunning && pomPhase === 'idle' && (
          <div className="timer-presets-wrap">
            <div className="timer-preset-row">
              <span className="timer-preset-label">לימוד</span>
              {[15, 25, 45].map(m => (
                <button key={m} className={`timer-preset-btn${workMins === m ? ' active' : ''}`} onClick={() => setWorkMins(m)}>
                  {m}′
                </button>
              ))}
            </div>
            <div className="timer-preset-row">
              <span className="timer-preset-label">הפסקה</span>
              {[5, 10, 15].map(m => (
                <button key={m} className={`timer-preset-btn${breakMins === m ? ' active' : ''}`} onClick={() => setBreakMins(m)}>
                  {m}′
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Phase badge — during Pomodoro ──────────────────── */}
        {timerMode && pomPhase !== 'idle' && (
          <div className={`timer-phase-badge${pomPhase === 'break' ? ' break' : ''}`}>
            {pomPhase === 'work' ? 'סשן לימוד' : 'הפסקה'}
          </div>
        )}

        {/* ── Break screen ───────────────────────────────────── */}
        {pomPhase === 'break' && (
          <>
            <TimerRing secsLeft={secsLeft} totalSecs={breakMins * 60} isBreak/>
            <button className="sidebar-timer-btn start" onClick={startWorkCountdown}>
              <Play size={11} fill="currentColor"/> התחל סשן חדש
            </button>
            <button className="pomodoro-skip-btn" onClick={skipBreak}>
              דלג על הפסקה
            </button>
          </>
        )}

        {/* ── Normal / Pomodoro-work flow ─────────────────────── */}
        {pomPhase !== 'break' && (
          <>
            {/* Course selector — when idle */}
            {!isRunning && pomPhase === 'idle' && courses.length > 0 && (
              <select className="timer-course-select" value={studyCourseId} onChange={e => setStudyCourseId(e.target.value)}>
                <option value="">בחר קורס...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            )}

            {/* Active course label — when running */}
            {(isRunning || pomPhase === 'work') && studyCourse && (
              <div className="timer-course-active">
                {studyCourse.emoji} {studyCourse.name}
              </div>
            )}

            {/* Timer display — ring during pomodoro work, plain otherwise */}
            {timerMode && pomPhase === 'work' ? (
              <TimerRing secsLeft={secsLeft} totalSecs={workMins * 60}/>
            ) : (
              <div className={`sidebar-timer-display${isRunning ? ' running' : ''}`}>
                {displayTime}
              </div>
            )}

            {/* Start / Stop */}
            <button
              className={`sidebar-timer-btn${(isRunning || pomPhase === 'work') ? ' stop' : ' start'}`}
              onClick={() => {
                if (timerMode) {
                  pomPhase === 'work' ? stopPomodoro() : startWorkCountdown();
                } else {
                  isRunning ? stop() : start(studyCourse?.name || '');
                }
              }}
            >
              {(isRunning || pomPhase === 'work')
                ? <><Square size={11} fill="currentColor"/> עצור</>
                : <><Play  size={11} fill="currentColor"/> התחל</>
              }
            </button>

            {/* Pomodoro hint — while work session runs */}
            {timerMode && pomPhase === 'work' && (
              <div className="timer-pomodoro-hint">
                {workMins} דק׳ לימוד · {breakMins} דק׳ הפסקה
              </div>
            )}
          </>
        )}
      </div>

      <div className="sidebar-divider"/>

      <div className="sidebar-user">
        <UserAvatar profile={profile} size={36} className="sidebar-user-avatar-img"/>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{profile?.name ?? '...'}</div>
          <div className="sidebar-user-sub">{profile?.semester ?? ''}</div>
        </div>
        <button className="sidebar-logout-btn" onClick={signOut} title="התנתק">
          <LogOut size={15}/>
        </button>
      </div>
    </aside>
  );
}
