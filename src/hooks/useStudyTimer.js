import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../lib/toast';

// v3: הגרסה הקודמת שמרה לפעמים בלי תאריך / בתאריך UTC — מתחילים נקי (תצוגה בלבד, הקרדיטים בשרת)
export const LS_KEY = 'ps_timer_v3';
try { localStorage.removeItem('ps_timer_v2'); } catch { /* ignore */ }
const MAX_SESSION_SECS = 4 * 3600;          // 4 שעות מקסימום לסשן אחד (כמו בשרת)
const HEARTBEAT_MS     = 3 * 60 * 1000;     // פעימת חיים לשרת כל 3 דקות
const CHECKIN_AFTER_MS = 55 * 60 * 1000;    // "עדיין לומד?" אחרי ~שעה
const CHECKIN_GRACE_MS = 10 * 60 * 1000;    // בלי אישור תוך 10 דק' — עצירה אוטומטית

// תאריך מקומי (שעון המשתמש) — לא UTC, אחרת "יום חדש" מתחיל ב-02:00/03:00 בישראל
function localDay(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function today() { return localDay(Date.now()); }

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY)) || {};
    // יום אחר, או רשומה ישנה בלי תאריך — מתחילים מאפס.
    // אם נשאר סשן "רץ" מאז — מסמנים אותו לסגירה בשרת.
    if (saved.date !== today()) return { staleSession: !!saved.isRunning };
    // סשן שרץ יותר מהתקרה (טאב שנשכח פתוח) — לא ממשיכים אותו
    if (saved.isRunning && (!saved.startedAt || Date.now() - saved.startedAt >= MAX_SESSION_SECS * 1000)) {
      return { accSeconds: saved.accSeconds ?? 0, staleSession: true };
    }
    return saved;
  } catch { return {}; }
}

