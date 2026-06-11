// Single source of truth for streak math — used by the timer (advance)
// and by the Topbar badge (display). Dates are YYYY-MM-DD strings.

export const FREEZE_COST = 150; // קרדיטים להקפאת רצף אחת
export const FREEZE_MAX  = 2;   // מקסימום הקפאות במלאי (כמו Duolingo)

const DAY_MS = 86400000;

function toUTC(dateStr) { return new Date(dateStr + 'T00:00:00Z').getTime(); }

export function daysBetween(a, b) { return Math.round((toUTC(b) - toUTC(a)) / DAY_MS); }

export function todayStr() { return new Date().toISOString().split('T')[0]; }

// What the badge should show right now.
// gap = full days missed since the last study day (0 = studied yesterday).
// A missed day is forgiven if there are enough freezes in stock to cover it.
export function getStreakStatus(profile) {
  const streak  = profile?.streak_current  || 0;
  const freezes = profile?.streak_freezes  || 0;
  const last    = profile?.streak_last_date || null;

  if (!last || !streak) return { streak: 0, doneToday: false, alive: false, freezes };

  const gap = daysBetween(last, todayStr()) - 1;
  if (gap < 0)         return { streak, doneToday: true,  alive: true,  freezes }; // למד היום
  if (gap === 0)       return { streak, doneToday: false, alive: true,  freezes }; // למד אתמול — בסכנה היום
  if (freezes >= gap)  return { streak, doneToday: false, alive: true,  freezes }; // מוגן ע"י הקפאות
  return { streak: 0, doneToday: false, alive: false, freezes };                   // נשבר
}

// Profile updates for finishing a session today. Returns null if already counted today.
// freezesUsed is informational (for a toast); the rest goes straight to the DB.
export function advanceStreak(prof, today) {
  const last = prof.streak_last_date || null;
  if (last === today) return null;

  let streak      = prof.streak_current  || 0;
  let freezes     = prof.streak_freezes  || 0;
  let freezesUsed = 0;

  const gap = last ? daysBetween(last, today) - 1 : Infinity;
  if (gap === 0) {
    streak += 1;
  } else if (Number.isFinite(gap) && gap > 0 && freezes >= gap) {
    freezesUsed = gap;
    freezes    -= gap;
    streak     += 1;
  } else {
    streak = 1;
  }

  return {
    streak_current:   streak,
    streak_best:      Math.max(prof.streak_best || 0, streak),
    streak_last_date: today,
    streak_freezes:   freezes,
    freezesUsed,
  };
}
