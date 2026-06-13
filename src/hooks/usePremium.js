// usePremium — מצב המנוי + השימוש היומי של המשתמש הנוכחי.
// משמש את ה-PremiumGate, ה-UsageMeter והניווט בסיידבר.
import { useState, useEffect, useCallback } from 'react';
import { getSubscription, isSubscriptionActive, getTodayUsage, DAILY_LIMITS } from '../lib/premiumApi';

export function usePremium() {
  const [sub, setSub]         = useState(null);
  const [used, setUsed]       = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [s, u] = await Promise.all([getSubscription(), getTodayUsage()]);
    setSub(s);
    setUsed(u);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const active = isSubscriptionActive(sub);
  const plan   = sub?.plan || 'premium';
  const limit  = DAILY_LIMITS[plan] ?? DAILY_LIMITS.premium;

  return {
    loading,
    isPremium: active,
    plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    // קריאה ידנית לעדכון המונה אחרי פעולה (במקום fetch מלא)
    bumpUsed: (remaining) => setUsed(u => remaining != null ? limit - remaining : u + 1),
    refresh,
  };
}
