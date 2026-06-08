import { useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';

const RARITY_GLOW = { common:'#9CA3AF', uncommon:'#3B82F6', rare:'#7C3AED', legendary:'#F59E0B' };
const CATEGORY_LABELS = {
  milestone:'🏅 ציון דרך', streak:'🔥 רצף', time:'⏱️ זמן',
  social:'👥 חברתי', dedication:'💪 מסירות',
};

const ACHIEVEMENTS = [
  { id:'first_session',  title:'מתחיל נלהב',       desc:'סיים סשן לימוד ראשון',      icon:'🚀', rarity:'common',    cat:'milestone',
    check:({p})    => (p?.total_studied_minutes||0)>0,
    prog: ({p})    => ({ cur:Math.min(1,p?.total_studied_minutes||0),  tot:1 }) },
  { id:'hours_10',       title:'עשר שעות',          desc:'צבור 10 שעות לימוד',        icon:'⏰', rarity:'common',    cat:'time',
    check:({p})    => (p?.total_studied_minutes||0)>=600,
    prog: ({p})    => ({ cur:Math.min(600,p?.total_studied_minutes||0), tot:600, label:h=>Math.floor(h/60)+'/'+'10 שע׳' }) },
  { id:'hours_50',       title:'50 שעות לימוד',     desc:'צבור 50 שעות לימוד',        icon:'⏱️', rarity:'uncommon',  cat:'time',
    check:({p})    => (p?.total_studied_minutes||0)>=3000,
    prog: ({p})    => ({ cur:Math.min(3000,p?.total_studied_minutes||0), tot:3000 }) },
  { id:'hours_100',      title:'100 שעות לימוד',    desc:'צבור 100 שעות לימוד',       icon:'🏆', rarity:'rare',      cat:'time',
    check:({p})    => (p?.total_studied_minutes||0)>=6000,
    prog: ({p})    => ({ cur:Math.min(6000,p?.total_studied_minutes||0), tot:6000 }) },
  { id:'streak_3',       title:'שלושה ימים ברצף',   desc:'למד 3 ימים ברצף',           icon:'🔥', rarity:'common',    cat:'streak',
    check:({p})    => (p?.streak_best||0)>=3,
    prog: ({p})    => ({ cur:Math.min(3, p?.streak_best||0),  tot:3 }) },
  { id:'streak_7',       title:'שבוע מושלם',        desc:'למד 7 ימים ברצף',           icon:'⭐', rarity:'uncommon',  cat:'streak',
    check:({p})    => (p?.streak_best||0)>=7,
    prog: ({p})    => ({ cur:Math.min(7, p?.streak_best||0),  tot:7 }) },
  { id:'streak_30',      title:'רץ מרתון',          desc:'למד 30 ימים ברצף',          icon:'🏃', rarity:'rare',      cat:'streak',
    check:({p})    => (p?.streak_best||0)>=30,
    prog: ({p})    => ({ cur:Math.min(30,p?.streak_best||0),  tot:30 }) },
  { id:'tasks_10',       title:'עשר משימות',        desc:'השלם 10 משימות',            icon:'✅', rarity:'common',    cat:'milestone',
    check:({ct})   => ct>=10,
    prog: ({ct})   => ({ cur:Math.min(10,ct), tot:10 }) },
  { id:'tasks_50',       title:'מאסטר משימות',      desc:'השלם 50 משימות',            icon:'🎯', rarity:'uncommon',  cat:'milestone',
    check:({ct})   => ct>=50,
    prog: ({ct})   => ({ cur:Math.min(50,ct), tot:50 }) },
  { id:'tasks_100',      title:'מכונת משימות',      desc:'השלם 100 משימות',           icon:'💪', rarity:'rare',      cat:'milestone',
    check:({ct})   => ct>=100,
    prog: ({ct})   => ({ cur:Math.min(100,ct), tot:100 }) },
  { id:'first_friend',   title:'חבר ראשון',         desc:'הוסף חבר ראשון לרשימה',     icon:'👋', rarity:'common',    cat:'social',
    check:({fc})   => fc>=1,
    prog: ({fc})   => ({ cur:Math.min(1,fc), tot:1 }) },
  { id:'friends_5',      title:'חוג חברים',         desc:'צבור 5 חברים',              icon:'👥', rarity:'uncommon',  cat:'social',
    check:({fc})   => fc>=5,
    prog: ({fc})   => ({ cur:Math.min(5,fc), tot:5 }) },
  { id:'invited_friend', title:'שגריר פרוסטאדי',   desc:'הזמן חבר שנרשם לאפליקציה', icon:'🌟', rarity:'uncommon',  cat:'social',
    check:({ic})   => ic>=1,
    prog: ({ic})   => ({ cur:Math.min(1,ic||0), tot:1 }) },
  { id:'pact_creator',   title:'צוות למידה',        desc:'פתח צוות למידה עם חבר',     icon:'🤝', rarity:'uncommon',  cat:'social',
    check:({hasPact}) => hasPact,
    prog: ({hasPact}) => ({ cur:hasPact?1:0, tot:1 }) },
  { id:'week_200',       title:'שבוע שיא',          desc:'למד 200 דקות (3.3 שע׳) בשבוע', icon:'📅', rarity:'common', cat:'dedication',
    check:({p})    => (p?.weekly_studied_minutes||0)>=200,
    prog: ({p})    => ({ cur:Math.min(200,p?.weekly_studied_minutes||0), tot:200 }) },
  { id:'legend',         title:'גאון הסמסטר',       desc:'100 שעות, 7-day streak, 5 חברים', icon:'👑', rarity:'legendary', cat:'dedication',
    check:({p,fc}) => (p?.total_studied_minutes||0)>=6000 && (p?.streak_best||0)>=7 && fc>=5,
    prog: ({p,fc}) => {
      const c1 = Math.min(1,(p?.total_studied_minutes||0)/6000);
      const c2 = Math.min(1,(p?.streak_best||0)/7);
      const c3 = Math.min(1,fc/5);
      return { cur:Math.round(((c1+c2+c3)/3)*100), tot:100 };
    } },
];

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
