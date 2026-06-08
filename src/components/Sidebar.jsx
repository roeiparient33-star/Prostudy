import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, BookOpen, CheckSquare, Users, GraduationCap, LogOut, Smile, CalendarDays, Play, Square, Settings2, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTimer, formatTime } from '../contexts/TimerContext';

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

  // ── Custom session timer ──────────────────────────────────────────────────
  const [timerMode,        setTimerMode]        = useState(false);   // false = regular stopwatch
  const [workMins,         setWorkMins]         = useState(25);
  const [breakMins,        setBreakMins]        = useState(5);
  const [showSettings,     setShowSettings]     = useState(false);
  const [timerPhase,       setTimerPhase]       = useState('work');  // 'work' | 'break'
  const [breakLeft,        setBreakLeft]        = useState(0);
  const [showBreakMsg,     setShowBreakMsg]     = useState(false);
  const workStartedAt = useRef(null);
  const breakInterval = useRef(null);

  // ── Course selector ───────────────────────────────────────────────────────
  const [studyCourseId, setStudyCourseId] = useState('');

  const WORK_SECS  = workMins  * 60;
  const BREAK_SECS = breakMins * 60;

  // Seconds elapsed since this work session started (not cumulative)
  const workElapsed = timerMode && isRunning && workStartedAt.current
    ? Math.floor((Date.now() - workStartedAt.current) / 1000)
    : 0;

  // Auto-stop when work session hits user-defined duration
  useEffect(() => {
    if (!timerMode || !isRunning || timerPhase !== 'work') return;
    if (workElapsed >= WORK_SECS) {
      workStartedAt.current = null;
      stop();
      setTimerPhase('break');
      setShowBreakMsg(true);
      setBreakLeft(BREAK_SECS);
      const t0 = Date.now();
      clearInterval(breakInterval.current);
      breakInterval.current = setInterval(() => {
        const left = BREAK_SECS - Math.floor((Date.now() - t0) / 1000);
        if (left <= 0) {
          clearInterval(breakInterval.current);
          setTimerPhase('work');
          setShowBreakMsg(false);
          setBreakLeft(0);
        } else {
          setBreakLeft(left);
        }
      }, 1000);
    }
  }, [currentSeconds, timerMode, isRunning, timerPhase, workElapsed, WORK_SECS, BREAK_SECS, stop]);

  useEffect(() => () => clearInterval(breakInterval.current), []);

  // ── Display logic ─────────────────────────────────────────────────────────
  const displayTime = timerMode
    ? timerPhase === 'work'
      ? formatTime(Math.max(0, WORK_SECS - workElapsed))
      : formatTime(Math.max(0, breakLeft))
    : formatTime(currentSeconds);

  const timerLabel = timerMode
    ? timerPhase === 'work'
      ? `⏱ לימוד — ${workMins}/${breakMins} דק׳`
      : '☕ הפסקה'
    : 'שעון לימוד';

  const studyCourse = courses.find(c => String(c.id) === String(studyCourseId));

  const initials = profile?.name
    ? profile.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('')
    : '?';

  function handleStart() {
    setTimerPhase('work');
    setShowBreakMsg(false);
    setShowSettings(false);
    clearInterval(breakInterval.current);
    workStartedAt.current = Date.now();
    start(studyCourse?.name || '');
  }

  function handleStop() {
    workStartedAt.current = null;
    stop();
  }

  function toggleTimerMode() {
    if (isRunning) return;
    setTimerMode(p => !p);
    setTimerPhase('work');
    setShowBreakMsg(false);
    setShowSettings(false);
    clearInterval(breakInterval.current);
  }

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
      <div className="sidebar-timer">

        {/* Label row + mode toggle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div className="sidebar-timer-label">{timerLabel}</div>
          <div style={{ display:'flex', gap:4 }}>
            {/* Settings gear — only when stopped */}
            {!isRunning && timerMode && (
              <button
                className={`pomodoro-toggle${showSettings ? ' active' : ''}`}
                onClick={() => setShowSettings(p => !p)}
                title="הגדר זמנים"
              >
                <Settings2 size={12}/>
              </button>
            )}
            {/* Mode toggle */}
            <button
              className={`pomodoro-toggle${timerMode ? ' active' : ''}`}
              onClick={toggleTimerMode}
              title={timerMode ? 'עבור לשעון רגיל' : 'הפעל שעון עם הפסקות'}
              disabled={isRunning}
            >
              ⏱
            </button>
          </div>
        </div>

        {/* Inline settings panel */}
        {showSettings && !isRunning && timerMode && (
          <div className="timer-settings-panel">
            <div className="timer-settings-row">
              <label>לימוד (דק׳)</label>
              <input
                type="number" min={1} max={120}
                value={workMins}
                onChange={e => setWorkMins(Math.max(1, Number(e.target.value)))}
                className="timer-settings-input"
              />
            </div>
            <div className="timer-settings-row">
              <label>הפסקה (דק׳)</label>
              <input
                type="number" min={1} max={60}
                value={breakMins}
                onChange={e => setBreakMins(Math.max(1, Number(e.target.value)))}
                className="timer-settings-input"
              />
            </div>
          </div>
        )}

        {/* Break message */}
        {showBreakMsg && (
          <div className="pomodoro-break-msg">
            🎉 זמן הפסקה! {formatTime(breakLeft)}
          </div>
        )}

        {/* Course selector — when stopped */}
        {!isRunning && !showBreakMsg && courses.length > 0 && (
          <select
            className="timer-course-select"
            value={studyCourseId}
            onChange={e => setStudyCourseId(e.target.value)}
          >
            <option value="">בחר קורס...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        )}

        {/* Active course label — when running */}
        {isRunning && studyCourse && (
          <div className="timer-course-active">
            {studyCourse.emoji} {studyCourse.name}
          </div>
        )}

        {/* Timer display */}
        <div className={`sidebar-timer-display${isRunning ? ' running' : ''}${timerMode && timerPhase === 'work' && isRunning ? ' pomodoro' : ''}`}>
          {displayTime}
        </div>

        {/* Start / Stop */}
        {!showBreakMsg && (
          <button
            className={`sidebar-timer-btn${isRunning ? ' stop' : ' start'}`}
            onClick={isRunning ? handleStop : handleStart}
          >
            {isRunning
              ? <><Square size={11} fill="currentColor"/> עצור</>
              : <><Play  size={11} fill="currentColor"/> התחל</>
            }
          </button>
        )}
      </div>

      <div className="sidebar-divider"/>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{initials}</div>
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