export function useStudyTimer(userId, onStopped) {
  const [saved] = useState(loadState);

  const [isRunning,  setIsRunning]  = useState(saved.isRunning  ?? false);
  const [startedAt,  setStartedAt]  = useState(saved.startedAt  ?? null);
  const [accSeconds, setAccSeconds] = useState(saved.accSeconds ?? 0);
  const dayRef        = useRef(today());  // היום שאליו שייך accSeconds
  const staleCloseRef = useRef(saved.staleSession ?? false);
  const [needsCheckin, setNeedsCheckin] = useState(false);
  const [, setTick] = useState(0);
  const savingRef       = useRef(false);
  const stopRef         = useRef(null);
  const lastConfirmRef  = useRef(Date.now()); // מתי המשתמש אישר לאחרונה שהוא לומד
  const checkinShownRef = useRef(null);       // מתי הוצג ה"עדיין לומד?"

  // Tick every second when running
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // סשן שנשאר "רץ" מביקור קודם (יום אחר / מעל התקרה) — סוגרים אותו בשרת.
  // השרת מזכה רק עד הפעימה האחרונה (+6 דק'), ומפסיק להציג "לומד עכשיו" לחברים.
  useEffect(() => {
    if (!userId || !staleCloseRef.current) return;
    staleCloseRef.current = false;
    supabase.rpc('finish_study_session').then(({ data: res }) => {
      if (res?.credits_earned > 0) {
        showToast({ type: 'credits', amount: res.credits_earned, streak: res.streak_counted ? res.streak_current : null });
        onStopped?.();
      }
    });
  }, [userId, onStopped]);

  // מעבר יום + תקרת סשן. רץ כל 30 שניות, וגם מיד כשחוזרים לטאב —
  // טיימרים מושהים כשהמחשב ישן / הטאב ברקע, אז לא מחכים לאינטרוול.
  useEffect(() => {
    async function checkDay() {
      const dayChanged = dayRef.current !== today();
      const overCap = isRunning && startedAt && Date.now() - startedAt >= MAX_SESSION_SECS * 1000;
      if (!dayChanged && !overCap) return;
      if (isRunning) await stopRef.current?.();
      if (dayChanged) {
        dayRef.current = today();
        setAccSeconds(0);
        setStartedAt(null);
      }
    }
    checkDay();
    const id = setInterval(checkDay, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') checkDay(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', checkDay);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', checkDay);
    };
  }, [isRunning, startedAt]);

  // Persist to localStorage on every state change (always with the day it belongs to)
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ isRunning, startedAt, accSeconds, date: dayRef.current }));
  }, [isRunning, startedAt, accSeconds]);

  // Heartbeat: מוכיח לשרת שהטאב חי. אם המחשב נרדם/הטאב נסגר —
  // הפעימות נפסקות והשרת מזכה רק עד הפעימה האחרונה (+6 דק' חסד).
  useEffect(() => {
    if (!isRunning || !userId) return;
    const id = setInterval(() => {
      supabase.rpc('heartbeat_study_session').then(() => {});
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [isRunning, userId]);

  // Check-in "עדיין לומד?": אחרי ~שעה בלי אישור מוצג פרומפט;
  // בלי תגובה תוך 10 דקות — הסשן נעצר אוטומטית (אנטי-"השארתי דולק").
  useEffect(() => {
    if (!isRunning) { setNeedsCheckin(false); checkinShownRef.current = null; return; }
    const id = setInterval(() => {
      const now = Date.now();
      if (!checkinShownRef.current && now - lastConfirmRef.current >= CHECKIN_AFTER_MS) {
        checkinShownRef.current = now;
        setNeedsCheckin(true);
      } else if (checkinShownRef.current && now - checkinShownRef.current >= CHECKIN_GRACE_MS) {
        checkinShownRef.current = null;
        setNeedsCheckin(false);
        stopRef.current?.();
        showToast({ type: 'info', text: '⏸️ השעון נעצר אוטומטית — לא אישרת שאתה עדיין לומד' });
      }
    }, 30000);
    return () => clearInterval(id);
  }, [isRunning]);

  const confirmCheckin = useCallback(() => {
    lastConfirmRef.current = Date.now();
    checkinShownRef.current = null;
    setNeedsCheckin(false);
    supabase.rpc('heartbeat_study_session').then(() => {});
  }, []);

  const currentSeconds = Math.floor(
    accSeconds + (isRunning && startedAt ? (Date.now() - startedAt) / 1000 : 0)
  );

  // courseName is optional — passed through to Supabase for friend visibility.
  // הזמן נקבע בשרת (start_study_session) — הלקוח שומר עותק רק לתצוגה.
  const start = useCallback((courseName = '') => {
    setStartedAt(Date.now());
    setIsRunning(true);
    lastConfirmRef.current = Date.now();
    if (userId) {
      supabase.rpc('start_study_session', { p_course_name: courseName }).then(() => {});
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
    setNeedsCheckin(false);
    checkinShownRef.current = null;

    if (userId) {
      // המשך, הקרדיטים והרצף מחושבים כולם בשרת (זמן שרת + heartbeat) —
      // הלקוח לא שולח משך ולא יכול לזייף אותו.
      const { data: res, error } = await supabase.rpc('finish_study_session');
      if (error) {
        showToast({ type: 'info', text: 'שמירת הסשן נכשלה — בדוק חיבור ונסה שוב' });
      } else if (res && res.credits_earned > 0) {
        showToast({
          type: 'credits',
          amount: res.credits_earned,
          streak: res.streak_counted ? res.streak_current : null,
        });
        if (res.freezes_used > 0) {
          showToast({ type: 'info', text: `❄️ הקפאת רצף הצילה את הרצף שלך! (${res.freezes_used} נוצלו)` });
        }
        onStopped?.();
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

  return { isRunning, currentSeconds, start, stop, resetDay, needsCheckin, confirmCheckin };
}

export function formatTime(totalSeconds) {
  const s  = Math.max(0, totalSeconds);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
