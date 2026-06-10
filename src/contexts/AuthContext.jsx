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

    // Weekly reset
    if (typeof data.weekly_reset_date === 'string' && data.weekly_reset_date !== getWeekKey()) {
      const reset = { weekly_studied_minutes: 0, weekly_reset_date: getWeekKey() };
      await supabase.from('profiles').update(reset).eq('id', userId);
      data = { ...data, ...reset };
    }

    // Generate invite code if missing
    if (!data.invite_code) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      await supabase.from('profiles').update({ invite_code: code }).eq('id', userId);
      data = { ...data, invite_code: code };
    }

    // Apply referral reward (only once — referred_by is null before applying)
    if (!data.referred_by) {
      const refCode = localStorage.getItem('ps_ref');
      if (refCode) {
        const { data: inviter } = await supabase
          .from('profiles')
          .select('id, credits')
          .eq('invite_code', refCode)
          .neq('id', userId)
          .single();
        if (inviter) {
          await supabase.from('profiles').update({ credits: (inviter.credits || 0) + 50 }).eq('id', inviter.id);
          await supabase.from('profiles').update({ credits: (data.credits || 0) + 30, referred_by: inviter.id }).eq('id', userId);
          data = { ...data, credits: (data.credits || 0) + 30, referred_by: inviter.id };
        }
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
