import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { ACHIEVEMENTS } from '../data/achievements';
import { showToast } from '../lib/toast';

// Watches profile + tasks globally and fires a toast the moment an achievement
// unlocks — no need to visit the achievements page.
// Social achievements (friends/invites/pacts) are persisted by the
// Achievements page itself; here we only watch profile/task-based ones.
export default function AchievementWatcher() {
  const { profile, updateProfile } = useAuth();
  const { tasks } = useData();
  const handledRef = useRef(new Set());

  const completedTasks = tasks.filter(t => t.completed).length;

  useEffect(() => {
    if (!profile) return;

    const existing = profile.achievements_unlocked || {};
    const ctx = { p: profile, ct: completedTasks, fc: 0, ic: 0, hasPact: false };

    const fresh = ACHIEVEMENTS.filter(a =>
      !existing[a.id] && !handledRef.current.has(a.id) && a.check(ctx)
    );
    if (fresh.length === 0) return;

    fresh.forEach(a => handledRef.current.add(a.id));

    // Toast up to 2; collapse the rest into a summary
    fresh.slice(0, 2).forEach((a, i) => {
      setTimeout(() => showToast({ type: 'achievement', icon: a.icon, title: a.title, rarity: a.rarity }), i * 700);
    });
    if (fresh.length > 2) {
      setTimeout(() => showToast({ type: 'info', text: `🏆 ועוד ${fresh.length - 2} הישגים חדשים בארון הגביעים!` }), 1400);
    }

    const nowTs = new Date().toISOString();
    const updates = Object.fromEntries(fresh.map(a => [a.id, nowTs]));
    updateProfile({ achievements_unlocked: { ...existing, ...updates } });
  }, [profile, completedTasks]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
