import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { setActiveUser } from '../data/localStore';

function getWeekKey() {
  const d = new Date();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay());
  return sunday.toISOString().split('T')[0];
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [isRecovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        // Show reset-password screen instead of normal app
        setUser(session?.user ?? null);
        setRecovery(true);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else { setActiveUser(''); setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId, sessionUser) {
    setActiveUser(userId);
    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Self-heal: OAuth signups (Google) may not have a profiles row yet
    if (!data) {
      const meta = sessionUser?.user_metadata ?? {};
      const name = meta.name || meta.full_name || sessionUser?.email?.split('@')[0] || '';
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: userId, name })
        .select()
        .single();
      data = created;
      // a DB trigger may have raced us — re-read once
      if (!data) {
        ({ data } = await supabase.from('profiles').select('*').eq('id', userId).single());
      }
    }

    if (!data) { setLoading(false); return; }

    // Weekly reset — computed and applied server-side (RPC), client only mirrors
    if (typeof data.weekly_reset_date === 'string' && data.weekly_reset_date !== getWeekKey()) {
      const { data: res } = await supabase.rpc('reset_weekly_minutes');
      if (res?.reset) data = { ...data, weekly_studied_minutes: 0, weekly_reset_date: res.week_key };
    }

    // Generate invite code if missing — server-side (unique, collision-safe)
    if (!data.invite_code) {
      const { data: code } = await supabase.rpc('ensure_invite_code');
      if (code) data = { ...data, invite_code: code };
    }

    // Apply referral reward — atomic server-side RPC (rewards both sides, once)
    if (!data.referred_by) {
      const refCode = localStorage.getItem('ps_ref');
      if (refCode) {
        const { data: res } = await supabase.rpc('apply_referral', { p_code: refCode });
        if (res?.applied) data = { ...data, credits: res.credits, referred_by: res.referred_by };
        localStorage.removeItem('ps_ref');
      }
    }

    setProfile(data);
    setLoading(false);
  }

  async function signUp(email, password, name) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function resendConfirmation(email) {
    return supabase.auth.resend({ type: 'signup', email });
  }

  async function sendPasswordReset(email) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
  }

  async function updatePassword(newPassword) {
    return supabase.auth.updateUser({ password: newPassword });
  }

  async function signOut() {
    setActiveUser('');
    localStorage.removeItem('ps_timer_v2');
    await supabase.auth.signOut();
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (!error) setProfile(data);
    return { data, error };
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isRecovery,
      clearRecovery: () => setRecovery(false),
      signUp,
      signIn,
      signInWithGoogle,
      resendConfirmation,
      signOut,
      sendPasswordReset,
      updatePassword,
      updateProfile,
      refreshProfile: () => fetchProfile(user?.id, user),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
