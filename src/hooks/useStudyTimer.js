import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const LS_KEY = 'ps_timer_v2';
const MAX_SESSION_SECS = 8 * 3600; // 8 שעות מקסימום לסשן אחד

function today() { return new Date().toISOString().split('T')[0]; }
function startDay(ts) { return new Date(ts).toISOString().split('T')[0]; }

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY)) || {};
    if (saved.date && saved.date !== today()) return {}; // יום חדש — איפוס
    return saved;
  } catch { return {}; }
}

export function useStudyTimer(userId, onStopped) {
  const saved = loadState();

  const [isRunning,  setIsRunning]  = useState(saved.isRunning  ?? false);
  const [startedAt,  setStartedAt]  = useState(saved.startedAt  ?? null);
  const [accSeconds, setAccSeconds] = useState(saved.accSeconds ?? 0);
  const [, setTick] = useState(0);
  const savingRef = useRef(false);
  const stopRef   = useRef(null);

  // Tick every second when running
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Auto-stop: check every minute for midnight crossing or 8h cap
  useEffect(() => {
    if (!isRunning || !startedAt) return;
    const id = setInterval(() => {
      const sessionSecs = Math.floor((Date.now() - startedAt) / 1000);
      const dayChanged  = today() !== startDay(startedAt);
      if (dayChanged || sessionSecs >= MAX_SESSION_SECS) {
        stopRef.current?.();
      }
    }, 60000);
    return () => clearInterval(id);
  }, [isRunning, startedAt]);

  // Persist to localStorage on every state change
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ isRunning, startedAt, accSeconds, date: today() }));
  }, [isRunning, startedAt, accSeconds]);

  // Save to Supabase when tab/window closes (if running)
  useEffect(() => {
    function handleUnload() {
      if (!isRunning || !startedAt) return;
      const sessionSecs = Math.floor((Date.now() - startedAt) / 1000);
      const total = accSeconds + sessionSecs;
      localStorage.setItem(LS_KEY, JSON.stringify({ isRunning: true, startedAt, accSeconds: total }));
    }
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isRunning, startedAt, accSeconds]);

  const currentSeconds = Math.floor(
    accSeconds + (isRunning && startedAt ? (Date.now() - startedAt) / 1000 : 0)
  );

  // courseName is optional — passed through to Supabase for friend visibility
  const start = useCallback((courseName = '') => {
    setStartedAt(Date.now());
    setIsRunning(true);
    if (userId) {
      supabase.from('profiles').update({
        session_active: true,
        session_course_name: courseName,
        session_started_at: new Date().toISOString(),
      }).eq('id', userId).then(() => {});
    }
  }, [userId]);

  const stop = useCallback(async () => {
    if (!isRunning || !startedAt || savingRef.current) return;
    savingRef.current = true;

    const sessionSecs   = Math.floor((Date.now() - startedAt) / 1000);
    const newAccSeconds = accSeconds + sessionSecs;

    setIsRunning(false);
    setStartedAt(null);
    setAccSeconds(newAccSeconds);

    const sessionClear = {
      session_active: false,
      session_course_name: '',
      session_started_at: '',
    };

    if (userId) {
      if (sessionSecs >= 5) {
        const creditsEarned = Math.ceil(sessionSecs / 60);
        const minsStudied   = Math.ceil(sessionSecs / 60);

        const { data: prof } = await supabase
          .from('profiles')
          .select('credits, weekly_studied_minutes, total_studied_minutes, streak_current, streak_best, streak_last_date')
          .eq('id', userId)
          .single();

        if (prof) {
          const todayStr     = new Date().toISOString().split('T')[0];
          const lastDate     = prof.streak_last_date || null;
          let newStreak      = prof.streak_current || 0;
          let newBest        = prof.streak_best    || 0;

          if (lastDate !== todayStr) {
            const yesterday    = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            newStreak = (lastDate === yesterdayStr) ? newStreak + 1 : 1;
            newBest   = Math.max(newBest, newStreak);
          }

          await supabase.from('profiles').update({
            ...sessionClear,
            credits:                (prof.credits               || 0) + creditsEarned,
            weekly_studied_minutes: (prof.weekly_studied_minutes || 0) + minsStudied,
            total_studied_minutes:  (prof.total_studied_minutes  || 0) + minsStudied,
            streak_current:         newStreak,
            streak_best:            newBest,
            streak_last_date:       todayStr,
          }).eq('id', userId);
          onStopped?.();
        } else {
          await supabase.from('profiles').update(sessionClear).eq('id', userId);
        }
      } else {
        // Session too short for credits — still clear live status
        await supabase.from('profiles').update(sessionClear).eq('id', userId);
      }
    }

    savingRef.current = false;
  }, [isRunning, startedAt, accSeconds, userId, onStopped]);

  // Keep stopRef in sync so the auto-stop interval always calls the latest version
  useEffect(() => { stopRef.current = stop; }, [stop]);

  const resetDay = useCallback(() => {
    setIsRunning(false);
    setStartedAt(null);
    setAccSeconds(0);
    localStorage.removeItem(LS_KEY);
  }, []);

  return { isRunning, currentSeconds, start, stop, resetDay };
}

export function formatTime(totalSeconds) {
  const s  = Math.max(0, totalSeconds);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
