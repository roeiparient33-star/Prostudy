import { useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { ACHIEVEMENTS, RARITY_GLOW, CATEGORY_LABELS } from '../data/achievements';


export default function Achievements() {
  const { user, profile, updateProfile } = useAuth();
  const { tasks }                        = useData();
  const [friendCount,  setFriendCount]   = useState(0);
  const [inviteCount,  setInviteCount]   = useState(0);
  const [hasPact,      setHasPact]       = useState(false);
  const [dataReady,    setDataReady]     = useState(false);
  const unlockSavedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('friendships').select('id',{count:'exact',head:true})
        .eq('status','accepted').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
      supabase.from('profiles').select('id',{count:'exact',head:true}).eq('referred_by', user.id),
      supabase.from('pact_members').select('pact_id',{count:'exact',head:true}).eq('user_id', user.id),
    ]).then(([fr, inv, pc]) => {
      setFriendCount(fr.count || 0);
      setInviteCount(inv.count || 0);
      setHasPact((pc.count || 0) > 0);
      setDataReady(true);
    });
  }, [user]);

  const completedTasks = tasks.filter(t => t.completed).length;

  const ctx = { p:profile, ct:completedTasks, fc:friendCount, ic:inviteCount, hasPact };

  const computed = ACHIEVEMENTS.map(a => {
    const isUnlocked = a.check(ctx);
    const existingTs = profile?.achievements_unlocked?.[a.id];
    return { ...a, isUnlocked, unlockedAt: existingTs || null };
  });

  // Save newly unlocked achievements (run once when data is ready)
  useEffect(() => {
    if (!dataReady || !profile || unlockSavedRef.current) return;
    unlockSavedRef.current = true;
    const existing = profile.achievements_unlocked || {};
    const nowTs = new Date().toISOString();
    const updates = {};
    computed.forEach(a => {
      if (a.isUnlocked && !existing[a.id]) updates[a.id] = nowTs;
    });
    if (Object.keys(updates).length > 0) {
      updateProfile({ achievements_unlocked: { ...existing, ...updates } });
    }
  }, [dataReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const unlocked = computed.filter(a => a.isUnlocked);
  const locked   = computed.filter(a => !a.isUnlocked);
  const pct      = Math.round((unlocked.length / computed.length) * 100);

  return (
    <div className="page-enter">
      <div className="achievements-page-header">
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.4, color:'var(--text)' }}>ארון הגביעים</h2>
          <p style={{ fontSize:13, color:'var(--text-3)', marginTop:4 }}>
            {unlocked.length} מתוך {computed.length} הישגים
          </p>
        </div>
        <div className="achievements-summary">
          <div className="achievements-summary-stat">
            <span className="achievements-summary-value" style={{color:'var(--accent)'}}>{unlocked.length}</span>
            <span className="achievements-summary-label">הושגו</span>
          </div>
          <div style={{width:1,background:'var(--border)',margin:'4px 0'}}/>
          <div className="achievements-summary-stat">
            <span className="achievements-summary-value">{locked.length}</span>
            <span className="achievements-summary-label">נעולים</span>
          </div>
        </div>
      </div>

      <div className="achievements-overall-progress">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <span style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>התקדמות כוללת</span>
          <span style={{fontSize:13,color:'var(--text-2)'}}>{pct}%</span>
        </div>
        <ProgressBar value={pct} color="var(--accent)" showLabel={false}/>
        {!dataReady && <div style={{fontSize:12,color:'var(--text-3)',marginTop:8}}>טוען נתונים...</div>}
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div style={{marginBottom:32}}>
          <div className="achievements-section-title"><span>✨</span><span>הושגו ({unlocked.length})</span></div>
          <div className="achievements-grid" data-tour="achievements-grid">
            {unlocked.map(a => {
              const gc = RARITY_GLOW[a.rarity] ?? '#9CA3AF';
              return (
                <div key={a.id} className={`achievement-card unlocked ${a.rarity}`}>
                  <div className="achievement-card-glow" style={{background:gc}}/>
                  <div className="achievement-card-icon-wrap" style={{background:`${gc}18`,border:`1px solid ${gc}30`}}>
                    {a.icon}
                  </div>
                  <div className="achievement-card-title">{a.title}</div>
                  <div className="achievement-card-desc">{a.desc}</div>
                  <div style={{fontSize:11.5,color:'var(--text-3)',marginBottom:8}}>{CATEGORY_LABELS[a.cat]}</div>
                  {a.unlockedAt && (
                    <div className="achievement-unlock-date">
                      <span>✓</span>
                      <span>{new Date(a.unlockedAt).toLocaleDateString('he-IL',{day:'numeric',month:'long'})}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked */}
      <div>
        <div className="achievements-section-title"><span>🔒</span><span>נעולים ({locked.length})</span></div>
        <div className="achievements-grid">
          {locked.map(a => {
            const gc = RARITY_GLOW[a.rarity] ?? '#9CA3AF';
            const {cur, tot} = a.prog(ctx);
            const pctA = tot ? Math.round((cur/tot)*100) : 0;
            return (
              <div key={a.id} className="achievement-card locked">
                <div className="achievement-card-icon-wrap" style={{background:'#F3F4F6'}}>{a.icon}</div>
                <div className="achievement-card-title">{a.title}</div>
                <div className="achievement-card-desc">{a.desc}</div>
                <div style={{fontSize:11.5,color:'var(--text-3)',marginBottom:10}}>{CATEGORY_LABELS[a.cat]}</div>
                <div className="achievement-lock-progress">
                  <div className="achievement-lock-progress-text">{cur}/{tot} · {pctA}%</div>
                  <ProgressBar value={pctA} color={gc} showLabel={false} size="sm"/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {unlocked.length === 0 && locked.length > 0 && (
        <div style={{textAlign:'center',padding:'16px 0',color:'var(--text-3)',fontSize:13}}>
          למד יום אחד כדי לפתוח את ההישג הראשון שלך 🚀
        </div>
      )}
    </div>
  );
}
